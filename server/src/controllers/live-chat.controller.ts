import { Request, Response } from 'express';
import liveChatService from '../services/live-chat.service';
import { ChatMessageType } from '@prisma/client';
import { SendMessageInput, PaginationQuery } from '../types/live-chat.types';

// Extend Request interface to include user information from JWT
interface AuthenticatedRequest extends Request {
    user?: {
        sub: number;
        role: string;
        email?: string;
        phone?: string;
    };
    file?: any;
}

/**
 * LiveChatController
 * 
 * Handles Live Chat endpoints for mobile app users (citizens).
 * Citizens can chat with their assigned ward admin based on signup location.
 */
export class LiveChatController {
    /**
     * Get user's live chat messages
     * @route GET /api/live-chat
     * @access Private (Authenticated users)
     */
    async getUserMessages(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.sub;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            // Get admin info
            const admin = await liveChatService.getUserAdmin(userId);

            // Get messages
            const result = await liveChatService.getUserMessages(userId, {
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
        } catch (error) {
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
    async sendMessage(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.sub;
            const { message, imageUrl, voiceUrl } = req.body;

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
            let type: ChatMessageType = ChatMessageType.TEXT;
            if (imageUrl) {
                type = ChatMessageType.IMAGE;
            } else if (voiceUrl) {
                type = ChatMessageType.VOICE;
            }

            // Send message
            const chatMessage = await liveChatService.sendUserMessage(userId, {
                content: message.trim(),
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
        } catch (error) {
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
    async markAsRead(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.sub;

            // Get admin ID
            const admin = await liveChatService.getUserAdmin(userId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'No admin assigned to your ward'
                });
            }

            // Mark messages from admin to user as read
            const result = await liveChatService.markMessagesAsRead(
                admin.id, // Messages from admin
                userId    // To user
            );

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
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
    async uploadFile(req: AuthenticatedRequest, res: Response) {
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

            // File URL is constructed by multer middleware
            const fileUrl = `/uploads/${req.file.filename}`;

            res.status(200).json({
                success: true,
                data: {
                    url: fileUrl,
                    filename: req.file.filename,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                }
            });
        } catch (error) {
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
    async getUnreadCount(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userId = req.user.sub;
            const result = await liveChatService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Error in getUnreadCount:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get unread count',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}

export const liveChatController = new LiveChatController();
