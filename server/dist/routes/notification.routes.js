"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
/**
 * GET /api/notifications
 * Get user's notifications with pagination
 * Query params: page, limit, unreadOnly
 */
router.get('/', auth_middleware_1.authGuard, notification_controller_1.getUserNotifications);
/**
 * GET /api/notifications/unread
 * Get unread notifications (for polling)
 * Returns list of unread notifications without pagination
 */
router.get('/unread', auth_middleware_1.authGuard, notification_controller_1.getUnreadNotifications);
/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', auth_middleware_1.authGuard, notification_controller_1.getUnreadCount);
/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', auth_middleware_1.authGuard, notification_controller_1.markNotificationAsRead);
/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
router.patch('/read-all', auth_middleware_1.authGuard, notification_controller_1.markAllNotificationsAsRead);
exports.default = router;
