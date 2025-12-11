import { Router } from 'express';
import {
    getAdminComplaints,
    getAdminComplaintById,
    updateComplaintStatus,
    getComplaintsByUser,
    getComplaintStatsByZone,
    getComplaintStatsByWard
} from '../controllers/admin.complaint.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.complaint.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));

// Get complaint statistics by zone
router.get('/stats/by-zone', getComplaintStatsByZone);
console.log('🔧 Admin complaint route registered: GET /stats/by-zone');

// Get complaint statistics by ward
router.get('/stats/by-ward', getComplaintStatsByWard);
console.log('🔧 Admin complaint route registered: GET /stats/by-ward');

// Get all complaints with filtering and pagination
router.get('/', getAdminComplaints);
console.log('🔧 Admin complaint route registered: GET /');

// Get single complaint by ID
router.get('/:id', getAdminComplaintById);
console.log('🔧 Admin complaint route registered: GET /:id');

// Update complaint status
router.patch('/:id/status', updateComplaintStatus);
console.log('🔧 Admin complaint route registered: PATCH /:id/status');

// Note: User complaints route is in admin.user.routes.ts as GET /api/admin/users/:userId/complaints

console.log('✅ Admin complaint routes module loaded successfully');

export default router;
