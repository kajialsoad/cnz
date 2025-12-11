"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_auth_controller_1 = require("../controllers/admin.auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.auth.routes.ts...');
const router = (0, express_1.Router)();
// Admin authentication routes
router.post('/login', admin_auth_controller_1.adminLogin);
console.log('🔧 Admin route registered: POST /login');
router.post('/logout', admin_auth_controller_1.adminLogout);
console.log('🔧 Admin route registered: POST /logout');
router.post('/refresh', admin_auth_controller_1.adminRefresh);
console.log('🔧 Admin route registered: POST /refresh');
// Protected admin routes - requires ADMIN, SUPER_ADMIN, or MASTER_ADMIN role
router.get('/me', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), admin_auth_controller_1.adminMe);
console.log('🔧 Admin route registered: GET /me (protected)');
router.patch('/profile', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), admin_auth_controller_1.adminUpdateProfile);
console.log('🔧 Admin route registered: PATCH /profile (protected)');
console.log('✅ Admin auth routes module loaded successfully');
exports.default = router;
