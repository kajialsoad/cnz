import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadCount,
    getUnreadNotifications
} from '../controllers/notification.controller';

const router = Router();

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 * Query params: page, limit, unreadOnly
 */
router.get('/', authGuard, getUserNotifications);

/**
 * GET /api/notifications/unread
 * Get unread notifications (for polling)
 * Returns list of unread notifications without pagination
 */
router.get('/unread', authGuard, getUnreadNotifications);

/**
 * GET /api/notifications/count-unread
 * Get unread notification count
 * Renamed from unread-count to avoid ad blockers
 */
router.get('/count-unread', authGuard, getUnreadCount);

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', authGuard, markNotificationAsRead);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.patch('/read-all', authGuard, markAllNotificationsAsRead);

export default router;
