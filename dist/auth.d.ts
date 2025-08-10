import speakeasy from 'speakeasy';
import { JwtPayload, UserRecord } from './types';
export declare function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds?: number): string;
export declare function verifyToken(token: string): JwtPayload;
export declare function authenticateWithPassword(email: string, password: string): Promise<{
    status: 'OK_2FA_REQUIRED';
    tempToken: string;
    twoFactorEnabled: boolean;
} | {
    status: 'OK_AUTHENTICATED';
    accessToken: string;
    twoFactorEnabled: boolean;
}>;
export declare function generateTwoFactorSecret(user: UserRecord): speakeasy.GeneratedSecret;
export declare function getTwoFactorQrDataUrl(otpauthUrl: string): Promise<string>;
export declare function startTwoFactorEnrollment(userId: string): Promise<{
    secretBase32: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
}>;
export declare function confirmTwoFactorEnrollment(userId: string, token: string): Promise<boolean>;
export declare function disableTwoFactorForUser(userId: string): Promise<void>;
export declare function verifyTwoFactorAndIssueAccess(tempToken: string, token: string): Promise<{
    accessToken: string;
}>;
//# sourceMappingURL=auth.d.ts.map