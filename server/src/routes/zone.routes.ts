import { Router } from 'express';
import zoneController from '../controllers/zone.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/zones/available/:cityCorporationId - Get available zone numbers
router.get('/available/:cityCorporationId', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.getAvailableZoneNumbers);

// GET /api/admin/zones - Get zones by city corporation
router.get('/', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.getZones);

// GET /api/admin/zones/:id/statistics - Get statistics (must be before /:id to avoid route conflict)
router.get('/:id/statistics', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.getZoneStatistics);

// GET /api/admin/zones/:id - Get single zone
router.get('/:id', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.getZoneById);

// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/zones - Create new zone
router.post('/', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.createZone);

// PUT /api/admin/zones/:id - Update zone
router.put('/:id', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.updateZone);

// DELETE /api/admin/zones/:id - Delete zone
router.delete('/:id', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), zoneController.deleteZone);

export default router;
