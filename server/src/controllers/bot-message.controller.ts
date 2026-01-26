/**
 * Bot Message Controller
 * 
 * Handles HTTP requests for bot message management
 * Requirements: Bot Message System - Admin API Endpoints
 */

import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { botMessageService } from '../services/bot-message.service';
import { ChatType } from '@prisma/client';
import { sanitizeContent } from '../utils/xss-sanitizer';

/**
 * Get all bot messages for a chat type
 * GET /api/admin/bot-messages
 * 
 * Query params:
 * - chatType?: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 */
export const getBotMessages = async (req: AuthRequest, res: Response) => {
    try {
        const { chatType } = req.query;

        // Validate chatType if provided
        if (chatType && !['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType as string)) {
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
            messages = await botMessageService.getBotMessages(chatType as ChatType);
            rules = await botMessageService.getTriggerRules(chatType as ChatType);
        } else {
            // Get messages for both chat types
            const liveChatMessages = await botMessageService.getBotMessages('LIVE_CHAT');
            const complaintChatMessages = await botMessageService.getBotMessages('COMPLAINT_CHAT');
            const liveChatRules = await botMessageService.getTriggerRules('LIVE_CHAT');
            const complaintChatRules = await botMessageService.getTriggerRules('COMPLAINT_CHAT');

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
    } catch (error) {
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
export const createBotMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { chatType, messageKey, content, contentBn, stepNumber, displayOrder } = req.body;

        // Sanitize content to prevent XSS attacks
        const sanitizedContent = sanitizeContent(content);
        const sanitizedContentBn = sanitizeContent(contentBn);

        // Validation is handled by validator middleware
        const message = await botMessageService.createBotMessage({
            chatType,
            messageKey,
            content: sanitizedContent,
            contentBn: sanitizedContentBn,
            stepNumber,
            displayOrder
        });

        return res.status(201).json({
            success: true,
            data: message,
            message: 'Bot message created successfully'
        });
    } catch (error) {
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
export const updateBotMessage = async (req: AuthRequest, res: Response) => {
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

        // Sanitize content fields if present
        const updates: any = {
            stepNumber,
            isActive,
            displayOrder
        };

        if (content !== undefined) {
            updates.content = sanitizeContent(content);
        }
        if (contentBn !== undefined) {
            updates.contentBn = sanitizeContent(contentBn);
        }

        const message = await botMessageService.updateBotMessage(messageId, updates);

        return res.status(200).json({
            success: true,
            data: message,
            message: 'Bot message updated successfully'
        });
    } catch (error) {
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

/**
 * Delete a bot message
 * DELETE /api/admin/bot-messages/:id
 */
export const deleteBotMessage = async (req: AuthRequest, res: Response) => {
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

        await botMessageService.deleteBotMessage(messageId);

        return res.status(200).json({
            success: true,
            message: 'Bot message deleted successfully'
        });
    } catch (error) {
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

/**
 * Update trigger rules for a chat type
 * PUT /api/admin/bot-messages/rules/:chatType
 * 
 * Body:
 * - isEnabled?: boolean
 * - reactivationThreshold?: number
 * - resetStepsOnReactivate?: boolean
 */
export const updateTriggerRules = async (req: AuthRequest, res: Response) => {
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

        const rules = await botMessageService.updateTriggerRules(chatType as ChatType, {
            isEnabled,
            reactivationThreshold,
            resetStepsOnReactivate
        });

        return res.status(200).json({
            success: true,
            data: {
                rules
            },
            message: 'Trigger rules updated successfully'
        });
    } catch (error) {
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

/**
 * Get bot analytics
 * GET /api/admin/bot-messages/analytics
 * 
 * Query params:
 * - chatType?: 'LIVE_CHAT' | 'COMPLAINT_CHAT'
 * - startDate?: string (ISO date)
 * - endDate?: string (ISO date)
 */
export const getBotAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { chatType, startDate, endDate } = req.query;

        // Validate chatType if provided
        if (chatType && !['LIVE_CHAT', 'COMPLAINT_CHAT'].includes(chatType as string)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_CHAT_TYPE',
                    message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT'
                }
            });
        }

        // Parse dates if provided
        const query: any = {};
        if (chatType) {
            query.chatType = chatType as ChatType;
        }
        if (startDate) {
            query.startDate = new Date(startDate as string);
        }
        if (endDate) {
            query.endDate = new Date(endDate as string);
        }

        const analytics = await botMessageService.getBotAnalytics(query);

        return res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
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
export const getPublicBotMessages = async (req: AuthRequest, res: Response) => {
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
        const messages = await botMessageService.getBotMessages(chatType as ChatType);
        const rules = await botMessageService.getTriggerRules(chatType as ChatType);

        // Set cache headers (cache for 5 minutes)
        res.set('Cache-Control', 'public, max-age=300');

        return res.status(200).json({
            success: true,
            data: {
                messages: messages.filter(m => m.isActive), // Only return active messages
                isEnabled: rules?.isEnabled ?? false
            }
        });
    } catch (error) {
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
