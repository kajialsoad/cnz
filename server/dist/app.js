"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const env_1 = __importDefault(require("./config/env"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_auth_routes_1 = __importDefault(require("./routes/admin.auth.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
console.log('🚀 Starting Clean Care API Server...');
console.log('🔧 Importing admin auth routes...');
const app = (0, express_1.default)();
// Middleware to add prisma to request
app.use((req, res, next) => {
    req.prisma = prisma_1.default;
    next();
});
app.use(express_1.default.json({ limit: '2mb' }));
// Allow multiple origins and any localhost:* during development
const allowedOrigins = env_1.default.CORS_ORIGINS;
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes('*'))
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        // Allow localhost and 127.0.0.1
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
            return callback(null, true);
        // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin))
            return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));
// Health check endpoint
app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
// API routes with /api prefix
app.use('/api/auth', auth_routes_1.default);
console.log('✅ Regular auth routes registered at /api/auth');
app.use('/api/users', user_routes_1.default);
console.log('✅ User routes registered at /api/users');
app.use('/api/complaints', complaint_routes_1.default);
console.log('✅ Complaint routes registered at /api/complaints');
app.use('/api/uploads', upload_routes_1.default);
console.log('✅ Upload routes registered at /api/uploads');
app.use('/api/admin/auth', admin_auth_routes_1.default); // Admin authentication routes
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
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
exports.default = app;
