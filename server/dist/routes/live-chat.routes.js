"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const live_chat_controller_1 = require("../controllers/live-chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const upload_config_1 = require("../config/upload.config");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
// All live chat routes require authentication
router.use(auth_middleware_1.authGuard);
/**
 * @route   GET /api/live-chat
 * @desc    Get user's live chat messages with their assigned admin
 * @access  Private (Authenticated users)
 * @query   { page?, limit? }
 */
router.get('/', live_chat_controller_1.liveChatController.getUserMessages.bind(live_chat_controller_1.liveChatController));
/**
 * @route   POST /api/live-chat
 * @desc    Send a live chat message to assigned admin
 * @access  Private (Authenticated users)
 * @body    { message, imageUrl?, voiceUrl? }
 */
router.post('/', rate_limit_middleware_1.messageRateLimit, live_chat_controller_1.liveChatController.sendMessage.bind(live_chat_controller_1.liveChatController));
/**
 * @route   PATCH /api/live-chat/read
 * @desc    Mark admin's messages as read
 * @access  Private (Authenticated users)
 */
router.patch('/read', live_chat_controller_1.liveChatController.markAsRead.bind(live_chat_controller_1.liveChatController));
/**
 * @route   GET /api/live-chat/unread
 * @desc    Get unread message count
 * @access  Private (Authenticated users)
 */
router.get('/unread', live_chat_controller_1.liveChatController.getUnreadCount.bind(live_chat_controller_1.liveChatController));
/**
 * @route   POST /api/live-chat/upload
 * @desc    Upload image or voice file for live chat
 * @access  Private (Authenticated users)
 * @body    form-data with file: { file }
 */
router.post('/upload', upload_config_1.uploadConfig.single('file'), (err, req, res, next) => {
    // Handle multer errors
    if (err instanceof multer_1.default.MulterError) {
        console.error('❌ Multer error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 10MB limit'
            });
        }
        else if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files uploaded'
            });
        }
        else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field'
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        }
    }
    else if (err) {
        // Handle other errors (e.g., file type validation)
        console.error('❌ Upload error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload failed'
        });
    }
    next();
}, live_chat_controller_1.liveChatController.uploadFile.bind(live_chat_controller_1.liveChatController));
exports.default = router;
