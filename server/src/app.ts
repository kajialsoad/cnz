import express, { Request, Response } from 'express';
import path from 'path';
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
import adminDirectMessageRoutes from './routes/admin.direct-message.routes';
import adminActivityLogRoutes from './routes/admin.activity-log.routes';
import dashboardRoutes from './routes/dashboard.routes';
import categoryRoutes from './routes/category.routes';
import cityCorporationRoutes from './routes/city-corporation.routes';
import publicCityCorporationRoutes from './routes/public-city-corporation.routes';
// import thanaRoutes from './routes/thana.routes'; // Thana routes disabled - using Zone/Ward now
import zoneRoutes from './routes/zone.routes';
import publicZoneRoutes from './routes/public-zone.routes';
import wardRoutes from './routes/ward.routes';
import publicWardRoutes from './routes/public-ward.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import adminReviewRoutes from './routes/admin.review.routes';
import { AuthRequest } from './middlewares/auth.middleware';
import {
  helmetConfig,
  noSqlInjectionPrevention,
  parameterPollutionPrevention,
  xssPrevention,
  securityHeaders,
} from './middlewares/security.middleware';
import { ipRateLimit, apiRateLimit } from './middlewares/rate-limit.middleware';

const app = express();

// Add prisma to request object
declare global {
  namespace Express {
    interface Request {
      prisma?: typeof prisma;
    }
  }
}

// Security middleware - Apply first for maximum protection
app.use(helmetConfig); // Security headers
app.use(securityHeaders); // Additional security headers
app.use(noSqlInjectionPrevention); // NoSQL injection prevention
app.use(parameterPollutionPrevention); // HTTP parameter pollution prevention

// Debug logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
  next();
});

// Global IP-based rate limiting - 1000 requests per minute per IP
// Requirements: 12.18
app.use('/api', ipRateLimit(1000, 60 * 1000));

// Middleware to add prisma to request
app.use((req: Request, res: Response, next) => {
  req.prisma = prisma;
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// XSS prevention - Apply after body parsing
app.use(xssPrevention);
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
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Clean Care API Server is running!',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true, status: 'healthy' }));

// Serve admin panel static files
const adminPanelPath = path.join(__dirname, '../../clean-care-admin/dist');
console.log('🔧 Admin panel path:', adminPanelPath);

// Check if directory exists and log contents
import fs from 'fs';
try {
  if (fs.existsSync(adminPanelPath)) {
    console.log('✅ Admin panel directory exists');
    const files = fs.readdirSync(adminPanelPath);
    console.log('📂 Files in admin panel directory:', files);
  } else {
    console.error('❌ Admin panel directory does NOT exist at:', adminPanelPath);
  }
} catch (err) {
  console.error('❌ Error checking admin panel directory:', err);
}

// Serve static files from admin panel dist folder at /admin
app.use('/admin', express.static(adminPanelPath));

// Explicitly handle /admin route (without trailing slash)
app.get('/admin', (_req: Request, res: Response) => {
  res.sendFile(path.join(adminPanelPath, 'index.html'));
});

// Handle SPA routing for admin panel - serve index.html for any /admin/* requests
app.get('/admin/*', (_req: Request, res: Response) => {
  res.sendFile(path.join(adminPanelPath, 'index.html'));
});

console.log('✅ Admin panel served at /admin');

// API routes with /api prefix
app.use('/api/auth', authRoutes);
console.log('✅ Regular auth routes registered at /api/auth');

app.use('/api/users', userRoutes);
console.log('✅ User routes registered at /api/users');

// Review routes MUST be registered BEFORE complaint routes
// because complaint routes have authGuard on all routes
app.use('/api/complaints', reviewRoutes); // Review routes (nested under complaints)
console.log('✅ Review routes registered at /api/complaints/:complaintId/review(s)');

app.use('/api/complaints', complaintRoutes);
console.log('✅ Complaint routes registered at /api/complaints');

app.use('/api/uploads', uploadRoutes);
console.log('✅ Upload routes registered at /api/uploads');

app.use('/api/notifications', notificationRoutes); // Notification routes
console.log('✅ Notification routes registered at /api/notifications');

app.use('/api/admin/auth', adminAuthRoutes); // Admin authentication routes
console.log('✅ Admin auth routes registered at /api/admin/auth');

app.use('/api/admin/users', adminUserRoutes); // Admin user management routes
console.log('✅ Admin user routes registered at /api/admin/users');

app.use('/api/admin/complaints', adminComplaintRoutes); // Admin complaint management routes
console.log('✅ Admin complaint routes registered at /api/admin/complaints');

app.use('/api/admin/complaints', adminReviewRoutes); // Admin review analytics routes
console.log('✅ Admin review analytics routes registered at /api/admin/complaints/analytics/reviews');

app.use('/api/admin/analytics', adminAnalyticsRoutes); // Admin analytics routes
console.log('✅ Admin analytics routes registered at /api/admin/analytics');

// Redirect /login to /admin/login (helper for common mistake)
app.get('/login', (_req: Request, res: Response) => {
  res.redirect('/admin/login');
});

app.use('/api/admin/chat', adminChatRoutes); // Admin chat routes
console.log('✅ Admin chat routes registered at /api/admin/chat');

app.use('/api/admin/direct-chat', adminDirectMessageRoutes); // Admin direct message routes
console.log('✅ Admin direct message routes registered at /api/admin/direct-chat');

app.use('/api/admin/activity-logs', adminActivityLogRoutes); // Admin activity log routes
console.log('✅ Admin activity log routes registered at /api/admin/activity-logs');

import adminSystemConfigRoutes from './routes/admin.system-config.routes';
import systemConfigRoutes from './routes/system-config.routes';

app.use('/api/admin/config', adminSystemConfigRoutes); // Admin system config routes
console.log('✅ Admin system config routes registered at /api/admin/config');

app.use('/api/config', systemConfigRoutes); // Public/App system config routes
console.log('✅ App system config routes registered at /api/config');

app.use('/api/dashboard', dashboardRoutes); // Dashboard statistics routes
console.log('✅ Dashboard routes registered at /api/dashboard');

app.use('/api/admin/dashboard', dashboardRoutes); // Admin dashboard statistics routes with geographical filtering
console.log('✅ Admin dashboard routes registered at /api/admin/dashboard');

app.use('/api/categories', categoryRoutes); // Category routes
console.log('✅ Category routes registered at /api/categories');

app.use('/api/admin/city-corporations', cityCorporationRoutes); // City Corporation routes
console.log('✅ City Corporation routes registered at /api/admin/city-corporations');

app.use('/api/city-corporations', publicCityCorporationRoutes); // Public City Corporation routes
console.log('✅ Public City Corporation routes registered at /api/city-corporations');

// app.use('/api/admin/thanas', thanaRoutes); // Thana routes disabled - using Zone/Ward now
// console.log('✅ Thana routes registered at /api/admin/thanas');

app.use('/api/admin/zones', zoneRoutes); // Zone routes
console.log('✅ Zone routes registered at /api/admin/zones');

app.use('/api/zones', publicZoneRoutes); // Public Zone routes
console.log('✅ Public Zone routes registered at /api/zones');

app.use('/api/admin/wards', wardRoutes); // Ward routes
console.log('✅ Ward routes registered at /api/admin/wards');

app.use('/api/wards', publicWardRoutes); // Public Ward routes
console.log('✅ Public Ward routes registered at /api/wards');

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


