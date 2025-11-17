"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = exports.ChatService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class ChatService {
    /**
     * Get chat messages for a complaint with pagination
     */
    async getChatMessages(complaintId, query = {}) {
        try {
            const { page = 1, limit = 50 } = query;
            const skip = (page - 1) * limit;
            // Verify complaint exists
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id: complaintId }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Fetch messages with pagination
            const [messages, total] = await Promise.all([
                prisma_1.default.complaintChatMessage.findMany({
                    where: { complaintId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'asc' // Oldest first for chat display
                    }
                }),
                prisma_1.default.complaintChatMessage.count({
                    where: { complaintId }
                })
            ]);
            // Get sender information for each message
            const messagesWithSenderInfo = await Promise.all(messages.map(async (msg) => {
                let senderName = 'Unknown';
                if (msg.senderType === 'CITIZEN') {
                    const user = await prisma_1.default.user.findUnique({
                        where: { id: msg.senderId },
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    });
                    if (user) {
                        senderName = `${user.firstName} ${user.lastName}`;
                    }
                }
                else if (msg.senderType === 'ADMIN') {
                    const admin = await prisma_1.default.user.findUnique({
                        where: { id: msg.senderId },
                        select: {
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    });
                    if (admin) {
                        senderName = `${admin.firstName} ${admin.lastName} (Admin)`;
                    }
                }
                return {
                    ...msg,
                    senderName
                };
            }));
            return {
                messages: messagesWithSenderInfo,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        }
        catch (error) {
            console.error('Error getting chat messages:', error);
            throw error;
        }
    }
    /**
     * Send a new chat message
     */
    async sendChatMessage(input) {
        try {
            // Verify complaint exists
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id: input.complaintId }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Verify sender exists
            const sender = await prisma_1.default.user.findUnique({
                where: { id: input.senderId }
            });
            if (!sender) {
                throw new Error('Sender not found');
            }
            // Create chat message
            const message = await prisma_1.default.complaintChatMessage.create({
                data: {
                    complaintId: input.complaintId,
                    senderId: input.senderId,
                    senderType: input.senderType,
                    message: input.message,
                    imageUrl: input.imageUrl,
                    read: false
                }
            });
            // Get sender name
            const senderName = `${sender.firstName} ${sender.lastName}${input.senderType === 'ADMIN' ? ' (Admin)' : ''}`;
            return {
                ...message,
                senderName
            };
        }
        catch (error) {
            console.error('Error sending chat message:', error);
            throw error;
        }
    }
    /**
     * Mark all messages as read for a complaint
     */
    async markMessagesAsRead(complaintId, readerId, readerType) {
        try {
            // Mark messages as read where the reader is NOT the sender
            // For admin: mark all citizen messages as read
            // For citizen: mark all admin messages as read
            const oppositeType = readerType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
            const result = await prisma_1.default.complaintChatMessage.updateMany({
                where: {
                    complaintId,
                    senderType: oppositeType,
                    read: false
                },
                data: {
                    read: true
                }
            });
            return {
                success: true,
                messagesMarkedAsRead: result.count
            };
        }
        catch (error) {
            console.error('Error marking messages as read:', error);
            throw new Error('Failed to mark messages as read');
        }
    }
    /**
     * Get unread message count for a complaint
     */
    async getUnreadMessageCount(complaintId, userId, userType) {
        try {
            // Count unread messages where the user is NOT the sender
            const oppositeType = userType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
            const count = await prisma_1.default.complaintChatMessage.count({
                where: {
                    complaintId,
                    senderType: oppositeType,
                    read: false
                }
            });
            return count;
        }
        catch (error) {
            console.error('Error getting unread message count:', error);
            throw new Error('Failed to get unread message count');
        }
    }
    /**
     * Get unread message counts for multiple complaints
     */
    async getUnreadMessageCounts(complaintIds, userId, userType) {
        try {
            const oppositeType = userType === 'ADMIN' ? 'CITIZEN' : 'ADMIN';
            // Get all unread messages for the complaints
            const unreadMessages = await prisma_1.default.complaintChatMessage.groupBy({
                by: ['complaintId'],
                where: {
                    complaintId: { in: complaintIds },
                    senderType: oppositeType,
                    read: false
                },
                _count: {
                    id: true
                }
            });
            // Convert to map for easy lookup
            const countsMap = {};
            unreadMessages.forEach((item) => {
                countsMap[item.complaintId] = item._count.id;
            });
            return countsMap;
        }
        catch (error) {
            console.error('Error getting unread message counts:', error);
            throw new Error('Failed to get unread message counts');
        }
    }
    /**
     * Delete a chat message (soft delete by marking as deleted)
     */
    async deleteChatMessage(messageId, userId) {
        try {
            // Verify message exists and user is the sender
            const message = await prisma_1.default.complaintChatMessage.findUnique({
                where: { id: messageId }
            });
            if (!message) {
                throw new Error('Message not found');
            }
            if (message.senderId !== userId) {
                throw new Error('Unauthorized to delete this message');
            }
            // Delete the message
            await prisma_1.default.complaintChatMessage.delete({
                where: { id: messageId }
            });
            return {
                success: true,
                message: 'Message deleted successfully'
            };
        }
        catch (error) {
            console.error('Error deleting chat message:', error);
            throw error;
        }
    }
    /**
     * Get latest message for a complaint
     */
    async getLatestMessage(complaintId) {
        try {
            const message = await prisma_1.default.complaintChatMessage.findFirst({
                where: { complaintId },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            if (!message) {
                return null;
            }
            // Get sender name
            const sender = await prisma_1.default.user.findUnique({
                where: { id: message.senderId },
                select: {
                    firstName: true,
                    lastName: true
                }
            });
            const senderName = sender
                ? `${sender.firstName} ${sender.lastName}${message.senderType === 'ADMIN' ? ' (Admin)' : ''}`
                : 'Unknown';
            return {
                ...message,
                senderName
            };
        }
        catch (error) {
            console.error('Error getting latest message:', error);
            throw new Error('Failed to get latest message');
        }
    }
}
exports.ChatService = ChatService;
exports.chatService = new ChatService();
