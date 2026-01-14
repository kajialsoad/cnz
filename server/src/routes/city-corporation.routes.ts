import { Router } from 'express';
import cityCorporationController from '../controllers/city-corporation.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/city-corporations - Get all city corporations
router.get('/', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), cityCorporationController.getCityCorporations);

// GET /api/admin/city-corporations/:code/statistics - Get statistics (must be before /:code to avoid route conflict)
router.get('/:code/statistics', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), cityCorporationController.getCityCorporationStatistics);

// GET /api/admin/city-corporations/:code - Get single city corporation
router.get('/:code', authGuard, rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), cityCorporationController.getCityCorporationByCode);

// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/city-corporations - Create new city corporation
router.post('/', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), cityCorporationController.createCityCorporation);

// PUT /api/admin/city-corporations/:code - Update city corporation
router.put('/:code', authGuard, rbacGuard('SUPER_ADMIN', 'MASTER_ADMIN'), cityCorporationController.updateCityCorporation);

export default router;
