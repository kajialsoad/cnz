import { Router } from 'express';
import cityCorporationController from '../controllers/city-corporation.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// All routes require SUPER_ADMIN role
router.use(authGuard, rbacGuard('SUPER_ADMIN'));

// GET /api/admin/city-corporations - Get all city corporations
router.get('/', cityCorporationController.getCityCorporations);

// GET /api/admin/city-corporations/:code - Get single city corporation
router.get('/:code', cityCorporationController.getCityCorporationByCode);

// POST /api/admin/city-corporations - Create new city corporation
router.post('/', cityCorporationController.createCityCorporation);

// PUT /api/admin/city-corporations/:code - Update city corporation
router.put('/:code', cityCorporationController.updateCityCorporation);

// GET /api/admin/city-corporations/:code/statistics - Get statistics
router.get('/:code/statistics', cityCorporationController.getCityCorporationStatistics);

export default router;
