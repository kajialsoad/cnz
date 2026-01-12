import { Router } from 'express';
import { adminLogin, adminMe, adminLogout, adminRefresh, adminUpdateProfile } from '../controllers/admin.auth.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';
import { loginRateLimit, ipRateLimit } from '../middlewares/rate-limit.middleware';

console.log('🔧 Loading admin.auth.routes.ts...');

const router = Router();

// Admin authentication routes with rate limiting and account lockout protection
// Increased limits for development: 1000 requests per minute
router.post('/login', loginRateLimit, ipRateLimit(1000, 60 * 1000), adminLogin);
console.log('🔧 Admin route registered: POST /login (with rate limiting)');

router.post('/logout', adminLogout);
console.log('🔧 Admin route registered: POST /logout');

router.post('/refresh', adminRefresh);
console.log('🔧 Admin route registered: POST /refresh');

// Protected admin routes - requires ADMIN, SUPER_ADMIN, or MASTER_ADMIN role
router.get('/me', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), adminMe);
console.log('🔧 Admin route registered: GET /me (protected)');

router.patch('/profile', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), adminUpdateProfile);
console.log('🔧 Admin route registered: PATCH /profile (protected)');

console.log('✅ Admin auth routes module loaded successfully');

export default router;
