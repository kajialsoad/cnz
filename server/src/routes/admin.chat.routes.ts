import { Router } from 'express';
import {
    getChatConversations,
    getChatStatistics,
    getChatMessages,
    sendChatMessage,
    markMessagesAsRead
} from '../controllers/admin.chat.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';
import { uploadConfig } from '../config/upload.config';

console.log('🔧 Loading admin.chat.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN'));

// Get all chat conversations (must be before /:complaintId to avoid route conflict)
router.get('/', getChatConversations);
console.log('🔧 Admin chat route registered: GET /');

// Get chat statistics
router.get('/statistics', getChatStatistics);
console.log('🔧 Admin chat route registered: GET /statistics');

// Get chat messages for a complaint
router.get('/:complaintId', getChatMessages);
console.log('🔧 Admin chat route registered: GET /:complaintId');

// Send a chat message (with optional image upload)
router.post('/:complaintId', uploadConfig.single('image'), sendChatMessage);
console.log('🔧 Admin chat route registered: POST /:complaintId (with image upload)');

// Mark messages as read
router.patch('/:complaintId/read', markMessagesAsRead);
console.log('🔧 Admin chat route registered: PATCH /:complaintId/read');

console.log('✅ Admin chat routes module loaded successfully');

export default router;
