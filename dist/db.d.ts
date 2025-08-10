import { UserRecord } from './types';
export declare function createUser(email: string, password: string): Promise<UserRecord>;
export declare function findUserByEmail(email: string): Promise<UserRecord | undefined>;
export declare function findUserById(id: string): Promise<UserRecord | undefined>;
export declare function setTwoFactorSecret(userId: string, secretBase32: string): Promise<void>;
export declare function enableTwoFactor(userId: string): Promise<void>;
export declare function disableTwoFactor(userId: string): Promise<void>;
//# sourceMappingURL=db.d.ts.map