"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_analytics_controller_1 = require("../controllers/admin.analytics.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.analytics.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'));
// Get complaint analytics
router.get('/', admin_analytics_controller_1.getComplaintAnalytics);
console.log('🔧 Admin analytics route registered: GET /');
// Get complaint trends
router.get('/trends', admin_analytics_controller_1.getComplaintTrends);
console.log('🔧 Admin analytics route registered: GET /trends');
console.log('✅ Admin analytics routes module loaded successfully');
exports.default = router;
