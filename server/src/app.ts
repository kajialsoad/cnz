import express, { Request, Response } from 'express';
import cors from 'cors';
import env from './config/env';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));
app.use('/auth', authRoutes);

export default app;