"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.authenticateWithPassword = authenticateWithPassword;
exports.generateTwoFactorSecret = generateTwoFactorSecret;
exports.getTwoFactorQrDataUrl = getTwoFactorQrDataUrl;
exports.startTwoFactorEnrollment = startTwoFactorEnrollment;
exports.confirmTwoFactorEnrollment = confirmTwoFactorEnrollment;
exports.disableTwoFactorForUser = disableTwoFactorForUser;
exports.verifyTwoFactorAndIssueAccess = verifyTwoFactorAndIssueAccess;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const db_1 = require("./db");
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const signJwt = jsonwebtoken_1.default.sign;
function signToken(payload, expiresInSeconds = 900) {
    return signJwt(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
async function authenticateWithPassword(email, password) {
    const user = await (0, db_1.findUserByEmail)(email);
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    if (user.twoFactorEnabled) {
        const tempToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: false }, 600);
        return { status: 'OK_2FA_REQUIRED', tempToken, twoFactorEnabled: true };
    }
    const accessToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: true }, 3600);
    return { status: 'OK_AUTHENTICATED', accessToken, twoFactorEnabled: false };
}
function generateTwoFactorSecret(user) {
    const secret = speakeasy_1.default.generateSecret({
        name: `MyApp (${user.email})`,
        length: 20,
    });
    return secret; // contains ascii, hex, base32, otpauth_url
}
async function getTwoFactorQrDataUrl(otpauthUrl) {
    return qrcode_1.default.toDataURL(otpauthUrl);
}
async function startTwoFactorEnrollment(userId) {
    const user = await (0, db_1.findUserById)(userId);
    if (!user)
        throw new Error('User not found');
    const secret = generateTwoFactorSecret(user);
    await (0, db_1.setTwoFactorSecret)(user.id, secret.base32);
    const qrCodeDataUrl = await getTwoFactorQrDataUrl(secret.otpauth_url);
    return { secretBase32: secret.base32, otpauthUrl: secret.otpauth_url, qrCodeDataUrl };
}
async function confirmTwoFactorEnrollment(userId, token) {
    const user = await (0, db_1.findUserById)(userId);
    if (!user)
        throw new Error('User not found');
    if (!user.twoFactorSecret)
        throw new Error('No 2FA secret set');
    const verified = speakeasy_1.default.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 1,
    });
    if (!verified)
        throw new Error('Invalid 2FA code');
    await (0, db_1.enableTwoFactor)(user.id);
    return true;
}
async function disableTwoFactorForUser(userId) {
    await (0, db_1.disableTwoFactor)(userId);
}
async function verifyTwoFactorAndIssueAccess(tempToken, token) {
    const payload = verifyToken(tempToken);
    if (payload.twoFactorPassed)
        throw new Error('Token already authenticated');
    const user = await (0, db_1.findUserById)(payload.userId);
    if (!user)
        throw new Error('User not found');
    if (!user.twoFactorEnabled || !user.twoFactorSecret)
        throw new Error('2FA not enabled');
    const ok = speakeasy_1.default.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
    if (!ok)
        throw new Error('Invalid 2FA code');
    const accessToken = signToken({ userId: user.id, email: user.email, twoFactorPassed: true }, 3600);
    return { accessToken };
}
//# sourceMappingURL=auth.js.map