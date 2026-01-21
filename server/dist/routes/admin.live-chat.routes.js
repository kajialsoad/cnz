"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_live_chat_controller_1 = require("../controllers/admin.live-chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const router = (0, express_1.Router)();
// All admin live chat routes require authentication
router.use(auth_middleware_1.authGuard);
/**
 * @route   GET /api/admin/live-chat/statistics
 * @desc    Get live chat statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/statistics', admin_live_chat_controller_1.adminLiveChatController.getStatistics.bind(admin_live_chat_controller_1.adminLiveChatController));
/**
 * @route   GET /api/admin/live-chat/unread
 * @desc    Get unread message count for admin
 * @access  Private (Admin only)
 */
router.get('/unread', admin_live_chat_controller_1.adminLiveChatController.getUnreadCount.bind(admin_live_chat_controller_1.adminLiveChatController));
/**
 * @route   GET /api/admin/live-chat
 * @desc    Get all user conversations for admin
 * @access  Private (Admin only)
 * @query   { page?, limit?, cityCorporationCode?, zoneId?, wardId?, unreadOnly?, search? }
 */
router.get('/', admin_live_chat_controller_1.adminLiveChatController.getConversations.bind(admin_live_chat_controller_1.adminLiveChatController));
/**
 * @route   GET /api/admin/live-chat/:userId
 * @desc    Get messages for a specific user
 * @access  Private (Admin only)
 * @param   userId - User ID
 * @query   { page?, limit? }
 */
router.get('/:userId', admin_live_chat_controller_1.adminLiveChatController.getUserMessages.bind(admin_live_chat_controller_1.adminLiveChatController));
/**
 * @route   POST /api/admin/live-chat/:userId
 * @desc    Send a message to a user
 * @access  Private (Admin only)
 * @param   userId - User ID
 * @body    { message, imageUrl? }
 */
router.post('/:userId', rate_limit_middleware_1.messageRateLimit, admin_live_chat_controller_1.adminLiveChatController.sendMessage.bind(admin_live_chat_controller_1.adminLiveChatController));
/**
 * @route   PATCH /api/admin/live-chat/:userId/read
 * @desc    Mark user's messages as read
 * @access  Private (Admin only)
 * @param   userId - User ID
 */
router.patch('/:userId/read', admin_live_chat_controller_1.adminLiveChatController.markAsRead.bind(admin_live_chat_controller_1.adminLiveChatController));
exports.default = router;
