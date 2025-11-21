import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import prisma from './utils/prisma';
import env from './config/env';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminAuthRoutes from './routes/admin.auth.routes';
import complaintRoutes from './routes/complaint.routes';
import uploadRoutes from './routes/upload.routes';
import adminUserRoutes from './routes/admin.user.routes';
import adminComplaintRoutes from './routes/admin.complaint.routes';
import adminAnalyticsRoutes from './routes/admin.analytics.routes';
import adminChatRoutes from './routes/admin.chat.routes';
import categoryRoutes from './routes/category.routes';
import cityCorporationRoutes from './routes/city-corporation.routes';
import publicCityCorporationRoutes from './routes/public-city-corporation.routes';
import thanaRoutes from './routes/thana.routes';
import { AuthRequest } from './middlewares/auth.middleware';

console.log('🚀 Starting Clean Care API Server...');
console.log('🔧 Importing admin auth routes...');
console.log('🔧 Importing admin user routes...');
console.log('🔧 Importing admin complaint routes...');
console.log('🔧 Importing admin analytics routes...');
console.log('🔧 Importing admin chat routes...');

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
app.use(cookieParser());
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

app.use('/api/complaints', complaintRoutes);
console.log('✅ Complaint routes registered at /api/complaints');

app.use('/api/uploads', uploadRoutes);
console.log('✅ Upload routes registered at /api/uploads');

app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication routes
console.log('✅ Admin auth routes registered at /api/admin/auth');

app.use('/api/admin/users', adminUserRoutes); // Admin user management routes
console.log('✅ Admin user routes registered at /api/admin/users');

app.use('/api/admin/complaints', adminComplaintRoutes); // Admin complaint management routes
console.log('✅ Admin complaint routes registered at /api/admin/complaints');

app.use('/api/admin/analytics', adminAnalyticsRoutes); // Admin analytics routes
console.log('✅ Admin analytics routes registered at /api/admin/analytics');

app.use('/api/admin/chat', adminChatRoutes); // Admin chat routes
console.log('✅ Admin chat routes registered at /api/admin/chat');

app.use('/api/categories', categoryRoutes); // Category routes
console.log('✅ Category routes registered at /api/categories');

app.use('/api/admin/city-corporations', cityCorporationRoutes); // City Corporation routes
console.log('✅ City Corporation routes registered at /api/admin/city-corporations');

app.use('/api/city-corporations', publicCityCorporationRoutes); // Public City Corporation routes
console.log('✅ Public City Corporation routes registered at /api/city-corporations');

app.use('/api/admin/thanas', thanaRoutes); // Thana routes
console.log('✅ Thana routes registered at /api/admin/thanas');

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
