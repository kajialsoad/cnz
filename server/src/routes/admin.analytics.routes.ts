import { Router } from 'express';
import {
    getComplaintAnalytics,
    getComplaintTrends
} from '../controllers/admin.analytics.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.analytics.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN'));

// Get complaint analytics
router.get('/', getComplaintAnalytics);
console.log('🔧 Admin analytics route registered: GET /');

// Get complaint trends
router.get('/trends', getComplaintTrends);
console.log('🔧 Admin analytics route registered: GET /trends');

console.log('✅ Admin analytics routes module loaded successfully');

export default router;
