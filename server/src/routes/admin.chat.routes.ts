import { Router } from 'express';
import {
    getChatMessages,
    sendChatMessage,
    markMessagesAsRead
} from '../controllers/admin.chat.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

console.log('🔧 Loading admin.chat.routes.ts...');

const router = Router();

// All routes require authentication and admin role
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN'));

// Get chat messages for a complaint
router.get('/:complaintId', getChatMessages);
console.log('🔧 Admin chat route registered: GET /:complaintId');

// Send a chat message
router.post('/:complaintId', sendChatMessage);
console.log('🔧 Admin chat route registered: POST /:complaintId');

// Mark messages as read
router.patch('/:complaintId/read', markMessagesAsRead);
console.log('🔧 Admin chat route registered: PATCH /:complaintId/read');

console.log('✅ Admin chat routes module loaded successfully');

export default router;
