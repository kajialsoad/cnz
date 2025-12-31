import express from 'express';
import { adminSystemConfigController } from '../controllers/admin.system-config.controller';
import { authGuard as authenticate, rbacGuard as authorize } from '../middlewares/auth.middleware';

const router = express.Router();

// Get all configs
router.get(
    '/',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'),
    adminSystemConfigController.getAll
);

// Get specific config
router.get(
    '/:key',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'),
    adminSystemConfigController.get
);

// Update config
router.put(
    '/:key',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'),
    adminSystemConfigController.update
);

export default router;
