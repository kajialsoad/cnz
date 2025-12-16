import prisma from '../utils/prisma';
import { ChatMessageType } from '@prisma/client';

export interface SendDirectMessageInput {
    senderId: number;
    receiverId: number;
    content: string;
    type?: ChatMessageType;
    fileUrl?: string;
}

export class DirectMessageService {
    /**
     * Get conversation between two users (e.g. Admin and Citizen)
     */
    async getConversation(userId1: number, userId2: number, page = 1, limit = 50) {
        try {
            const skip = (page - 1) * limit;

            const where = {
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 }
                ]
            };

            const [messages, total] = await Promise.all([
                prisma.chatMessage.findMany({
                    where,
                    orderBy: { createdAt: 'desc' }, // Latest first
                    skip,
                    take: limit,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                role: true
                            }
                        },
                        receiver: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                                role: true
                            }
                        }
                    }
                }),
                prisma.chatMessage.count({ where })
            ]);

            return {
                messages: messages.reverse(), // Return chronological order for UI
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting direct conversation:', error);
            throw new Error('Failed to fetch conversation');
        }
    }

    /**
     * Send a direct message
     */
    async sendMessage(input: SendDirectMessageInput) {
        try {
            const { senderId, receiverId, content, type = 'TEXT', fileUrl } = input;

            const message = await prisma.chatMessage.create({
                data: {
                    senderId,
                    receiverId,
                    content,
                    type,
                    fileUrl,
                    isRead: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    }
                }
            });

            return message;
        } catch (error) {
            console.error('Error sending direct message:', error);
            throw new Error('Failed to send direct message');
        }
    }

    /**
     * Get recent conversations list for an Admin
     * (Users they have chatted with recently)
     */
    async getRecentConversations(adminId: number) {
        try {
            // This is a bit complex in Prisma without raw SQL for strict "distinct", 
            // but we can fetch recent messages involving this admin and group by the OTHER user.

            // Fetch recent 100 messages involving admin to identify recent contacts
            const recentMessages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: adminId },
                        { receiverId: adminId }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: {
                    senderId: true,
                    receiverId: true,
                    createdAt: true
                }
            });

            // Extract unique contact IDs
            const contactIds = new Set<number>();
            recentMessages.forEach(msg => {
                if (msg.senderId !== adminId) contactIds.add(msg.senderId);
                if (msg.receiverId !== adminId) contactIds.add(msg.receiverId);
            });

            // Fetch details for these contacts
            const contacts = await prisma.user.findMany({
                where: {
                    id: { in: Array.from(contactIds) }
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    role: true,
                    email: true,
                    phone: true,
                    zone: { select: { name: true, zoneNumber: true } },
                    ward: { select: { wardNumber: true } }
                }
            });

            return contacts;
        } catch (error) {
            console.error('Error fetching recent conversations:', error);
            throw new Error('Failed to fetch recent conversations');
        }
    }

    /**
     * Mark messages as read
     */
    async markAsRead(senderId: number, receiverId: number) {
        try {
            // Mark messages sent BY senderId TO receiverId as read
            await prisma.chatMessage.updateMany({
                where: {
                    senderId: senderId,
                    receiverId: receiverId,
                    isRead: false
                },
                data: { isRead: true }
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
            throw new Error('Failed to mark messages as read');
        }
    }
}

export const directMessageService = new DirectMessageService();
