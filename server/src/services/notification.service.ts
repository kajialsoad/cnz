import prisma from '../utils/prisma';
import { Notification } from '@prisma/client';

/**
 * Notification metadata structure for status changes
 */
export interface NotificationMetadata {
    resolutionImages?: string[];
    resolutionNote?: string;
    othersCategory?: string;
    othersSubcategory?: string;
    adminName?: string;
}

/**
 * Pagination options for notifications
 */
export interface NotificationPaginationOptions {
    page: number;
    limit: number;
    unreadOnly?: boolean;
}

/**
 * Notification with parsed metadata
 */
export interface NotificationWithMetadata extends Omit<Notification, 'metadata'> {
    metadata?: NotificationMetadata | null;
    complaint?: {
        id: number;
        title: string;
        status: string;
    } | null;
}

/**
 * Paginated notifications response
 */
export interface PaginatedNotifications {
    notifications: NotificationWithMetadata[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    unreadCount: number;
}

/**
 * NotificationService
 * Handles all notification-related operations including creation, retrieval, and management
 */
export class NotificationService {
    /**
     * Create a notification when complaint status changes
     * @param complaintId - ID of the complaint
     * @param userId - ID of the user to notify
     * @param newStatus - New status of the complaint
     * @param metadata - Additional data (images, notes, etc.)
     * @returns Created notification
     */
    async createStatusChangeNotification(
        complaintId: number,
        userId: number,
        newStatus: string,
        metadata?: NotificationMetadata
    ): Promise<Notification> {
        try {
            // Generate appropriate title and message based on status
            const { title, message } = this.generateNotificationContent(newStatus, metadata);

            // Determine status change string
            const statusChange = this.getStatusChangeString(newStatus);

            // Create notification
            const notification = await prisma.notification.create({
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
        } catch (error) {
            console.error('Error creating status change notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Notify all admins about an event
     * @param title - Notification title
     * @param message - Notification message
     * @param type - Notification type
     * @param complaintId - Optional complaint ID
     * @param metadata - Optional metadata
     */
    async notifyAdmins(
        title: string,
        message: string,
        type: string = 'INFO',
        complaintId?: number,
        metadata?: NotificationMetadata
    ): Promise<void> {
        try {
            console.log(`[NotificationService] notifyAdmins called. Title: ${title}`);
            // Find all admins
            const admins = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'] },
                    status: 'ACTIVE'
                },
                select: { id: true, email: true, role: true }
            });

            console.log(`[NotificationService] Found ${admins.length} active admins:`, admins.map(a => `${a.email} (${a.role})`));

            if (admins.length === 0) {
                console.log('[NotificationService] No active admins found to notify.');
                return;
            }

            // Create notifications in batch
            const notificationsData = admins.map(admin => ({
                userId: admin.id,
                title,
                message,
                type,
                complaintId,
                metadata: metadata ? JSON.stringify(metadata) : null,
                isRead: false,
                createdAt: new Date()
            }));

            const result = await prisma.notification.createMany({
                data: notificationsData
            });
            console.log(`[NotificationService] Successfully created ${result.count} notifications.`);
        } catch (error) {
            console.error('Error notifying admins:', error);
            // Don't throw to avoid blocking main flow
        }
    }

    /**
     * Get user's notifications with pagination
     * @param userId - ID of the user
     * @param options - Pagination options
     * @returns Paginated notifications
     */
    async getUserNotifications(
        userId: number,
        options: NotificationPaginationOptions
    ): Promise<PaginatedNotifications> {
        try {
            const { page = 1, limit = 20, unreadOnly = false } = options;
            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = { userId };
            if (unreadOnly) {
                where.isRead = false;
            }

            console.log(`[NotificationService] getUserNotifications for UserID: ${userId}, Page: ${page}, UnreadOnly: ${unreadOnly}`);

            // Fetch notifications and counts
            const [notifications, total, unreadCount] = await Promise.all([
                prisma.notification.findMany({
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
                prisma.notification.count({ where }),
                prisma.notification.count({
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
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }

    /**
     * Mark a single notification as read
     * @param notificationId - ID of the notification
     * @param userId - ID of the user (optional, for ownership verification)
     * @returns Updated notification
     */
    async markAsRead(notificationId: number, userId?: number): Promise<Notification> {
        try {
            // If userId is provided, verify ownership first
            if (userId !== undefined) {
                const notification = await prisma.notification.findUnique({
                    where: { id: notificationId }
                });

                if (!notification) {
                    throw new Error('Notification not found');
                }

                if (notification.userId !== userId) {
                    throw new Error('Unauthorized to mark this notification as read');
                }
            }

            const notification = await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });

            return notification;
        } catch (error: any) {
            console.error('Error marking notification as read:', error);

            // Re-throw specific errors
            if (error.message === 'Notification not found' || error.message === 'Unauthorized to mark this notification as read') {
                throw error;
            }

            throw new Error('Failed to mark notification as read');
        }
    }

    /**
     * Mark all user's notifications as read
     * @param userId - ID of the user
     * @returns Number of notifications updated
     */
    async markAllAsRead(userId: number): Promise<number> {
        try {
            const result = await prisma.notification.updateMany({
                where: {
                    userId,
                    isRead: false
                },
                data: {
                    isRead: true
                }
            });

            return result.count;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw new Error('Failed to mark all notifications as read');
        }
    }

    /**
     * Get unread notification count for a user
     * @param userId - ID of the user
     * @returns Unread notification count
     */
    async getUnreadCount(userId: number): Promise<number> {
        try {
            const count = await prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            });

            return count;
        } catch (error) {
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
    private generateNotificationContent(
        status: string,
        metadata?: NotificationMetadata
    ): { title: string; message: string } {
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
    private getStatusChangeString(newStatus: string): string {
        return `TO_${newStatus}`;
    }

    /**
     * Parse metadata JSON string
     * @param metadataString - JSON string
     * @returns Parsed metadata object
     */
    private parseMetadata(metadataString: string): NotificationMetadata | null {
        try {
            return JSON.parse(metadataString);
        } catch (error) {
            console.error('Error parsing notification metadata:', error);
            return null;
        }
    }
}

// Export singleton instance
export default new NotificationService();
