"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const auth_1 = require("./auth");
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
const RegisterSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(6) });
const LoginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(1) });
const TwoFactorCodeSchema = zod_1.z.object({ code: zod_1.z.string().regex(/^\d{6}$/) });
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.post('/register', async (req, res) => {
    try {
        const { email, password } = RegisterSchema.parse(req.body);
        const user = await (0, db_1.createUser)(email, password);
        res.status(201).json({ id: user.id, email: user.email });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Bad request' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = LoginSchema.parse(req.body);
        const result = await (0, auth_1.authenticateWithPassword)(email, password);
        res.json(result);
    }
    catch (err) {
        res.status(401).json({ error: err.message || 'Unauthorized' });
    }
});
app.post('/2fa/verify', async (req, res) => {
    try {
        const { tempToken } = req.query;
        const { code } = TwoFactorCodeSchema.parse(req.body);
        if (!tempToken)
            throw new Error('Missing tempToken');
        const { accessToken } = await (0, auth_1.verifyTwoFactorAndIssueAccess)(tempToken, code);
        res.json({ accessToken });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Invalid code' });
    }
});
function requireAuth(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth)
            throw new Error('Missing Authorization header');
        const parts = auth.split(' ');
        const token = parts.length === 2 ? parts[1] : undefined;
        if (!token)
            throw new Error('Invalid Authorization header');
        const payload = (0, auth_1.verifyToken)(token);
        if (!payload.twoFactorPassed)
            throw new Error('2FA required');
        req.auth = payload;
        next();
    }
    catch (err) {
        res.status(401).json({ error: err.message || 'Unauthorized' });
    }
}
app.post('/2fa/start', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        const data = await (0, auth_1.startTwoFactorEnrollment)(userId);
        res.json(data);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Cannot start 2FA' });
    }
});
app.post('/2fa/confirm', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { code } = TwoFactorCodeSchema.parse(req.body);
        await (0, auth_1.confirmTwoFactorEnrollment)(userId, code);
        res.json({ enabled: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Cannot confirm 2FA' });
    }
});
app.post('/2fa/disable', requireAuth, async (req, res) => {
    try {
        const userId = req.auth.userId;
        await (0, db_1.disableTwoFactor)(userId);
        res.json({ enabled: false });
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Cannot disable 2FA' });
    }
});
app.get('/me', requireAuth, async (req, res) => {
    const userId = req.auth.userId;
    const user = await (0, db_1.findUserById)(userId);
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    res.json({ id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled });
});
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map