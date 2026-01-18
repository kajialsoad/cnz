import { Router } from 'express';
import {
    getAdminComplaints,
    getAdminComplaintById,
    updateComplaintStatus,
    getComplaintsByUser,
    getComplaintStatsByZone,
    getComplaintStatsByWard,
    markComplaintAsOthers,
    getOthersAnalytics,
    updateComplaintAudioUrls
} from '../controllers/admin.complaint.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';
import { uploadConfig } from '../config/upload.config';

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

// Get Others analytics
router.get('/analytics/others', getOthersAnalytics);
console.log('🔧 Admin complaint route registered: GET /analytics/others');

// Get all complaints with filtering and pagination
router.get('/', getAdminComplaints);
console.log('🔧 Admin complaint route registered: GET /');

// Get single complaint by ID
router.get('/:id', getAdminComplaintById);
console.log('🔧 Admin complaint route registered: GET /:id');

// Mark complaint as Others
router.patch('/:id/mark-others', uploadConfig.array('images', 5), markComplaintAsOthers);
console.log('🔧 Admin complaint route registered: PATCH /:id/mark-others');

// Update complaint status (with multipart/form-data support for resolution images)
router.patch('/:id/status', uploadConfig.array('resolutionImages', 5), updateComplaintStatus);
console.log('🔧 Admin complaint route registered: PATCH /:id/status (with file upload)');

// Update complaint audio URLs (Master Admin only)
router.patch('/:id/audio-urls', updateComplaintAudioUrls);
console.log('🔧 Admin complaint route registered: PATCH /:id/audio-urls (Master Admin only)');

// Note: User complaints route is in admin.user.routes.ts as GET /api/admin/users/:userId/complaints

console.log('✅ Admin complaint routes module loaded successfully');

export default router;
