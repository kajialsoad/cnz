"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLiveChatController = exports.AdminLiveChatController = void 0;
const live_chat_service_1 = __importDefault(require("../services/live-chat.service"));
const client_1 = require("@prisma/client");
/**
 * AdminLiveChatController
 *
 * Handles Live Chat endpoints for admin panel.
 * Admins can view and respond to live chat messages from citizens in their jurisdiction.
 */
class AdminLiveChatController {
    /**
     * Get all user conversations for admin
     * @route GET /api/admin/live-chat
     * @access Private (Admin only)
     */
    async getConversations(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const unreadOnly = req.query.unreadOnly === 'true';
            const search = req.query.search;
            // Get filters
            const filters = {
                page,
                limit,
                unreadOnly,
                search
            };
            if (req.query.cityCorporationCode) {
                filters.cityCorporationCode = req.query.cityCorporationCode;
            }
            if (req.query.zoneId) {
                filters.zoneId = parseInt(req.query.zoneId);
            }
            if (req.query.wardId) {
                filters.wardId = parseInt(req.query.wardId);
            }
            const result = await live_chat_service_1.default.getAllUserConversations(adminId, filters);
            res.status(200).json({
                success: true,
                data: {
                    conversations: result.conversations,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        hasMore: result.hasMore
                    }
                }
            });
        }
        catch (error) {
            console.error('Error in getConversations:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch conversations',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Get messages for a specific user
     * @route GET /api/admin/live-chat/:userId
     * @access Private (Admin only)
     */
    async getUserMessages(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const userId = parseInt(req.params.userId);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }
            // Get messages
            const result = await live_chat_service_1.default.getUserMessages(userId, {
                page,
                limit,
                adminId
            });
            res.status(200).json({
                success: true,
                data: {
                    messages: result.messages,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        hasMore: result.hasMore
                    }
                }
            });
        }
        catch (error) {
            console.error('Error in getUserMessages:', error);
            // Handle access denied errors
            if (error instanceof Error && error.message.includes('does not have access')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch messages',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Send a message to a user
     * @route POST /api/admin/live-chat/:userId
     * @access Private (Admin only)
     */
    async sendMessage(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const userId = parseInt(req.params.userId);
            const { message, imageUrl } = req.body;
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }
            // Validate message content
            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message content is required'
                });
            }
            if (message.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is too long (max 5000 characters)'
                });
            }
            // Determine message type
            let type = client_1.ChatMessageType.TEXT;
            if (imageUrl) {
                type = client_1.ChatMessageType.IMAGE;
            }
            // Send message
            const chatMessage = await live_chat_service_1.default.sendAdminMessage(adminId, userId, {
                content: message.trim(),
                type,
                fileUrl: imageUrl
            });
            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    message: chatMessage
                }
            });
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            // Handle access denied errors
            if (error instanceof Error && error.message.includes('does not have access')) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send message',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Mark user's messages as read
     * @route PATCH /api/admin/live-chat/:userId/read
     * @access Private (Admin only)
     */
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }
            // Mark messages from user to admin as read
            const result = await live_chat_service_1.default.markMessagesAsRead(userId, // Messages from user
            adminId // To admin
            );
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to mark messages as read',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Get live chat statistics
     * @route GET /api/admin/live-chat/statistics
     * @access Private (Admin only)
     */
    async getStatistics(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const stats = await live_chat_service_1.default.getStatistics(adminId);
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch statistics',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Get unread message count for admin
     * @route GET /api/admin/live-chat/unread
     * @access Private (Admin only)
     */
    async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const adminId = req.user.sub;
            const result = await live_chat_service_1.default.getUnreadCount(adminId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error('Error in getUnreadCount:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get unread count',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.AdminLiveChatController = AdminLiveChatController;
exports.adminLiveChatController = new AdminLiveChatController();
