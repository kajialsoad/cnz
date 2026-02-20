"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
const live_chat_routes_1 = __importDefault(require("./routes/live-chat.routes"));
const admin_live_chat_routes_1 = __importDefault(require("./routes/admin.live-chat.routes"));
const bot_message_routes_1 = __importDefault(require("./routes/bot-message.routes"));
const public_bot_message_routes_1 = __importDefault(require("./routes/public-bot-message.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const city_corporation_routes_1 = __importDefault(require("./routes/city-corporation.routes"));
const public_city_corporation_routes_1 = __importDefault(require("./routes/public-city-corporation.routes"));
// import thanaRoutes from './routes/thana.routes'; // Thana routes disabled - using Zone/Ward now
const zone_routes_1 = __importDefault(require("./routes/zone.routes"));
const public_zone_routes_1 = __importDefault(require("./routes/public-zone.routes"));
const ward_routes_1 = __importDefault(require("./routes/ward.routes"));
const public_ward_routes_1 = __importDefault(require("./routes/public-ward.routes"));
const waste_management_routes_1 = __importDefault(require("./routes/waste-management.routes"));
const gallery_routes_1 = __importDefault(require("./routes/gallery.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const admin_review_routes_1 = __importDefault(require("./routes/admin.review.routes"));
const security_middleware_1 = require("./middlewares/security.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const app = (0, express_1.default)();
// Debug logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    next();
});
// Serve admin panel static files - MOVED UP before security middleware
// Robust path resolution for admin panel
const getAdminPanelPath = () => {
    const potentialPaths = [
        path_1.default.join(__dirname, '../../clean-care-admin/dist'), // Standard dev/prod structure
        path_1.default.join(process.cwd(), 'clean-care-admin/dist'), // From root
        path_1.default.join(process.cwd(), '../clean-care-admin/dist'), // If running from server dir
        path_1.default.join(__dirname, '../public/admin') // Fallback if moved to public
    ];
    console.log('🔍 Searching for admin panel in:', potentialPaths);
    for (const p of potentialPaths) {
        if (fs_1.default.existsSync(p) && fs_1.default.existsSync(path_1.default.join(p, 'index.html'))) {
            console.log('✅ Found admin panel at:', p);
            // List assets to verify
            const assetsPath = path_1.default.join(p, 'assets');
            if (fs_1.default.existsSync(assetsPath)) {
                try {
                    const files = fs_1.default.readdirSync(assetsPath);
                    console.log(`📂 Assets found (${files.length} files):`, files.slice(0, 5), '...');
                }
                catch (e) {
                    console.error('⚠️ Could not list assets:', e);
                }
            }
            else {
                console.warn('⚠️ Admin panel found but assets directory missing at:', assetsPath);
            }
            return p;
        }
    }
    console.error('❌ Admin panel NOT found in any potential path');
    return null;
};
const adminPanelPath = getAdminPanelPath();
if (adminPanelPath) {
    // Serve static files from admin panel dist folder at /admin
    // Use explicit cache control for assets
    app.use('/admin', express_1.default.static(adminPanelPath, {
        maxAge: '1d',
        index: false // We handle index.html manually for SPA
    }));
    // Explicitly serve index.html for root /admin
    app.get('/admin', (_req, res) => {
        res.sendFile(path_1.default.join(adminPanelPath, 'index.html'));
    });
    // Debug route to check file existence
    app.get('/admin/debug-file/:filename(*)', (req, res) => {
        const filename = req.params.filename;
        const filePath = path_1.default.join(adminPanelPath, filename);
        const exists = fs_1.default.existsSync(filePath);
        res.json({
            filename,
            resolvedPath: filePath,
            exists,
            stat: exists ? fs_1.default.statSync(filePath) : null
        });
    });
    // Handle SPA routing for admin panel - serve index.html for any /admin/* requests
    // BUT ONLY if it's not a static asset request that failed (which should be 404)
    app.get('/admin/*', (req, res) => {
        // If it looks like an asset request (has extension), return 404 instead of index.html
        // This prevents MIME type errors for missing CSS/JS
        if (req.path.includes('.') && !req.path.endsWith('.html')) {
            console.warn(`⚠️ 404 for asset: ${req.path}`);
            return res.status(404).send('File not found');
        }
        // Verify file exists before sending to avoid 500s
        const indexPath = path_1.default.join(adminPanelPath, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
            res.status(404).send('Admin panel not found');
        }
    });
    console.log('✅ Admin panel configured at /admin');
}
else {
    console.log('⚠️ Admin panel serving skipped - directory not found');
    app.get('/admin*', (_req, res) => res.status(404).send('Admin panel not available'));
}
// Security middleware - Apply first for maximum protection
app.use(security_middleware_1.helmetConfig); // Security headers
app.use(security_middleware_1.securityHeaders); // Additional security headers
app.use(security_middleware_1.noSqlInjectionPrevention); // NoSQL injection prevention
app.use(security_middleware_1.parameterPollutionPrevention); // HTTP parameter pollution prevention
// Debug logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    next();
});
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
// Explicitly trusted domains for production
const trustedDomains = [
    'https://www.cleancaresupport.com',
    'https://cleancaresupport.com',
    'https://munna-production.up.railway.app'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes('*'))
            return callback(null, true);
        if (allowedOrigins.includes(origin))
            return callback(null, true);
        if (trustedDomains.includes(origin))
            return callback(null, true);
        // Allow localhost and 127.0.0.1
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
            return callback(null, true);
        // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin))
            return callback(null, true);
        // Log blocked origin for debugging
        console.warn(`⚠️ CORS blocked request from: ${origin}`);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
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
// API routes with /api prefix
app.use('/api/auth', auth_routes_1.default);
console.log('✅ Regular auth routes registered at /api/auth');
app.use('/api/users', user_routes_1.default);
console.log('✅ User routes registered at /api/users');
// Review routes MUST be registered BEFORE complaint routes
// because complaint routes have authGuard on all routes
app.use('/api/complaints', review_routes_1.default); // Review routes (nested under complaints)
console.log('✅ Review routes registered at /api/complaints/:complaintId/review(s)');
app.use('/api/complaints', complaint_routes_1.default);
console.log('✅ Complaint routes registered at /api/complaints');
app.use('/api/uploads', upload_routes_1.default);
console.log('✅ Upload routes registered at /api/uploads');
app.use('/api/notifications', notification_routes_1.default); // Notification routes
console.log('✅ Notification routes registered at /api/notifications');
app.use('/api/live-chat', live_chat_routes_1.default); // Live chat routes (mobile app)
console.log('✅ Live chat routes registered at /api/live-chat');
app.use('/api/admin/auth', admin_auth_routes_1.default); // Admin authentication routes
console.log('✅ Admin auth routes registered at /api/admin/auth');
app.use('/api/admin/users', admin_user_routes_1.default); // Admin user management routes
console.log('✅ Admin user routes registered at /api/admin/users');
app.use('/api/admin/complaints', admin_complaint_routes_1.default); // Admin complaint management routes
console.log('✅ Admin complaint routes registered at /api/admin/complaints');
app.use('/api/admin/complaints', admin_review_routes_1.default); // Admin review analytics routes
console.log('✅ Admin review analytics routes registered at /api/admin/complaints/analytics/reviews');
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
app.use('/api/admin/live-chat', admin_live_chat_routes_1.default); // Admin live chat routes
console.log('✅ Admin live chat routes registered at /api/admin/live-chat');
app.use('/api/admin/activity-logs', admin_activity_log_routes_1.default); // Admin activity log routes
console.log('✅ Admin activity log routes registered at /api/admin/activity-logs');
app.use('/api/admin/bot-messages', bot_message_routes_1.default); // Bot message management routes
console.log('✅ Bot message routes registered at /api/admin/bot-messages');
app.use('/api/bot-messages', public_bot_message_routes_1.default); // Public bot message routes
console.log('✅ Public bot message routes registered at /api/bot-messages');
const admin_system_config_routes_1 = __importDefault(require("./routes/admin.system-config.routes"));
const system_config_routes_1 = __importDefault(require("./routes/system-config.routes"));
app.use('/api/admin/config', admin_system_config_routes_1.default); // Admin system config routes
console.log('✅ Admin system config routes registered at /api/admin/config');
app.use('/api/config', system_config_routes_1.default); // Public/App system config routes
console.log('✅ App system config routes registered at /api/config');
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
app.use('/api/waste-management', waste_management_routes_1.default);
app.use('/api/gallery', gallery_routes_1.default); // Waste Management routes
console.log('✅ Waste Management routes registered at /api/waste-management');
// Notice Board routes
const notice_routes_1 = __importDefault(require("./routes/notice.routes"));
const notice_category_routes_1 = __importDefault(require("./routes/notice-category.routes"));
app.use('/api/notices', notice_routes_1.default); // Notice routes (public + admin)
console.log('✅ Notice routes registered at /api/notices');
app.use('/api/notice-categories', notice_category_routes_1.default); // Notice category routes
console.log('✅ Notice category routes registered at /api/notice-categories');
// Officer Review routes (Home Page Dynamic Reviews)
const officer_review_routes_1 = __importDefault(require("./routes/officer-review.routes"));
app.use('/api/officer-reviews', officer_review_routes_1.default); // Officer review routes (public + admin)
console.log('✅ Officer review routes registered at /api/officer-reviews');
// Calendar routes
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
app.use('/api/calendars', calendar_routes_1.default); // Calendar routes (public + admin)
console.log('✅ Calendar routes registered at /api/calendars');
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
// Global error handler
app.use((err, req, res, next) => {
    console.error('[Global Error Handler]', err);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
exports.default = app;
