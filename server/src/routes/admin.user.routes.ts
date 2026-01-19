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
import { apiRateLimit, strictRateLimit } from '../middlewares/rate-limit.middleware';

console.log('🔧 Loading admin.user.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));

// Apply general API rate limiting to all admin user routes
// Requirements: 12.13, 12.18
router.use(apiRateLimit);

// Get user statistics (must be before /:id to avoid conflict)
router.get('/statistics', getUserStatistics);
console.log('🔧 Admin user route registered: GET /statistics');

// Get all users with pagination and filters
router.get('/', getUsers);
console.log('🔧 Admin user route registered: GET /');

// Get single user by ID
router.get('/:id', getUserById);
console.log('🔧 Admin user route registered: GET /:id');

// Create new user - strict rate limiting for sensitive operations
router.post('/', strictRateLimit, createUser);
console.log('🔧 Admin user route registered: POST / (with strict rate limiting)');

// Update user
router.put('/:id', updateUser);
console.log('🔧 Admin user route registered: PUT /:id');

// Update user status - strict rate limiting for sensitive operations
router.patch('/:id/status', strictRateLimit, updateUserStatus);
console.log('🔧 Admin user route registered: PATCH /:id/status (with strict rate limiting)');

// Update user permissions (to be implemented) - strict rate limiting for sensitive operations
import { updateUserPermissions, deleteUser } from '../controllers/admin.user.controller';
router.put('/:id/permissions', strictRateLimit, updateUserPermissions);
console.log('🔧 Admin user route registered: PUT /:id/permissions (with strict rate limiting)');

// Delete user (soft delete) - strict rate limiting for sensitive operations
router.delete('/:id', strictRateLimit, deleteUser);
console.log('🔧 Admin user route registered: DELETE /:id');

// Bulk delete users - strict rate limiting
import { bulkDeleteUsers } from '../controllers/admin.user.controller';
router.post('/bulk-delete', strictRateLimit, bulkDeleteUsers);
console.log('🔧 Admin user route registered: POST /bulk-delete');

// Get user complaints
import { getUserComplaints } from '../controllers/admin.user.controller';
router.get('/:id/complaints', getUserComplaints);
console.log('🔧 Admin user route registered: GET /:id/complaints');

// Multi-Zone Management Endpoints (Master Admin only)
import {
    assignZonesToSuperAdmin,
    getAssignedZones,
    updateZoneAssignments,
    removeZoneFromSuperAdmin
} from '../controllers/admin.user.controller';

// Assign zones to Super Admin
router.post('/:id/zones', rbacGuard('MASTER_ADMIN'), strictRateLimit, assignZonesToSuperAdmin);
console.log('🔧 Admin user route registered: POST /:id/zones (Master Admin only)');

// Get assigned zones
router.get('/:id/zones', rbacGuard('MASTER_ADMIN', 'SUPER_ADMIN'), getAssignedZones);
console.log('🔧 Admin user route registered: GET /:id/zones');

// Update zone assignments
router.put('/:id/zones', rbacGuard('MASTER_ADMIN'), strictRateLimit, updateZoneAssignments);
console.log('🔧 Admin user route registered: PUT /:id/zones (Master Admin only)');

// Remove specific zone
router.delete('/:id/zones/:zoneId', rbacGuard('MASTER_ADMIN'), strictRateLimit, removeZoneFromSuperAdmin);
console.log('🔧 Admin user route registered: DELETE /:id/zones/:zoneId (Master Admin only)');

// Change user password (Users can change their own password, Master Admin can change any password)
import { changeUserPassword } from '../controllers/admin.user.controller';
router.post('/:id/change-password', authGuard, strictRateLimit, changeUserPassword);
console.log('🔧 Admin user route registered: POST /:id/change-password (Authenticated users)');

console.log('✅ Admin user routes module loaded successfully');

export default router;
