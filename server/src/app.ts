import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './utils/prisma';
import env from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { AuthRequest } from './middlewares/auth.middleware';

const app = express();

// Add prisma to request object
declare global {
  namespace Express {
    interface Request {
      prisma?: typeof prisma;
    }
  }
}

// Middleware to add prisma to request
app.use((req: Request, res: Response, next) => {
  req.prisma = prisma;
  next();
});
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

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));

// API routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Legacy routes without /api prefix (for backward compatibility)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

export default app;