import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRecord } from './types';

const usersByEmail = new Map<string, UserRecord>();
const usersById = new Map<string, UserRecord>();

export async function createUser(email: string, password: string): Promise<UserRecord> {
  const existing = usersByEmail.get(email.toLowerCase());
  if (existing) throw new Error('User already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user: UserRecord = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    twoFactorEnabled: false,
  };
  usersByEmail.set(user.email, user);
  usersById.set(user.id, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<UserRecord | undefined> {
  return usersByEmail.get(email.toLowerCase());
}

export async function findUserById(id: string): Promise<UserRecord | undefined> {
  return usersById.get(id);
}

export async function setTwoFactorSecret(userId: string, secretBase32: string): Promise<void> {
  const user = usersById.get(userId);
  if (!user) throw new Error('User not found');
  user.twoFactorSecret = secretBase32;
}

export async function enableTwoFactor(userId: string): Promise<void> {
  const user = usersById.get(userId);
  if (!user) throw new Error('User not found');
  user.twoFactorEnabled = true;
}

export async function disableTwoFactor(userId: string): Promise<void> {
  const user = usersById.get(userId);
  if (!user) throw new Error('User not found');
  user.twoFactorEnabled = false;
  delete user.twoFactorSecret;
}