import { Router } from 'express';
import { adminLogin, adminMe, adminLogout, adminRefresh } from '../controllers/admin.auth.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.auth.routes.ts...');

const router = Router();

// Admin authentication routes
router.post('/login', adminLogin);
console.log('🔧 Admin route registered: POST /login');

router.post('/logout', adminLogout);
console.log('🔧 Admin route registered: POST /logout');

router.post('/refresh', adminRefresh);
console.log('🔧 Admin route registered: POST /refresh');

// Protected admin routes - requires ADMIN or SUPER_ADMIN role
router.get('/me', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN'), adminMe);
console.log('🔧 Admin route registered: GET /me (protected)');

console.log('✅ Admin auth routes module loaded successfully');

export default router;
