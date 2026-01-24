"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_activity_log_controller_1 = require("../controllers/admin.activity-log.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.activity-log.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));
// Get activity logs with filters and pagination
router.get('/', admin_activity_log_controller_1.getActivityLogs);
console.log('🔧 Admin activity log route registered: GET /');
// Export activity logs as CSV
router.get('/export', admin_activity_log_controller_1.exportActivityLogs);
console.log('🔧 Admin activity log route registered: GET /export');
console.log('✅ Admin activity log routes module loaded successfully');
exports.default = router;
