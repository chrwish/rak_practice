import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { JwtPayload, UserRecord } from './types';
import { findUserByEmail, setTwoFactorSecret, enableTwoFactor, disableTwoFactor, findUserById } from './db';

dotenv.config();

const JWT_SECRET: Secret = (process.env.JWT_SECRET as string) || 'dev_secret';
const signJwt = jwt.sign as (payload: object, secretOrPrivateKey: Secret, options: SignOptions) => string;

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds: number = 900): string {
  return signJwt(payload as object, JWT_SECRET, { expiresIn: expiresInSeconds });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function authenticateWithPassword(email: string, password: string): Promise<
  | { status: 'OK_2FA_REQUIRED'; tempToken: string; twoFactorEnabled: boolean }
  | { status: 'OK_AUTHENTICATED'; accessToken: string; twoFactorEnabled: boolean }
> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  if (user.twoFactorEnabled) {
    const tempToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: false }, 600);
    return { status: 'OK_2FA_REQUIRED', tempToken, twoFactorEnabled: true };
  }

  const accessToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: true }, 3600);
  return { status: 'OK_AUTHENTICATED', accessToken, twoFactorEnabled: false };
}

export function generateTwoFactorSecret(user: UserRecord) {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${user.email})`,
    length: 20,
  });
  return secret; // contains ascii, hex, base32, otpauth_url
}

export async function getTwoFactorQrDataUrl(otpauthUrl: string): Promise<string> {
  return qrcode.toDataURL(otpauthUrl);
}

export async function startTwoFactorEnrollment(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');
  const secret = generateTwoFactorSecret(user);
  await setTwoFactorSecret(user.id, secret.base32);
  const qrCodeDataUrl = await getTwoFactorQrDataUrl(secret.otpauth_url!);
  return { secretBase32: secret.base32, otpauthUrl: secret.otpauth_url!, qrCodeDataUrl };
}

export async function confirmTwoFactorEnrollment(userId: string, token: string) {
  const user = await findUserById(userId);
  if (!user) throw new Error('User not found');
  if (!user.twoFactorSecret) throw new Error('No 2FA secret set');
  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!verified) throw new Error('Invalid 2FA code');
  await enableTwoFactor(user.id);
  return true;
}

export async function disableTwoFactorForUser(userId: string) {
  await disableTwoFactor(userId);
}

export async function verifyTwoFactorAndIssueAccess(tempToken: string, token: string) {
  const payload = verifyToken(tempToken);
  if (payload.twoFactorPassed) throw new Error('Token already authenticated');
  const user = await findUserById(payload.userId);
  if (!user) throw new Error('User not found');
  if (!user.twoFactorEnabled || !user.twoFactorSecret) throw new Error('2FA not enabled');
  const ok = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
  if (!ok) throw new Error('Invalid 2FA code');
  const accessToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: true }, 3600);
  return { accessToken };
}