"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveChatController = exports.LiveChatController = void 0;
const live_chat_service_1 = __importDefault(require("../services/live-chat.service"));
const client_1 = require("@prisma/client");
/**
 * LiveChatController
 *
 * Handles Live Chat endpoints for mobile app users (citizens).
 * Citizens can chat with their assigned ward admin based on signup location.
 */
class LiveChatController {
    /**
     * Get user's live chat messages
     * @route GET /api/live-chat
     * @access Private (Authenticated users)
     */
    async getUserMessages(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            // Get admin info
            const admin = await live_chat_service_1.default.getUserAdmin(userId);
            // Get messages
            const result = await live_chat_service_1.default.getUserMessages(userId, {
                page,
                limit,
                adminId: admin?.id
            });
            res.status(200).json({
                success: true,
                data: {
                    messages: result.messages,
                    admin: admin ? {
                        id: admin.id,
                        name: `${admin.firstName} ${admin.lastName}`,
                        avatar: admin.avatar,
                        role: admin.role,
                        designation: admin.designation,
                        phone: admin.phone,
                        ward: admin.ward,
                        zone: admin.zone
                    } : null,
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
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch messages',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Send a live chat message
     * @route POST /api/live-chat
     * @access Private (Authenticated users)
     */
    async sendMessage(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            const { message, imageUrl, voiceUrl } = req.body;
            // Validate: must have at least one of text, image, or voice
            const trimmedMessage = message ? message.trim() : '';
            if (!trimmedMessage && !imageUrl && !voiceUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'Message must contain text, image, or voice'
                });
            }
            // Use default text if only image/voice is provided
            const content = trimmedMessage || (imageUrl ? 'Image' : (voiceUrl ? 'Voice Message' : ''));
            if (content.length > 5000) {
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
            else if (voiceUrl) {
                type = client_1.ChatMessageType.VOICE;
            }
            // Send message
            const chatMessage = await live_chat_service_1.default.sendUserMessage(userId, {
                content,
                type,
                fileUrl: imageUrl,
                voiceUrl
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
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send message',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Mark messages as read
     * @route PATCH /api/live-chat/read
     * @access Private (Authenticated users)
     */
    async markAsRead(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            // Get admin ID
            const admin = await live_chat_service_1.default.getUserAdmin(userId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'No admin assigned to your ward'
                });
            }
            // Mark messages from admin to user as read
            const result = await live_chat_service_1.default.markMessagesAsRead(admin.id, // Messages from admin
            userId // To user
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
     * Upload image or voice file
     * @route POST /api/live-chat/upload
     * @access Private (Authenticated users)
     */
    async uploadFile(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }
            console.log('📤 Live Chat file upload:', {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            // Validate file type
            const isImage = req.file.mimetype.startsWith('image/');
            const isAudio = req.file.mimetype.startsWith('audio/');
            if (!isImage && !isAudio) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid file type. Only images and audio files are allowed.'
                });
            }
            // Validate file size (10MB max)
            const MAX_SIZE = 10 * 1024 * 1024; // 10MB
            if (req.file.size > MAX_SIZE) {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 10MB limit'
                });
            }
            // Check if Cloudinary is enabled
            const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';
            if (USE_CLOUDINARY) {
                // Import cloudinary service
                const { cloudUploadService } = require('../services/cloud-upload.service');
                try {
                    let result;
                    if (isImage) {
                        result = await cloudUploadService.uploadImage(req.file, 'live-chat/images');
                        console.log('✅ Uploaded image to Cloudinary:', result.secure_url);
                    }
                    else if (isAudio) {
                        result = await cloudUploadService.uploadAudio(req.file, 'live-chat/voice');
                        console.log('✅ Uploaded voice to Cloudinary:', result.secure_url);
                    }
                    return res.status(200).json({
                        success: true,
                        data: {
                            url: result.secure_url,
                            publicId: result.public_id,
                            filename: req.file.originalname,
                            mimetype: req.file.mimetype,
                            size: req.file.size
                        }
                    });
                }
                catch (error) {
                    console.error('❌ Cloudinary upload failed:', error);
                    // Fallback to local storage if Cloudinary fails
                    const fileUrl = `/uploads/${req.file.filename}`;
                    console.log('⚠️  Falling back to local storage:', fileUrl);
                    return res.status(200).json({
                        success: true,
                        data: {
                            url: fileUrl,
                            filename: req.file.filename,
                            mimetype: req.file.mimetype,
                            size: req.file.size
                        }
                    });
                }
            }
            else {
                // Local storage
                const fileUrl = `/uploads/${req.file.filename}`;
                return res.status(200).json({
                    success: true,
                    data: {
                        url: fileUrl,
                        filename: req.file.filename,
                        mimetype: req.file.mimetype,
                        size: req.file.size
                    }
                });
            }
        }
        catch (error) {
            console.error('Error in uploadFile:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to upload file',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    /**
     * Get unread message count
     * @route GET /api/live-chat/unread
     * @access Private (Authenticated users)
     */
    async getUnreadCount(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            const result = await live_chat_service_1.default.getUnreadCount(userId);
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
exports.LiveChatController = LiveChatController;
exports.liveChatController = new LiveChatController();
