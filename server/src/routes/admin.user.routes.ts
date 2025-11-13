import { Router } from 'express';
import {
    getUsers,
    getUserById,
    getUserStatistics,
    createUser,
    updateUser,
    updateUserStatus,
} from '../controllers/admin.user.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.user.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN'));

// Get user statistics (must be before /:id to avoid conflict)
router.get('/statistics', getUserStatistics);
console.log('🔧 Admin user route registered: GET /statistics');

// Get all users with pagination and filters
router.get('/', getUsers);
console.log('🔧 Admin user route registered: GET /');

// Get single user by ID
router.get('/:id', getUserById);
console.log('🔧 Admin user route registered: GET /:id');

// Create new user
router.post('/', createUser);
console.log('🔧 Admin user route registered: POST /');

// Update user
router.put('/:id', updateUser);
console.log('🔧 Admin user route registered: PUT /:id');

// Update user status
router.patch('/:id/status', updateUserStatus);
console.log('🔧 Admin user route registered: PATCH /:id/status');

console.log('✅ Admin user routes module loaded successfully');

export default router;
