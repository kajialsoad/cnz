"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_complaint_controller_1 = require("../controllers/admin.complaint.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.complaint.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));
// Get complaint statistics by zone
router.get('/stats/by-zone', admin_complaint_controller_1.getComplaintStatsByZone);
console.log('🔧 Admin complaint route registered: GET /stats/by-zone');
// Get complaint statistics by ward
router.get('/stats/by-ward', admin_complaint_controller_1.getComplaintStatsByWard);
console.log('🔧 Admin complaint route registered: GET /stats/by-ward');
// Get all complaints with filtering and pagination
router.get('/', admin_complaint_controller_1.getAdminComplaints);
console.log('🔧 Admin complaint route registered: GET /');
// Get single complaint by ID
router.get('/:id', admin_complaint_controller_1.getAdminComplaintById);
console.log('🔧 Admin complaint route registered: GET /:id');
// Update complaint status
router.patch('/:id/status', admin_complaint_controller_1.updateComplaintStatus);
console.log('🔧 Admin complaint route registered: PATCH /:id/status');
// Note: User complaints route is in admin.user.routes.ts as GET /api/admin/users/:userId/complaints
console.log('✅ Admin complaint routes module loaded successfully');
exports.default = router;
