"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLiveChatController = exports.AdminLiveChatController = void 0;
const live_chat_service_1 = __importDefault(require("../services/live-chat.service"));
const client_1 = require("@prisma/client");
const system_config_service_1 = require("../services/system-config.service");
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
            const search = req.query.search?.trim();
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
            if (req.query.status) {
                filters.status = req.query.status;
            }
            // Build requestingUser object for role-based filtering (matching User Management)
            let requestingUser = {
                id: adminId,
                role: req.user.role,
                zoneId: req.user.zoneId,
                wardId: req.user.wardId,
            };
            // For Super Admins, fetch their assigned zones
            if (req.user.role === 'SUPER_ADMIN') {
                const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
                const assignedZoneIds = await multiZoneService.getAssignedZoneIds(adminId);
                requestingUser.assignedZoneIds = assignedZoneIds;
            }
            const result = await live_chat_service_1.default.getAllUserConversations(adminId, filters, requestingUser);
            res.status(200).json({
                success: true,
                data: {
                    conversations: result.conversations,
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    hasMore: result.hasMore
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
            // Get limit from system config or use default
            let limit = parseInt(req.query.limit);
            if (!limit || limit <= 0) {
                const configLimit = await system_config_service_1.systemConfigService.get('LIVE_CHAT_MESSAGE_LIMIT', '120');
                limit = parseInt(configLimit);
            }
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
            const imageFile = req.file;
            console.log('📨 [LIVE CHAT] Sending message:', {
                adminId,
                userId,
                hasMessage: !!message,
                hasImageUrl: !!imageUrl,
                hasImageFile: !!imageFile,
                imageFileName: imageFile?.originalname
            });
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
            }
            // Validate message content - must have either message or image
            const hasMessage = message && message.trim().length > 0;
            const hasImage = imageUrl || imageFile;
            if (!hasMessage && !hasImage) {
                return res.status(400).json({
                    success: false,
                    message: 'Message content or image is required'
                });
            }
            if (message && message.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is too long (max 5000 characters)'
                });
            }
            // Determine message type and file URL
            let type = client_1.ChatMessageType.TEXT;
            let finalFileUrl = imageUrl;
            // If file was uploaded, upload to Cloudinary
            if (imageFile) {
                type = client_1.ChatMessageType.IMAGE;
                console.log('📤 [LIVE CHAT] Uploading image to Cloudinary...');
                // Import cloud upload service
                const { cloudUploadService } = await Promise.resolve().then(() => __importStar(require('../services/cloud-upload.service')));
                const { isCloudinaryEnabled } = await Promise.resolve().then(() => __importStar(require('../config/upload.config')));
                if (isCloudinaryEnabled()) {
                    try {
                        // Upload to Cloudinary
                        const uploadResult = await cloudUploadService.uploadImage(imageFile, 'live-chat');
                        finalFileUrl = uploadResult.secure_url;
                        console.log('✅ [LIVE CHAT] Image uploaded to Cloudinary:', finalFileUrl);
                    }
                    catch (uploadError) {
                        console.error('❌ [LIVE CHAT] Cloudinary upload failed:', uploadError);
                        // Fall back to local storage
                        finalFileUrl = imageFile.path || imageFile.filename;
                        console.log('⚠️  [LIVE CHAT] Using local storage fallback:', finalFileUrl);
                    }
                }
                else {
                    // Use local storage
                    finalFileUrl = imageFile.path || imageFile.filename;
                    console.log('📁 [LIVE CHAT] Using local storage:', finalFileUrl);
                }
            }
            else if (imageUrl) {
                type = client_1.ChatMessageType.IMAGE;
            }
            console.log('💾 [LIVE CHAT] Saving message to database:', {
                type,
                fileUrl: finalFileUrl
            });
            // Send message
            const chatMessage = await live_chat_service_1.default.sendAdminMessage(adminId, userId, {
                content: message ? message.trim() : 'Image',
                type,
                fileUrl: finalFileUrl
            });
            console.log('✅ [LIVE CHAT] Message saved successfully:', chatMessage.id);
            res.status(201).json({
                success: true,
                message: 'Message sent successfully',
                data: {
                    message: chatMessage
                }
            });
        }
        catch (error) {
            console.error('❌ [LIVE CHAT] Error in sendMessage:', error);
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
