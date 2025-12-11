import { Router } from 'express';
import wardController from '../controllers/ward.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'));

// GET /api/admin/wards - Get wards by zone
router.get('/', wardController.getWards);

// GET /api/admin/wards/available/:zoneId - Get available ward numbers for zone
router.get('/available/:zoneId', wardController.getAvailableWardNumbers);

// GET /api/admin/wards/limit/:zoneId - Check ward limit for zone
router.get('/limit/:zoneId', wardController.checkWardLimit);

// GET /api/admin/wards/:id - Get single ward
router.get('/:id', wardController.getWardById);

// POST /api/admin/wards - Create new ward
router.post('/', wardController.createWard);

// POST /api/admin/wards/bulk - Bulk create wards
router.post('/bulk', wardController.createWardsBulk);

// PUT /api/admin/wards/:id - Update ward
router.put('/:id', wardController.updateWard);

// DELETE /api/admin/wards/:id - Delete ward
router.delete('/:id', wardController.deleteWard);

// GET /api/admin/wards/:id/statistics - Get statistics
router.get('/:id/statistics', wardController.getWardStatistics);

export default router;