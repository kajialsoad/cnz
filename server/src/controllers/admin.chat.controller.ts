import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { chatService } from '../services/chat.service';
import { cloudUploadService } from '../services/cloud-upload.service';
import { isCloudinaryEnabled } from '../config/cloudinary.config';
import { multiZoneService } from '../services/multi-zone.service';

/**
 * Get all chat conversations - shows ALL complaints for messaging
 * Each complaint has its own chat entry (complaint-centric view)
 * ✅ FIXED: Added proper admin user context (matching All Complaints page)
 */
export async function getChatConversations(req: AuthRequest, res: Response) {
    try {
        const { search, ward, zone, cityCorporationCode, unreadOnly, page, limit } = req.query;

        // Get allowed zones for Super Admin
        let allowedZoneIds: number[] | undefined;
        if (req.user?.role === 'SUPER_ADMIN') {
            allowedZoneIds = await multiZoneService.getAssignedZoneIds(req.user.sub);
        }

        // Prepare admin user info for filtering (MATCHING admin.complaint.controller.ts)
        let adminUser: { role: string; cityCorporationCode?: string; permissions?: string } | undefined;
        if (req.user) {
            // Fetch full user data to get permissions
            const prisma = (await import('../utils/prisma')).default;
            const fullUser = await prisma.user.findUnique({
                where: { id: req.user.sub },
                select: {
                    role: true,
                    cityCorporationCode: true,
                    permissions: true
                }
            });

            if (fullUser) {
                adminUser = {
                    role: fullUser.role,
                    cityCorporationCode: fullUser.cityCorporationCode || undefined,
                    permissions: fullUser.permissions || undefined
                };

                console.log(`🔐 Chat filtering for ${fullUser.role} ${req.user.sub}:`, {
                    cityCorporation: adminUser.cityCorporationCode,
                    permissions: adminUser.permissions
                });
            }
        }

        // Get all complaints with their chat messages (complaint-centric)
        const result = await chatService.getAllCitizensForChat({
            search: search as string,
            ward: ward as string,
            zone: zone as string,
            cityCorporationCode: cityCorporationCode as string,
            unreadOnly: unreadOnly === 'true',
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            allowedZoneIds,
            adminUser // Pass full admin user object
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getChatConversations:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat conversations'
        });
    }
}

/**
 * Get chat statistics
 */
export async function getChatStatistics(req: AuthRequest, res: Response) {
    try {
        // Get allowed zones for Super Admin
        let allowedZoneIds: number[] | undefined;
        if (req.user?.role === 'SUPER_ADMIN') {
            allowedZoneIds = await multiZoneService.getAssignedZoneIds(req.user.sub);
        }

        // Prepare admin user info for filtering
        let adminUser: { role: string; cityCorporationCode?: string; permissions?: string } | undefined;
        if (req.user) {
            const prisma = (await import('../utils/prisma')).default;
            const fullUser = await prisma.user.findUnique({
                where: { id: req.user.sub },
                select: {
                    role: true,
                    cityCorporationCode: true,
                    permissions: true
                }
            });

            if (fullUser) {
                adminUser = {
                    role: fullUser.role,
                    cityCorporationCode: fullUser.cityCorporationCode || undefined,
                    permissions: fullUser.permissions || undefined
                };
            }
        }

        const statistics = await chatService.getChatStatistics(allowedZoneIds, adminUser);

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Error in getChatStatistics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat statistics'
        });
    }
}

/**
 * Get chat messages for a complaint
 */
export async function getChatMessages(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.complaintId);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        const { page, limit } = req.query;

        const result = await chatService.getChatMessages(complaintId, {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined
        });

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getChatMessages:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch chat messages'
        });
    }
}

/**
 * Send a chat message
 */
export async function sendChatMessage(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.complaintId);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        const { message, imageUrl, voiceUrl } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Get uploaded image file if present
        const imageFile = req.file;
        let finalImageUrl = imageUrl;

        // If an image file was uploaded, upload it to Cloudinary
        if (imageFile && isCloudinaryEnabled()) {
            try {
                console.log('📤 Uploading chat image to Cloudinary...');
                const uploadResult = await cloudUploadService.uploadImage(imageFile, 'chat');
                finalImageUrl = uploadResult.secure_url;
                console.log('✅ Chat image uploaded to Cloudinary:', finalImageUrl);
            } catch (error) {
                console.error('❌ Failed to upload chat image to Cloudinary:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload image'
                });
            }
        }

        const chatMessage = await chatService.sendChatMessage({
            complaintId,
            senderId: req.user.sub,
            senderType: 'ADMIN',
            message: message.trim(),
            imageUrl: finalImageUrl,
            voiceUrl
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: chatMessage }
        });
    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send message'
        });
    }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.complaintId);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const result = await chatService.markMessagesAsRead(
            complaintId,
            req.user.sub,
            'ADMIN'
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
            data: result
        });
    } catch (error) {
        console.error('Error in markMessagesAsRead:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to mark messages as read'
        });
    }
}
