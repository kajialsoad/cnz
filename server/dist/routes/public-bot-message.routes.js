"use strict";
/**
 * Public Bot Message Routes
 *
 * Public API endpoints for bot messages (accessible to user apps)
 * Requirements: Bot Message System - Public API Endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bot_message_controller_1 = require("../controllers/bot-message.controller");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const bot_message_validators_1 = require("../validators/bot-message.validators");
const router = (0, express_1.Router)();
/**
 * GET /api/bot-messages/:chatType
 * Get bot messages for a chat type (public access)
 *
 * Features:
 * - Rate limited to prevent abuse (100 requests per minute per IP)
 * - Cached for 5 minutes
 * - Returns only active messages
 */
router.get('/:chatType', (0, rate_limit_middleware_1.ipRateLimit)(100, 60 * 1000), // 100 requests per minute per IP
(0, validation_middleware_1.validate)(bot_message_validators_1.chatTypeParamSchema, 'params'), bot_message_controller_1.getPublicBotMessages);
exports.default = router;
