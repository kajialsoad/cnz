import { Router } from 'express';
import thanaController from '../controllers/thana.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

// All routes require SUPER_ADMIN role
router.use(authGuard, rbacGuard('SUPER_ADMIN'));

// GET /api/admin/thanas - Get thanas by city corporation
router.get('/', thanaController.getThanas);

// GET /api/admin/thanas/:id - Get single thana
router.get('/:id', thanaController.getThanaById);

// POST /api/admin/thanas - Create new thana
router.post('/', thanaController.createThana);

// PUT /api/admin/thanas/:id - Update thana
router.put('/:id', thanaController.updateThana);

// GET /api/admin/thanas/:id/statistics - Get statistics
router.get('/:id/statistics', thanaController.getThanaStatistics);

export default router;
