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
     * Notify admins about an event with zone-based filtering
     * 🔔 ZONE-BASED NOTIFICATION LOGIC:
     * - If complaintId is provided, fetch complaint location (zoneId)
     * - SUPER_ADMIN: Only notify if complaint.zoneId is in their assignedZoneIds
     * - MASTER_ADMIN: Notify all (can see all zones)
     * - ADMIN: Notify all (backward compatibility)
     *
     * @param title - Notification title
     * @param message - Notification message
     * @param type - Notification type
     * @param complaintId - Optional complaint ID (used for zone filtering)
     * @param metadata - Optional metadata
     */
    async notifyAdmins(title, message, type = 'INFO', complaintId, metadata) {
        try {
            console.log(`[NotificationService] notifyAdmins called. Title: ${title}, ComplaintId: ${complaintId}`);
            // Step 1: Fetch complaint location if complaintId is provided
            let complaintZoneId = null;
            let complaintCityCorporationCode = null;
            if (complaintId) {
                const complaint = await prisma_1.default.complaint.findUnique({
                    where: { id: complaintId },
                    select: {
                        complaintZoneId: true,
                        zoneId: true, // Fallback
                        complaintCityCorporationCode: true,
                        cityCorporationCode: true // Fallback
                    }
                });
                if (complaint) {
                    // Use complaint location fields with fallback to old fields
                    complaintZoneId = complaint.complaintZoneId ?? complaint.zoneId;
                    complaintCityCorporationCode = complaint.complaintCityCorporationCode ?? complaint.cityCorporationCode;
                    console.log(`[NotificationService] Complaint location: Zone=${complaintZoneId}, CityCorpCode=${complaintCityCorporationCode}`);
                }
            }
            // Step 2: Find eligible admins based on role and zone assignment
            const admins = await prisma_1.default.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'] },
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    cityCorporationCode: true,
                    assignedZones: {
                        select: {
                            zoneId: true
                        }
                    }
                }
            });
            console.log(`[NotificationService] Found ${admins.length} active admins`);
            if (admins.length === 0) {
                console.log('[NotificationService] No active admins found to notify.');
                return;
            }
            // Step 3: Filter admins based on zone assignment
            const eligibleAdmins = admins.filter(admin => {
                // MASTER_ADMIN: Can see all complaints
                if (admin.role === 'MASTER_ADMIN') {
                    console.log(`[NotificationService] ✅ MASTER_ADMIN ${admin.email} - sees all zones`);
                    return true;
                }
                // ADMIN: Can see all complaints (backward compatibility)
                if (admin.role === 'ADMIN') {
                    console.log(`[NotificationService] ✅ ADMIN ${admin.email} - sees all zones`);
                    return true;
                }
                // SUPER_ADMIN: Zone-based filtering
                if (admin.role === 'SUPER_ADMIN') {
                    // If no complaint zone, deny access (safe default)
                    if (!complaintZoneId) {
                        console.log(`[NotificationService] ❌ SUPER_ADMIN ${admin.email} - complaint has no zone (denied)`);
                        return false;
                    }
                    // Check if complaint zone is in admin's assigned zones
                    const assignedZoneIds = admin.assignedZones.map(z => z.zoneId);
                    if (assignedZoneIds.length === 0) {
                        console.log(`[NotificationService] ❌ SUPER_ADMIN ${admin.email} - no zones assigned (denied)`);
                        return false;
                    }
                    const hasAccess = assignedZoneIds.includes(complaintZoneId);
                    if (hasAccess) {
                        console.log(`[NotificationService] ✅ SUPER_ADMIN ${admin.email} - zone ${complaintZoneId} in assigned zones [${assignedZoneIds.join(', ')}]`);
                    }
                    else {
                        console.log(`[NotificationService] ❌ SUPER_ADMIN ${admin.email} - zone ${complaintZoneId} NOT in assigned zones [${assignedZoneIds.join(', ')}]`);
                    }
                    return hasAccess;
                }
                // Unknown role - deny by default
                console.log(`[NotificationService] ❌ Unknown role ${admin.role} for ${admin.email} (denied)`);
                return false;
            });
            console.log(`[NotificationService] ${eligibleAdmins.length} admins eligible after zone filtering`);
            if (eligibleAdmins.length === 0) {
                console.log('[NotificationService] No eligible admins found after zone filtering.');
                return;
            }
            // Step 4: Create notifications in batch
            const notificationsData = eligibleAdmins.map(admin => ({
                userId: admin.id,
                title,
                message,
                type,
                complaintId,
                metadata: metadata ? JSON.stringify(metadata) : null,
                isRead: false,
                createdAt: new Date()
            }));
            const result = await prisma_1.default.notification.createMany({
                data: notificationsData
            });
            console.log(`[NotificationService] ✅ Successfully created ${result.count} notifications for zone-filtered admins`);
        }
        catch (error) {
            console.error('Error notifying admins:', error);
            // Don't throw to avoid blocking main flow
        }
    }
    /**
     * Notify ONLY Master Admins about an event
     * Used for sensitive notifications like password changes
     *
     * @param title - Notification title
     * @param message - Notification message
     * @param type - Notification type
     * @param metadata - Optional metadata
     */
    async notifyMasterAdmins(title, message, type = 'INFO', metadata) {
        try {
            console.log(`[NotificationService] notifyMasterAdmins called. Title: ${title}`);
            // Find only Master Admins
            const masterAdmins = await prisma_1.default.user.findMany({
                where: {
                    role: 'MASTER_ADMIN',
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                }
            });
            console.log(`[NotificationService] Found ${masterAdmins.length} Master Admins`);
            if (masterAdmins.length === 0) {
                console.log('[NotificationService] No Master Admins found.');
                return;
            }
            // Create notifications for all Master Admins
            const notificationsData = masterAdmins.map(admin => ({
                userId: admin.id,
                title,
                message,
                type,
                metadata: metadata ? JSON.stringify(metadata) : null,
                isRead: false,
                createdAt: new Date()
            }));
            const result = await prisma_1.default.notification.createMany({
                data: notificationsData
            });
            console.log(`[NotificationService] ✅ Successfully created ${result.count} notifications for Master Admins`);
        }
        catch (error) {
            console.error('Error notifying Master Admins:', error);
            // Don't throw to avoid blocking main flow
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
            console.log(`[NotificationService] getUserNotifications for UserID: ${userId}, Page: ${page}, UnreadOnly: ${unreadOnly}`);
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
     * @param userId - ID of the user (optional, for ownership verification)
     * @returns Updated notification
     */
    async markAsRead(notificationId, userId) {
        try {
            // If userId is provided, verify ownership first
            if (userId !== undefined) {
                const notification = await prisma_1.default.notification.findUnique({
                    where: { id: notificationId }
                });
                if (!notification) {
                    throw new Error('Notification not found');
                }
                if (notification.userId !== userId) {
                    throw new Error('Unauthorized to mark this notification as read');
                }
            }
            const notification = await prisma_1.default.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
            return notification;
        }
        catch (error) {
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
     * Get unread notifications for a user (for polling)
     * @param userId - ID of the user
     * @param limit - Maximum number of notifications to return (default: 50)
     * @returns List of unread notifications
     */
    async getUnreadNotifications(userId, limit = 50) {
        try {
            console.log(`[NotificationService] getUnreadNotifications for UserID: ${userId}, Limit: ${limit}`);
            const notifications = await prisma_1.default.notification.findMany({
                where: {
                    userId,
                    isRead: false
                },
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
            });
            // Parse metadata for each notification
            const formattedNotifications = notifications.map(notification => ({
                ...notification,
                metadata: notification.metadata ? this.parseMetadata(notification.metadata) : undefined
            }));
            console.log(`[NotificationService] Found ${formattedNotifications.length} unread notifications`);
            return formattedNotifications;
        }
        catch (error) {
            console.error('Error getting unread notifications:', error);
            throw new Error('Failed to fetch unread notifications');
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
