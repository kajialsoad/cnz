import prisma from '../utils/prisma';

/**
 * Create notification when admin sends message in complaint chat
 */
export async function createComplaintChatNotification(
    userId: number,
    complaintId: number,
    adminName: string,
    messagePreview: string
) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type: 'ADMIN_MESSAGE',
                title: `অভিযোগ #${complaintId} সম্পর্কে বার্তা`,
                message: `অভিযোগ দায়িত্ব প্রাপ্ত কর্মকর্তা আপনাকে বার্তা পাঠিয়েছে`,
                complaintId,
                isRead: false,
                metadata: JSON.stringify({
                    complaintId,
                    adminName,
                    messagePreview: messagePreview.substring(0, 100),
                    action: 'OPEN_COMPLAINT_CHAT',
                    timestamp: new Date().toISOString()
                })
            }
        });

        console.log('✅ Notification created:', notification.id);
        return notification;
    } catch (error) {
        console.error('❌ Failed to create notification:', error);
        return null;
    }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(userId: number) {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50, // Limit to last 50 unread
            include: {
                complaint: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        return notifications;
    } catch (error) {
        console.error('❌ Failed to fetch notifications:', error);
        return [];
    }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
    try {
        await prisma.notification.update({
            where: {
                id: notificationId,
                userId // Security: ensure user owns this notification
            },
            data: {
                isRead: true
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to mark notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
    try {
        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to mark all notifications as read:', error);
        return false;
    }
}
