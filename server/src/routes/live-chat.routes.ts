import { Router, Request, Response, NextFunction } from 'express';
import { liveChatController } from '../controllers/live-chat.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { messageRateLimit } from '../middlewares/rate-limit.middleware';
import { uploadConfig } from '../config/upload.config';
import multer from 'multer';

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
 * @body    form-data with file: { file }
 */
router.post('/upload',
    uploadConfig.single('file'),
    (err: any, req: Request, res: Response, next: NextFunction) => {
        // Handle multer errors
        if (err instanceof multer.MulterError) {
            console.error('❌ Multer error:', err);

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 10MB limit'
                });
            } else if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded'
                });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`
                });
            }
        } else if (err) {
            // Handle other errors (e.g., file type validation)
            console.error('❌ Upload error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }

        next();
    },
    liveChatController.uploadFile.bind(liveChatController)
);

export default router;
