import { Router } from 'express';
import { adminLogin, adminMe, adminLogout, adminRefresh } from '../controllers/admin.auth.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// Admin authentication routes
router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.post('/refresh', adminRefresh);

// Protected admin routes - requires ADMIN or SUPER_ADMIN role
router.get('/me', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN'), adminMe);

export default router;
