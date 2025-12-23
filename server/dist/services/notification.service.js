"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * NotificationService
 * Handles all notification-related operations including creation, retrieval, and management
 */
class NotificationService {
    /**
     * Create a notification when complaint status changes
     * @param complaintId - ID of the complaint
     * @param userId - ID of the user to notify
     * @param newStatus - New status of the complaint
     * @param metadata - Additional data (images, notes, etc.)
     * @returns Created notification
     */
    async createStatusChangeNotification(complaintId, userId, newStatus, metadata) {
        try {
            // Generate appropriate title and message based on status
            const { title, message } = this.generateNotificationContent(newStatus, metadata);
            // Determine status change string
            const statusChange = this.getStatusChangeString(newStatus);
            // Create notification
            const notification = await prisma_1.default.notification.create({
                data: {
                    userId,
                    complaintId,
                    title,
                    message,
                    type: 'STATUS_CHANGE',
                    statusChange,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                    isRead: false
                }
            });
            return notification;
        }
        catch (error) {
            console.error('Error creating status change notification:', error);
            throw new Error('Failed to create notification');
        }
    }
    /**
     * Get user's notifications with pagination
     * @param userId - ID of the user
     * @param options - Pagination options
     * @returns Paginated notifications
     */
    async getUserNotifications(userId, options) {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = options;
            const skip = (page - 1) * limit;
            // Build where clause
            const where = { userId };
            if (unreadOnly) {
                where.isRead = false;
            }
            // Fetch notifications and counts
            const [notifications, total, unreadCount] = await Promise.all([
                prisma_1.default.notification.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        complaint: {
                            select: {
                                id: true,
                                title: true,
                                status: true
                            }
                        }
                    }
                }),
                prisma_1.default.notification.count({ where }),
                prisma_1.default.notification.count({
                    where: {
                        userId,
                        isRead: false
                    }
                })
            ]);
            // Parse metadata for each notification
            const formattedNotifications = notifications.map(notification => ({
                ...notification,
                metadata: notification.metadata ? this.parseMetadata(notification.metadata) : undefined
            }));
            return {
                notifications: formattedNotifications,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                unreadCount
            };
        }
        catch (error) {
            console.error('Error getting user notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }
    /**
     * Mark a single notification as read
     * @param notificationId - ID of the notification
     * @returns Updated notification
     */
    async markAsRead(notificationId) {
        try {
            const notification = await prisma_1.default.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
            return notification;
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            throw new Error('Failed to mark notification as read');
        }
    }
    /**
     * Mark all user's notifications as read
     * @param userId - ID of the user
     * @returns Number of notifications updated
     */
    async markAllAsRead(userId) {
        try {
            const result = await prisma_1.default.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });
            return result.count;
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }
    /**
     * Get unread notification count for a user
     * @param userId - ID of the user
     * @returns Unread notification count
     */
    async getUnreadCount(userId) {
        try {
            const count = await prisma_1.default.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            });
            return count;
        }
        catch (error) {
            console.error('Error getting unread count:', error);
            throw new Error('Failed to get unread count');
        }
    }
    /**
     * Generate notification title and message based on status
     * @param status - New complaint status
     * @param metadata - Additional metadata
     * @returns Title and message
     */
    generateNotificationContent(status, metadata) {
        switch (status) {
            case 'IN_PROGRESS':
                return {
                    title: 'Complaint In Progress',
                    message: 'Your complaint has been accepted and is currently being processed by our team.'
                };
            case 'RESOLVED':
                return {
                    title: 'Complaint Resolved',
                    message: metadata?.resolutionNote
                        ? `Your complaint has been resolved. ${metadata.resolutionNote}`
                        : 'Your complaint has been resolved. Please review the resolution details and provide your feedback.'
                };
            case 'OTHERS':
                const categoryText = metadata?.othersCategory === 'CORPORATION_INTERNAL'
                    ? 'Corporation Internal'
                    : 'Corporation External';
                const subcategoryText = metadata?.othersSubcategory || 'relevant department';
                return {
                    title: 'Complaint Categorized',
                    message: `Your complaint has been categorized as ${categoryText} - ${subcategoryText}. It will be forwarded to the appropriate authority.`
                };
            case 'REJECTED':
                return {
                    title: 'Complaint Rejected',
                    message: 'Your complaint has been reviewed and rejected. Please contact support for more information.'
                };
            default:
                return {
                    title: 'Complaint Status Updated',
                    message: `Your complaint status has been updated to ${status}.`
                };
        }
    }
    /**
     * Get status change string for tracking
     * @param newStatus - New status
     * @returns Status change string
     */
    getStatusChangeString(newStatus) {
        return `TO_${newStatus}`;
    }
    /**
     * Parse metadata JSON string
     * @param metadataString - JSON string
     * @returns Parsed metadata object
     */
    parseMetadata(metadataString) {
        try {
            return JSON.parse(metadataString);
        }
        catch (error) {
            console.error('Error parsing notification metadata:', error);
            return null;
        }
    }
}
exports.NotificationService = NotificationService;
// Export singleton instance
exports.default = new NotificationService();
