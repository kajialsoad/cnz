import { Router } from 'express';
import {
    getActivityLogs,
    exportActivityLogs,
} from '../controllers/admin.activity-log.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.activity-log.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));

// Get activity logs with filters and pagination
router.get('/', getActivityLogs);
console.log('🔧 Admin activity log route registered: GET /');

// Export activity logs as CSV
router.get('/export', exportActivityLogs);
console.log('🔧 Admin activity log route registered: GET /export');

console.log('✅ Admin activity log routes module loaded successfully');

export default router;
