"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const env_1 = __importDefault(require("./config/env"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const admin_auth_routes_1 = __importDefault(require("./routes/admin.auth.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const admin_user_routes_1 = __importDefault(require("./routes/admin.user.routes"));
const admin_complaint_routes_1 = __importDefault(require("./routes/admin.complaint.routes"));
const admin_analytics_routes_1 = __importDefault(require("./routes/admin.analytics.routes"));
const admin_chat_routes_1 = __importDefault(require("./routes/admin.chat.routes"));
const admin_direct_message_routes_1 = __importDefault(require("./routes/admin.direct-message.routes"));
const admin_activity_log_routes_1 = __importDefault(require("./routes/admin.activity-log.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const city_corporation_routes_1 = __importDefault(require("./routes/city-corporation.routes"));
const public_city_corporation_routes_1 = __importDefault(require("./routes/public-city-corporation.routes"));
// import thanaRoutes from './routes/thana.routes'; // Thana routes disabled - using Zone/Ward now
const zone_routes_1 = __importDefault(require("./routes/zone.routes"));
const public_zone_routes_1 = __importDefault(require("./routes/public-zone.routes"));
const ward_routes_1 = __importDefault(require("./routes/ward.routes"));
const public_ward_routes_1 = __importDefault(require("./routes/public-ward.routes"));
const security_middleware_1 = require("./middlewares/security.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
console.log('🚀 Starting Clean Care API Server...');
console.log('🔧 Importing admin auth routes...');
console.log('🔧 Importing admin user routes...');
console.log('🔧 Importing admin complaint routes...');
console.log('🔧 Importing admin analytics routes...');
console.log('🔧 Importing admin chat routes...');
const app = (0, express_1.default)();
// Security middleware - Apply first for maximum protection
app.use(security_middleware_1.helmetConfig); // Security headers
app.use(security_middleware_1.securityHeaders); // Additional security headers
app.use(security_middleware_1.noSqlInjectionPrevention); // NoSQL injection prevention
app.use(security_middleware_1.parameterPollutionPrevention); // HTTP parameter pollution prevention
// Global IP-based rate limiting - 1000 requests per minute per IP
// Requirements: 12.18
app.use('/api', (0, rate_limit_middleware_1.ipRateLimit)(1000, 60 * 1000));
// Middleware to add prisma to request
app.use((req, res, next) => {
    req.prisma = prisma_1.default;
    next();
});
app.use(express_1.default.json({ limit: '2mb' }));
app.use((0, cookie_parser_1.default)());
// XSS prevention - Apply after body parsing
app.use(security_middleware_1.xssPrevention);
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
app.get('/', (_req, res) => {
    res.json({
        message: 'Clean Care API Server is running!',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});
app.get('/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, status: 'healthy' }));
// Serve admin panel static files
const adminPanelPath = path_1.default.join(__dirname, '../../clean-care-admin/dist');
console.log('🔧 Admin panel path:', adminPanelPath);
// Check if directory exists and log contents
const fs_1 = __importDefault(require("fs"));
try {
    if (fs_1.default.existsSync(adminPanelPath)) {
        console.log('✅ Admin panel directory exists');
        const files = fs_1.default.readdirSync(adminPanelPath);
        console.log('📂 Files in admin panel directory:', files);
    }
    else {
        console.error('❌ Admin panel directory does NOT exist at:', adminPanelPath);
    }
}
catch (err) {
    console.error('❌ Error checking admin panel directory:', err);
}
// Serve static files from admin panel dist folder at /admin
app.use('/admin', express_1.default.static(adminPanelPath));
// Explicitly handle /admin route (without trailing slash)
app.get('/admin', (_req, res) => {
    res.sendFile(path_1.default.join(adminPanelPath, 'index.html'));
});
// Handle SPA routing for admin panel - serve index.html for any /admin/* requests
app.get('/admin/*', (_req, res) => {
    res.sendFile(path_1.default.join(adminPanelPath, 'index.html'));
});
console.log('✅ Admin panel served at /admin');
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
app.use('/api/admin/users', admin_user_routes_1.default); // Admin user management routes
console.log('✅ Admin user routes registered at /api/admin/users');
app.use('/api/admin/complaints', admin_complaint_routes_1.default); // Admin complaint management routes
console.log('✅ Admin complaint routes registered at /api/admin/complaints');
app.use('/api/admin/analytics', admin_analytics_routes_1.default); // Admin analytics routes
console.log('✅ Admin analytics routes registered at /api/admin/analytics');
// Redirect /login to /admin/login (helper for common mistake)
app.get('/login', (_req, res) => {
    res.redirect('/admin/login');
});
app.use('/api/admin/chat', admin_chat_routes_1.default); // Admin chat routes
console.log('✅ Admin chat routes registered at /api/admin/chat');
app.use('/api/admin/direct-chat', admin_direct_message_routes_1.default); // Admin direct message routes
console.log('✅ Admin direct message routes registered at /api/admin/direct-chat');
app.use('/api/admin/activity-logs', admin_activity_log_routes_1.default); // Admin activity log routes
console.log('✅ Admin activity log routes registered at /api/admin/activity-logs');
app.use('/api/dashboard', dashboard_routes_1.default); // Dashboard statistics routes
console.log('✅ Dashboard routes registered at /api/dashboard');
app.use('/api/admin/dashboard', dashboard_routes_1.default); // Admin dashboard statistics routes with geographical filtering
console.log('✅ Admin dashboard routes registered at /api/admin/dashboard');
app.use('/api/categories', category_routes_1.default); // Category routes
console.log('✅ Category routes registered at /api/categories');
app.use('/api/admin/city-corporations', city_corporation_routes_1.default); // City Corporation routes
console.log('✅ City Corporation routes registered at /api/admin/city-corporations');
app.use('/api/city-corporations', public_city_corporation_routes_1.default); // Public City Corporation routes
console.log('✅ Public City Corporation routes registered at /api/city-corporations');
// app.use('/api/admin/thanas', thanaRoutes); // Thana routes disabled - using Zone/Ward now
// console.log('✅ Thana routes registered at /api/admin/thanas');
app.use('/api/admin/zones', zone_routes_1.default); // Zone routes
console.log('✅ Zone routes registered at /api/admin/zones');
app.use('/api/zones', public_zone_routes_1.default); // Public Zone routes
console.log('✅ Public Zone routes registered at /api/zones');
app.use('/api/admin/wards', ward_routes_1.default); // Ward routes
console.log('✅ Ward routes registered at /api/admin/wards');
app.use('/api/wards', public_ward_routes_1.default); // Public Ward routes
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
app.use('/auth', auth_routes_1.default);
app.use('/users', user_routes_1.default);
exports.default = app;
