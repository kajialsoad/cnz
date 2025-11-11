import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './utils/prisma';
import env from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminAuthRoutes from './routes/admin.auth.routes';
import { AuthRequest } from './middlewares/auth.middleware';

console.log('🚀 Starting Clean Care API Server...');
console.log('🔧 Importing admin auth routes...');

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
    // Allow localhost and 127.0.0.1
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));

// API routes with /api prefix
app.use('/api/auth', authRoutes);
console.log('✅ Regular auth routes registered at /api/auth');

app.use('/api/users', userRoutes);
console.log('✅ User routes registered at /api/users');

app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication routes
console.log('✅ Admin auth routes registered at /api/admin/auth');

// Add test route to verify admin path works
app.get('/api/admin/test', (req, res) => {
    res.json({ 
        message: 'Admin routes base path is working!',
        timestamp: new Date().toISOString()
    });
});
console.log('✅ Admin test route added at /api/admin/test');

// Legacy routes without /api prefix (for backward compatibility)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

export default app;