/**
 * Bot Message Routes
 * 
 * Admin API endpoints for managing bot messages
 * Requirements: Bot Message System - Admin API Endpoints
 */

import { Router } from 'express';
import {
    getBotMessages,
    createBotMessage,
    updateBotMessage,
    deleteBotMessage,
    updateTriggerRules,
    getBotAnalytics,
    getPublicBotMessages
} from '../controllers/bot-message.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/authorization.middleware';
import { users_role } from '@prisma/client';
import { validate } from '../middlewares/validation.middleware';
import {
    createBotMessageSchema,
    updateBotMessageSchema,
    messageIdParamSchema,
    updateTriggerRulesSchema,
    chatTypeParamSchema,
    getBotMessagesQuerySchema,
    getBotAnalyticsQuerySchema
} from '../validators/bot-message.validators';

const router = Router();

/**
 * All bot message routes require authentication and MASTER_ADMIN role
 * Only MASTER_ADMIN can manage bot messages
 */

/**
 * GET /api/admin/bot-messages
 * Get all bot messages (optionally filtered by chat type)
 */
router.get(
    '/',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(getBotMessagesQuerySchema, 'query'),
    getBotMessages
);

/**
 * POST /api/admin/bot-messages
 * Create a new bot message
 */
router.post(
    '/',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(createBotMessageSchema, 'body'),
    createBotMessage
);

/**
 * PUT /api/admin/bot-messages/:id
 * Update a bot message
 */
router.put(
    '/:id',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(messageIdParamSchema, 'params'),
    validate(updateBotMessageSchema, 'body'),
    updateBotMessage
);

/**
 * DELETE /api/admin/bot-messages/:id
 * Delete a bot message
 */
router.delete(
    '/:id',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(messageIdParamSchema, 'params'),
    deleteBotMessage
);

/**
 * PUT /api/admin/bot-messages/rules/:chatType
 * Update trigger rules for a chat type
 */
router.put(
    '/rules/:chatType',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(chatTypeParamSchema, 'params'),
    validate(updateTriggerRulesSchema, 'body'),
    updateTriggerRules
);

/**
 * GET /api/admin/bot-messages/analytics
 * Get bot analytics
 */
router.get(
    '/analytics',
    authGuard,
    requireRole(users_role.MASTER_ADMIN),
    validate(getBotAnalyticsQuerySchema, 'query'),
    getBotAnalytics
);

export default router;
