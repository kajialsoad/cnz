"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_user_controller_1 = require("../controllers/admin.user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
console.log('🔧 Loading admin.user.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));
// Apply general API rate limiting to all admin user routes
// Requirements: 12.13, 12.18
router.use(rate_limit_middleware_1.apiRateLimit);
// Get user statistics (must be before /:id to avoid conflict)
router.get('/statistics', admin_user_controller_1.getUserStatistics);
console.log('🔧 Admin user route registered: GET /statistics');
// Get all users with pagination and filters
router.get('/', admin_user_controller_1.getUsers);
console.log('🔧 Admin user route registered: GET /');
// Get single user by ID
router.get('/:id', admin_user_controller_1.getUserById);
console.log('🔧 Admin user route registered: GET /:id');
// Create new user - strict rate limiting for sensitive operations
router.post('/', rate_limit_middleware_1.strictRateLimit, admin_user_controller_1.createUser);
console.log('🔧 Admin user route registered: POST / (with strict rate limiting)');
// Update user
router.put('/:id', admin_user_controller_1.updateUser);
console.log('🔧 Admin user route registered: PUT /:id');
// Update user status - strict rate limiting for sensitive operations
router.patch('/:id/status', rate_limit_middleware_1.strictRateLimit, admin_user_controller_1.updateUserStatus);
console.log('🔧 Admin user route registered: PATCH /:id/status (with strict rate limiting)');
// Update user permissions (to be implemented) - strict rate limiting for sensitive operations
const admin_user_controller_2 = require("../controllers/admin.user.controller");
router.put('/:id/permissions', rate_limit_middleware_1.strictRateLimit, admin_user_controller_2.updateUserPermissions);
console.log('🔧 Admin user route registered: PUT /:id/permissions (with strict rate limiting)');
// Delete user (soft delete) - strict rate limiting for sensitive operations
router.delete('/:id', rate_limit_middleware_1.strictRateLimit, admin_user_controller_2.deleteUser);
console.log('🔧 Admin user route registered: DELETE /:id');
// Get user complaints
const admin_user_controller_3 = require("../controllers/admin.user.controller");
router.get('/:id/complaints', admin_user_controller_3.getUserComplaints);
console.log('🔧 Admin user route registered: GET /:id/complaints');
// Multi-Zone Management Endpoints (Master Admin only)
const admin_user_controller_4 = require("../controllers/admin.user.controller");
// Assign zones to Super Admin
router.post('/:id/zones', (0, auth_middleware_1.rbacGuard)('MASTER_ADMIN'), rate_limit_middleware_1.strictRateLimit, admin_user_controller_4.assignZonesToSuperAdmin);
console.log('🔧 Admin user route registered: POST /:id/zones (Master Admin only)');
// Get assigned zones
router.get('/:id/zones', (0, auth_middleware_1.rbacGuard)('MASTER_ADMIN', 'SUPER_ADMIN'), admin_user_controller_4.getAssignedZones);
console.log('🔧 Admin user route registered: GET /:id/zones');
// Update zone assignments
router.put('/:id/zones', (0, auth_middleware_1.rbacGuard)('MASTER_ADMIN'), rate_limit_middleware_1.strictRateLimit, admin_user_controller_4.updateZoneAssignments);
console.log('🔧 Admin user route registered: PUT /:id/zones (Master Admin only)');
// Remove specific zone
router.delete('/:id/zones/:zoneId', (0, auth_middleware_1.rbacGuard)('MASTER_ADMIN'), rate_limit_middleware_1.strictRateLimit, admin_user_controller_4.removeZoneFromSuperAdmin);
console.log('🔧 Admin user route registered: DELETE /:id/zones/:zoneId (Master Admin only)');
console.log('✅ Admin user routes module loaded successfully');
exports.default = router;
