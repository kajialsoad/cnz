"use strict";
/**
 * Bot Message Routes
 *
 * Admin API endpoints for managing bot messages
 * Requirements: Bot Message System - Admin API Endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bot_message_controller_1 = require("../controllers/bot-message.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorization_middleware_1 = require("../middlewares/authorization.middleware");
const client_1 = require("@prisma/client");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const bot_message_validators_1 = require("../validators/bot-message.validators");
const router = (0, express_1.Router)();
/**
 * All bot message routes require authentication and MASTER_ADMIN role
 * Only MASTER_ADMIN can manage bot messages
 */
/**
 * GET /api/admin/bot-messages
 * Get all bot messages (optionally filtered by chat type)
 */
router.get('/', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.getBotMessagesQuerySchema, 'query'), bot_message_controller_1.getBotMessages);
/**
 * POST /api/admin/bot-messages
 * Create a new bot message
 */
router.post('/', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.createBotMessageSchema, 'body'), bot_message_controller_1.createBotMessage);
/**
 * PUT /api/admin/bot-messages/:id
 * Update a bot message
 */
router.put('/:id', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.messageIdParamSchema, 'params'), (0, validation_middleware_1.validate)(bot_message_validators_1.updateBotMessageSchema, 'body'), bot_message_controller_1.updateBotMessage);
/**
 * DELETE /api/admin/bot-messages/:id
 * Delete a bot message
 */
router.delete('/:id', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.messageIdParamSchema, 'params'), bot_message_controller_1.deleteBotMessage);
/**
 * PUT /api/admin/bot-messages/rules/:chatType
 * Update trigger rules for a chat type
 */
router.put('/rules/:chatType', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.chatTypeParamSchema, 'params'), (0, validation_middleware_1.validate)(bot_message_validators_1.updateTriggerRulesSchema, 'body'), bot_message_controller_1.updateTriggerRules);
/**
 * GET /api/admin/bot-messages/analytics
 * Get bot analytics
 */
router.get('/analytics', auth_middleware_1.authGuard, (0, authorization_middleware_1.requireRole)(client_1.users_role.MASTER_ADMIN), (0, validation_middleware_1.validate)(bot_message_validators_1.getBotAnalyticsQuerySchema, 'query'), bot_message_controller_1.getBotAnalytics);
exports.default = router;
