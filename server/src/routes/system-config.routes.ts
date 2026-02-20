import express from 'express';
import { systemConfigController } from '../controllers/system-config.controller';
import { authGuard as authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Get all public configs (Open access)
router.get(
    '/',
    systemConfigController.getPublicConfigs
);

// Get specific config (Authenticated)
router.get(
    '/:key',
    authenticate,
    systemConfigController.getConfig
);

export default router;
