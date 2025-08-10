"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUserByEmail = findUserByEmail;
exports.findUserById = findUserById;
exports.setTwoFactorSecret = setTwoFactorSecret;
exports.enableTwoFactor = enableTwoFactor;
exports.disableTwoFactor = disableTwoFactor;
const crypto_1 = require("crypto");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const usersByEmail = new Map();
const usersById = new Map();
async function createUser(email, password) {
    const existing = usersByEmail.get(email.toLowerCase());
    if (existing)
        throw new Error('User already exists');
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = {
        id: (0, crypto_1.randomUUID)(),
        email: email.toLowerCase(),
        passwordHash,
        twoFactorEnabled: false,
    };
    usersByEmail.set(user.email, user);
    usersById.set(user.id, user);
    return user;
}
async function findUserByEmail(email) {
    return usersByEmail.get(email.toLowerCase());
}
async function findUserById(id) {
    return usersById.get(id);
}
async function setTwoFactorSecret(userId, secretBase32) {
    const user = usersById.get(userId);
    if (!user)
        throw new Error('User not found');
    user.twoFactorSecret = secretBase32;
}
async function enableTwoFactor(userId) {
    const user = usersById.get(userId);
    if (!user)
        throw new Error('User not found');
    user.twoFactorEnabled = true;
}
async function disableTwoFactor(userId) {
    const user = usersById.get(userId);
    if (!user)
        throw new Error('User not found');
    user.twoFactorEnabled = false;
    delete user.twoFactorSecret;
}
//# sourceMappingURL=db.js.map