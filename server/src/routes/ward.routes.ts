import { Router } from 'express';
import wardController from '../controllers/ward.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/wards - Get wards by zone
router.get('/', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), wardController.getWards);

// GET /api/admin/wards/available/:zoneId - Get available ward numbers for zone
router.get('/available/:zoneId', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), wardController.getAvailableWardNumbers);

// GET /api/admin/wards/limit/:zoneId - Check ward limit for zone
router.get('/limit/:zoneId', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), wardController.checkWardLimit);

// GET /api/admin/wards/:id/statistics - Get statistics (must be before /:id to avoid route conflict)
router.get('/:id/statistics', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), wardController.getWardStatistics);

// GET /api/admin/wards/:id - Get single ward
router.get('/:id', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), wardController.getWardById);

// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/wards - Create new ward
router.post('/', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), wardController.createWard);

// POST /api/admin/wards/bulk - Bulk create wards
router.post('/bulk', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), wardController.createWardsBulk);

// PUT /api/admin/wards/:id - Update ward
router.put('/:id', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), wardController.updateWard);

// DELETE /api/admin/wards/:id - Delete ward
router.delete('/:id', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), wardController.deleteWard);

export default router;