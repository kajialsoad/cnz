/**
 * Public Bot Message Routes
 * 
 * Public API endpoints for bot messages (accessible to user apps)
 * Requirements: Bot Message System - Public API Endpoints
 */

import { Router } from 'express';
import { getPublicBotMessages } from '../controllers/bot-message.controller';
import { ipRateLimit } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validation.middleware';
import { chatTypeParamSchema } from '../validators/bot-message.validators';

const router = Router();

/**
 * GET /api/bot-messages/:chatType
 * Get bot messages for a chat type (public access)
 * 
 * Features:
 * - Rate limited to prevent abuse (100 requests per minute per IP)
 * - Cached for 5 minutes
 * - Returns only active messages
 */
router.get(
    '/:chatType',
    ipRateLimit(100, 60 * 1000), // 100 requests per minute per IP
    validate(chatTypeParamSchema, 'params'),
    getPublicBotMessages
);

export default router;
