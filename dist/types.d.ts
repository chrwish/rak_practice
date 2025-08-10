export interface UserRecord {
    id: string;
    email: string;
    passwordHash: string;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
}
export interface JwtPayload {
    userId: string;
    email: string;
    twoFactorPassed?: boolean;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=types.d.ts.map