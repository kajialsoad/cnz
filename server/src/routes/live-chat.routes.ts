import { Router } from 'express';
import { liveChatController } from '../controllers/live-chat.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { messageRateLimit } from '../middlewares/rate-limit.middleware';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

// All live chat routes require authentication
router.use(authGuard);

/**
 * @route   GET /api/live-chat
 * @desc    Get user's live chat messages with their assigned admin
 * @access  Private (Authenticated users)
 * @query   { page?, limit? }
 */
router.get('/', liveChatController.getUserMessages.bind(liveChatController));

/**
 * @route   POST /api/live-chat
 * @desc    Send a live chat message to assigned admin
 * @access  Private (Authenticated users)
 * @body    { message, imageUrl?, voiceUrl? }
 */
router.post('/', messageRateLimit, liveChatController.sendMessage.bind(liveChatController));

/**
 * @route   PATCH /api/live-chat/read
 * @desc    Mark admin's messages as read
 * @access  Private (Authenticated users)
 */
router.patch('/read', liveChatController.markAsRead.bind(liveChatController));

/**
 * @route   GET /api/live-chat/unread
 * @desc    Get unread message count
 * @access  Private (Authenticated users)
 */
router.get('/unread', liveChatController.getUnreadCount.bind(liveChatController));

/**
 * @route   POST /api/live-chat/upload
 * @desc    Upload image or voice file for live chat
 * @access  Private (Authenticated users)
 * @body    form-data with file: { image or voice }
 */
router.post('/upload', uploadController.uploadComplaintFiles, liveChatController.uploadFile.bind(liveChatController));

export default router;
