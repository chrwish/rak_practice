export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // base32
}

export interface JwtPayload {
  userId: string;
  email: string;
  twoFactorPassed?: boolean;
  iat?: number;
  exp?: number;
}