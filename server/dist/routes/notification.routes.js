"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController = __importStar(require("../controllers/notification.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
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
router.get('/', auth_middleware_1.authGuard, notificationController.getUserNotifications);
/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 * @access  Private (Authenticated users)
 */
router.get('/unread-count', auth_middleware_1.authGuard, notificationController.getUnreadCount);
/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 * @param   id - Notification ID
 * @access  Private (Authenticated users, must own notification)
 */
router.patch('/:id/read', auth_middleware_1.authGuard, notificationController.markNotificationAsRead);
/**
 * PATCH /api/notifications/read-all
 * Mark all user's notifications as read
 * @access  Private (Authenticated users)
 */
router.patch('/read-all', auth_middleware_1.authGuard, notificationController.markAllNotificationsAsRead);
exports.default = router;
