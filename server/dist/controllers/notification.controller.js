"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserNotifications = getUserNotifications;
exports.markNotificationAsRead = markNotificationAsRead;
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
exports.getUnreadCount = getUnreadCount;
const notification_service_1 = __importDefault(require("../services/notification.service"));
/**
 * Notification Controller
 * Handles all notification-related HTTP requests
 */
/**
 * Get user's notifications with pagination
 * GET /api/notifications
 * Query params: page, limit, unreadOnly
 */
async function getUserNotifications(req, res) {
    try {
        // Verify user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userId = req.user.sub;
        // Parse and validate query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';
        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
            });
        }
        // Fetch notifications
        const result = await notification_service_1.default.getUserNotifications(userId, {
            page,
            limit,
            unreadOnly
        });
        return res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getUserNotifications:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch notifications'
        });
    }
}
/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
async function markNotificationAsRead(req, res) {
    try {
        // Verify user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userId = req.user.sub;
        const notificationId = parseInt(req.params.id);
        // Validate notification ID
        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }
        // Mark as read (service will verify ownership and throw error if not found/unauthorized)
        const updatedNotification = await notification_service_1.default.markAsRead(notificationId, userId);
        return res.status(200).json({
            success: true,
            data: {
                notification: {
                    id: updatedNotification.id,
                    isRead: updatedNotification.isRead
                }
            }
        });
    }
    catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        // Handle specific error cases
        if (error.message === 'Notification not found') {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }
        if (error.message === 'Unauthorized to mark this notification as read') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to mark this notification as read'
            });
        }
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark notification as read'
        });
    }
}
/**
 * Mark all user's notifications as read
 * PATCH /api/notifications/read-all
 */
async function markAllNotificationsAsRead(req, res) {
    try {
        // Verify user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userId = req.user.sub;
        // Mark all as read
        const updatedCount = await notification_service_1.default.markAllAsRead(userId);
        return res.status(200).json({
            success: true,
            data: {
                updatedCount
            }
        });
    }
    catch (error) {
        console.error('Error in markAllNotificationsAsRead:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to mark all notifications as read'
        });
    }
}
/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
async function getUnreadCount(req, res) {
    try {
        // Verify user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userId = req.user.sub;
        // Get unread count
        const count = await notification_service_1.default.getUnreadCount(userId);
        return res.status(200).json({
            success: true,
            data: {
                count
            }
        });
    }
    catch (error) {
        console.error('Error in getUnreadCount:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get unread count'
        });
    }
}
