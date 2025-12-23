import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import notificationService from '../services/notification.service';
import { z } from 'zod';

/**
 * Notification Controller
 * Handles all notification-related HTTP requests
 */

/**
 * Get user's notifications with pagination
 * GET /api/notifications
 * Query params: page, limit, unreadOnly
 */
export async function getUserNotifications(req: AuthRequest, res: Response) {
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const unreadOnly = req.query.unreadOnly === 'true';

        // Validate pagination parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
            });
        }

        // Fetch notifications
        const result = await notificationService.getUserNotifications(userId, {
            page,
            limit,
            unreadOnly
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
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
export async function markNotificationAsRead(req: AuthRequest, res: Response) {
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
        const updatedNotification = await notificationService.markAsRead(notificationId, userId);

        return res.status(200).json({
            success: true,
            data: {
                notification: {
                    id: updatedNotification.id,
                    isRead: updatedNotification.isRead
                }
            }
        });
    } catch (error: any) {
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
export async function markAllNotificationsAsRead(req: AuthRequest, res: Response) {
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
        const updatedCount = await notificationService.markAllAsRead(userId);

        return res.status(200).json({
            success: true,
            data: {
                updatedCount
            }
        });
    } catch (error: any) {
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
export async function getUnreadCount(req: AuthRequest, res: Response) {
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
        const count = await notificationService.getUnreadCount(userId);

        return res.status(200).json({
            success: true,
            data: {
                count
            }
        });
    } catch (error: any) {
        console.error('Error in getUnreadCount:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get unread count'
        });
    }
}
