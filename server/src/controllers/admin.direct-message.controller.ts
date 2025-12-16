import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { directMessageService } from '../services/direct-message.service';
import prisma from '../utils/prisma';

/**
 * Get conversation with a specific user
 */
export async function getConversation(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.userId);
        const adminId = req.user?.sub;

        if (isNaN(userId) || !adminId) {
            return res.status(400).json({ success: false, message: 'Invalid request' });
        }

        const { page, limit } = req.query;

        // Verify user exists and check zone permission if needed
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { zone: true }
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // TODO: Add zone permission check here if the admin is a Zone Admin
        // For now, we assume middleware handles broad access, but specific zone logic can be added.

        const result = await directMessageService.getConversation(
            adminId,
            userId,
            page ? parseInt(page as string) : undefined,
            limit ? parseInt(limit as string) : undefined
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
    }
}

/**
 * Send a direct message to a user
 */
export async function sendMessage(req: AuthRequest, res: Response) {
    try {
        const receiverId = parseInt(req.params.userId);
        const senderId = req.user?.sub;
        const { content, fileUrl } = req.body;

        if (isNaN(receiverId) || !senderId || !content) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        const message = await directMessageService.sendMessage({
            senderId,
            receiverId,
            content,
            fileUrl,
            type: 'TEXT' // or determine from fileUrl
        });

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
}

/**
 * Get list of users the admin has chatted with
 */
export async function getRecentContacts(req: AuthRequest, res: Response) {
    try {
        const adminId = req.user?.sub;
        if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const contacts = await directMessageService.getRecentConversations(adminId);
        res.json({ success: true, data: contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
}
