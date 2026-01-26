"use strict";
/**
 * Bot Message Controller
 *
 * Handles HTTP requests for bot message management
 * Requirements: Bot Message System - Admin API Endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicBotMessages = exports.getBotAnalytics = exports.updateTriggerRules = exports.deleteBotMessage = exports.updateBotMessage = exports.createBotMessage = exports.getBotMessages = void 0;
const bot_message_service_1 = require("../services/bot-message.service");
/**
 * Get all bot messages for a chat type
 * GET /api/admin/bot-messages
 *
 * Query params:
 * - chatType?: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 */
const getBotMessages = async (req, res) => {
    try {
        const { chatType } = req.query;
        // Validate chatType if provided
        if (chatType && !['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAT_TYPE',
                    message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT'
                }
            });
        }
        // Get messages for specific chat type or all
        let messages;
        let rules;
        if (chatType) {
            messages = await bot_message_service_1.botMessageService.getBotMessages(chatType);
            rules = await bot_message_service_1.botMessageService.getTriggerRules(chatType);
        }
        else {
            // Get messages for both chat types
            const liveChatMessages = await bot_message_service_1.botMessageService.getBotMessages('LIVE_CHAT');
            const complaintChatMessages = await bot_message_service_1.botMessageService.getBotMessages('COMPLAINT_CHAT');
            const liveChatRules = await bot_message_service_1.botMessageService.getTriggerRules('LIVE_CHAT');
            const complaintChatRules = await bot_message_service_1.botMessageService.getTriggerRules('COMPLAINT_CHAT');
            return res.status(200).json({
                success: true,
                data: {
                    LIVE_CHAT: {
                        messages: liveChatMessages,
                        rules: liveChatRules
                    },
                    COMPLAINT_CHAT: {
                        messages: complaintChatMessages,
                        rules: complaintChatRules
                    }
                }
            });
        }
        return res.status(200).json({
            success: true,
            data: {
                messages,
                rules
            }
        });
    }
    catch (error) {
        console.error('Error in getBotMessages:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve bot messages',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getBotMessages = getBotMessages;
/**
 * Create a new bot message
 * POST /api/admin/bot-messages
 *
 * Body:
 * - chatType: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 * - messageKey: string
 * - content: string
 * - contentBn: string
 * - stepNumber: number
 * - displayOrder?: number
 */
const createBotMessage = async (req, res) => {
    try {
        const { chatType, messageKey, content, contentBn, stepNumber, displayOrder } = req.body;
        // Validation is handled by validator middleware
        const message = await bot_message_service_1.botMessageService.createBotMessage({
            chatType,
            messageKey,
            content,
            contentBn,
            stepNumber,
            displayOrder
        });
        return res.status(201).json({
            success: true,
            data: message,
            message: 'Bot message created successfully'
        });
    }
    catch (error) {
        console.error('Error in createBotMessage:', error);
        // Handle unique constraint violation
        if (error instanceof Error && error.message.includes('Unique constraint')) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_MESSAGE_KEY',
                    message: 'A bot message with this key already exists'
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to create bot message',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.createBotMessage = createBotMessage;
/**
 * Update a bot message
 * PUT /api/admin/bot-messages/:id
 *
 * Body:
 * - content?: string
 * - contentBn?: string
 * - stepNumber?: number
 * - isActive?: boolean
 * - displayOrder?: number
 */
const updateBotMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const messageId = parseInt(id, 10);
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_MESSAGE_ID',
                    message: 'Message ID must be a valid number'
                }
            });
        }
        const { content, contentBn, stepNumber, isActive, displayOrder } = req.body;
        const message = await bot_message_service_1.botMessageService.updateBotMessage(messageId, {
            content,
            contentBn,
            stepNumber,
            isActive,
            displayOrder
        });
        return res.status(200).json({
            success: true,
            data: message,
            message: 'Bot message updated successfully'
        });
    }
    catch (error) {
        console.error('Error in updateBotMessage:', error);
        // Handle not found error
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MESSAGE_NOT_FOUND',
                    message: 'Bot message not found'
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update bot message',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.updateBotMessage = updateBotMessage;
/**
 * Delete a bot message
 * DELETE /api/admin/bot-messages/:id
 */
const deleteBotMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const messageId = parseInt(id, 10);
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_MESSAGE_ID',
                    message: 'Message ID must be a valid number'
                }
            });
        }
        await bot_message_service_1.botMessageService.deleteBotMessage(messageId);
        return res.status(200).json({
            success: true,
            message: 'Bot message deleted successfully'
        });
    }
    catch (error) {
        console.error('Error in deleteBotMessage:', error);
        // Handle not found error
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'MESSAGE_NOT_FOUND',
                    message: 'Bot message not found'
                }
            });
        }
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to delete bot message',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.deleteBotMessage = deleteBotMessage;
/**
 * Update trigger rules for a chat type
 * PUT /api/admin/bot-messages/rules/:chatType
 *
 * Body:
 * - isEnabled?: boolean
 * - reactivationThreshold?: number
 * - resetStepsOnReactivate?: boolean
 */
const updateTriggerRules = async (req, res) => {
    try {
        const { chatType } = req.params;
        // Validate chatType
        if (!['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAT_TYPE',
                    message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT'
                }
            });
        }
        const { isEnabled, reactivationThreshold, resetStepsOnReactivate } = req.body;
        const rules = await bot_message_service_1.botMessageService.updateTriggerRules(chatType, {
            isEnabled,
            reactivationThreshold,
            resetStepsOnReactivate
        });
        return res.status(200).json({
            success: true,
            data: rules,
            message: 'Trigger rules updated successfully'
        });
    }
    catch (error) {
        console.error('Error in updateTriggerRules:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to update trigger rules',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.updateTriggerRules = updateTriggerRules;
/**
 * Get bot analytics
 * GET /api/admin/bot-messages/analytics
 *
 * Query params:
 * - chatType?: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
 */
const getBotAnalytics = async (req, res) => {
    try {
        const { chatType, startDate, endDate } = req.query;
        // Validate chatType if provided
        if (chatType && !['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAT_TYPE',
                    message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT'
                }
            });
        }
        // Parse dates if provided
        const query = {};
        if (chatType) {
            query.chatType = chatType;
        }
        if (startDate) {
            query.startDate = new Date(startDate);
        }
        if (endDate) {
            query.endDate = new Date(endDate);
        }
        const analytics = await bot_message_service_1.botMessageService.getBotAnalytics(query);
        return res.status(200).json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Error in getBotAnalytics:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve bot analytics',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getBotAnalytics = getBotAnalytics;
/**
 * Get public bot messages for a chat type
 * GET /api/bot-messages/:chatType
 *
 * Public endpoint for user apps to fetch bot messages
 * Includes caching and rate limiting
 *
 * Path params:
 * - chatType: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 */
const getPublicBotMessages = async (req, res) => {
    try {
        const { chatType } = req.params;
        // Validate chatType
        if (!['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAT_TYPE',
                    message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT'
                }
            });
        }
        // Get bot messages and rules
        const messages = await bot_message_service_1.botMessageService.getBotMessages(chatType);
        const rules = await bot_message_service_1.botMessageService.getTriggerRules(chatType);
        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(200).json({
            success: true,
            data: {
                messages: messages.filter(m => m.isActive), // Only return active messages
                isEnabled: rules?.isEnabled ?? false
            }
        });
    }
    catch (error) {
        console.error('Error in getPublicBotMessages:', error);
        return res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to retrieve bot messages',
                details: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
};
exports.getPublicBotMessages = getPublicBotMessages;
