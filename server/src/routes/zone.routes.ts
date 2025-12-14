import { Router } from 'express';
import zoneController from '../controllers/zone.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'));

// GET /api/admin/zones/available/:cityCorporationId - Get available zone numbers
router.get('/available/:cityCorporationId', zoneController.getAvailableZoneNumbers);

// GET /api/admin/zones - Get zones by city corporation
router.get('/', zoneController.getZones);

// GET /api/admin/zones/:id - Get single zone
router.get('/:id', zoneController.getZoneById);

// POST /api/admin/zones - Create new zone
router.post('/', zoneController.createZone);

// PUT /api/admin/zones/:id - Update zone
router.put('/:id', zoneController.updateZone);

// DELETE /api/admin/zones/:id - Delete zone
router.delete('/:id', zoneController.deleteZone);

// GET /api/admin/zones/:id/statistics - Get statistics
router.get('/:id/statistics', zoneController.getZoneStatistics);

export default router;
