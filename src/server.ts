import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { authenticateWithPassword, startTwoFactorEnrollment, confirmTwoFactorEnrollment, verifyTwoFactorAndIssueAccess, verifyToken } from './auth';
import { createUser, findUserById, disableTwoFactor } from './db';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const TwoFactorCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = RegisterSchema.parse(req.body);
    const user = await createUser(email, password);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Bad request' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await authenticateWithPassword(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

app.post('/2fa/verify', async (req, res) => {
  try {
    const { tempToken } = req.query as { tempToken?: string };
    const { code } = TwoFactorCodeSchema.parse(req.body);
    if (!tempToken) throw new Error('Missing tempToken');
    const { accessToken } = await verifyTwoFactorAndIssueAccess(tempToken, code);
    res.json({ accessToken });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid code' });
  }
});

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const auth = req.headers.authorization;
    if (!auth) throw new Error('Missing Authorization header');
    const parts = auth.split(' ');
    const token = parts.length === 2 ? parts[1] : undefined;
    if (!token) throw new Error('Invalid Authorization header');
    const payload = verifyToken(token);
    if (!payload.twoFactorPassed) throw new Error('2FA required');
    (req as any).auth = payload;
    next();
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
}

app.post('/2fa/start', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).auth.userId as string;
    const data = await startTwoFactorEnrollment(userId);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Cannot start 2FA' });
  }
});

app.post('/2fa/confirm', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).auth.userId as string;
    const { code } = TwoFactorCodeSchema.parse(req.body);
    await confirmTwoFactorEnrollment(userId, code);
    res.json({ enabled: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Cannot confirm 2FA' });
  }
});

app.post('/2fa/disable', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).auth.userId as string;
    await disableTwoFactor(userId);
    res.json({ enabled: false });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Cannot disable 2FA' });
  }
});

app.get('/me', requireAuth, async (req, res) => {
  const userId = (req as any).auth.userId as string;
  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user.id, email: user.email, twoFactorEnabled: user.twoFactorEnabled });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});