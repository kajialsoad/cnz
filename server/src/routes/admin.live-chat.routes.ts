import { Router } from 'express';
import { adminLiveChatController } from '../controllers/admin.live-chat.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { messageRateLimit } from '../middlewares/rate-limit.middleware';

const router = Router();

// All admin live chat routes require authentication
router.use(authGuard);

/**
 * @route   GET /api/admin/live-chat/statistics
 * @desc    Get live chat statistics for admin dashboard
 * @access  Private (Admin only)
 */
router.get('/statistics', adminLiveChatController.getStatistics.bind(adminLiveChatController));

/**
 * @route   GET /api/admin/live-chat/unread
 * @desc    Get unread message count for admin
 * @access  Private (Admin only)
 */
router.get('/unread', adminLiveChatController.getUnreadCount.bind(adminLiveChatController));

/**
 * @route   GET /api/admin/live-chat
 * @desc    Get all user conversations for admin
 * @access  Private (Admin only)
 * @query   { page?, limit?, cityCorporationCode?, zoneId?, wardId?, unreadOnly?, search? }
 */
router.get('/', adminLiveChatController.getConversations.bind(adminLiveChatController));

/**
 * @route   GET /api/admin/live-chat/:userId
 * @desc    Get messages for a specific user
 * @access  Private (Admin only)
 * @param   userId - User ID
 * @query   { page?, limit? }
 */
router.get('/:userId', adminLiveChatController.getUserMessages.bind(adminLiveChatController));

/**
 * @route   POST /api/admin/live-chat/:userId
 * @desc    Send a message to a user
 * @access  Private (Admin only)
 * @param   userId - User ID
 * @body    { message, imageUrl? }
 */
router.post('/:userId', messageRateLimit, adminLiveChatController.sendMessage.bind(adminLiveChatController));

/**
 * @route   PATCH /api/admin/live-chat/:userId/read
 * @desc    Mark user's messages as read
 * @access  Private (Admin only)
 * @param   userId - User ID
 */
router.patch('/:userId/read', adminLiveChatController.markAsRead.bind(adminLiveChatController));

export default router;
