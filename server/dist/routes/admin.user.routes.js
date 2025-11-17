"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_user_controller_1 = require("../controllers/admin.user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.user.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'));
// Get user statistics (must be before /:id to avoid conflict)
router.get('/statistics', admin_user_controller_1.getUserStatistics);
console.log('🔧 Admin user route registered: GET /statistics');
// Get all users with pagination and filters
router.get('/', admin_user_controller_1.getUsers);
console.log('🔧 Admin user route registered: GET /');
// Get single user by ID
router.get('/:id', admin_user_controller_1.getUserById);
console.log('🔧 Admin user route registered: GET /:id');
// Create new user
router.post('/', admin_user_controller_1.createUser);
console.log('🔧 Admin user route registered: POST /');
// Update user
router.put('/:id', admin_user_controller_1.updateUser);
console.log('🔧 Admin user route registered: PUT /:id');
// Update user status
router.patch('/:id/status', admin_user_controller_1.updateUserStatus);
console.log('🔧 Admin user route registered: PATCH /:id/status');
// Get user complaints
const admin_user_controller_2 = require("../controllers/admin.user.controller");
router.get('/:id/complaints', admin_user_controller_2.getUserComplaints);
console.log('🔧 Admin user route registered: GET /:id/complaints');
console.log('✅ Admin user routes module loaded successfully');
exports.default = router;
