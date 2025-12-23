import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Notification Routes
 * All routes require authentication
 * Base path: /api/notifications
 */

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 20, max: 100)
 * @query   unreadOnly - Filter unread only (default: false)
 * @access  Private (Authenticated users)
 */
router.get(
    '/',
    authGuard,
    notificationController.getUserNotifications
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 * @access  Private (Authenticated users)
 */
router.get(
    '/unread-count',
    authGuard,
    notificationController.getUnreadCount
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 * @param   id - Notification ID
 * @access  Private (Authenticated users, must own notification)
 */
router.patch(
    '/:id/read',
    authGuard,
    notificationController.markNotificationAsRead
);

/**
 * PATCH /api/notifications/read-all
 * Mark all user's notifications as read
 * @access  Private (Authenticated users)
 */
router.patch(
    '/read-all',
    authGuard,
    notificationController.markAllNotificationsAsRead
);

export default router;
