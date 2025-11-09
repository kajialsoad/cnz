import express, { Request, Response } from 'express';
import cors from 'cors';
import env from './config/env';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(express.json({ limit: '2mb' }));
// Allow multiple origins and any localhost:* during development
const allowedOrigins = env.CORS_ORIGINS;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));
app.use('/auth', authRoutes);

export default app;