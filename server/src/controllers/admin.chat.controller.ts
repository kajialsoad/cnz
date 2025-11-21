import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { chatService } from '../services/chat.service';

/**
 * Get all chat conversations
 */
export async function getChatConversations(req: AuthRequest, res: Response) {
    try {
        const { search, district, upazila, ward, zone, cityCorporationCode, thanaId, status, unreadOnly, page, limit } = req.query;

        const result = await chatService.getChatConversations({
            search: search as string,
            district: district as string,
            upazila: upazila as string,
            ward: ward as string,
            zone: zone as string,
            cityCorporationCode: cityCorporationCode as string,
            thanaId: thanaId ? parseInt(thanaId as string) : undefined,
            status: status as string,
            unreadOnly: unreadOnly === 'true',
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined
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
        const statistics = await chatService.getChatStatistics();

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

        const { message, imageUrl } = req.body;

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

        const chatMessage = await chatService.sendChatMessage({
            complaintId,
            senderId: req.user.sub,
            senderType: 'ADMIN',
            message: message.trim(),
            imageUrl
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
