"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_chat_controller_1 = require("../controllers/admin.chat.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
console.log('🔧 Loading admin.chat.routes.ts...');
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_middleware_1.authGuard);
router.use((0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'));
// Get all chat conversations (must be before /:complaintId to avoid route conflict)
router.get('/', admin_chat_controller_1.getChatConversations);
console.log('🔧 Admin chat route registered: GET /');
// Get chat statistics
router.get('/statistics', admin_chat_controller_1.getChatStatistics);
console.log('🔧 Admin chat route registered: GET /statistics');
// Get chat messages for a complaint
router.get('/:complaintId', admin_chat_controller_1.getChatMessages);
console.log('🔧 Admin chat route registered: GET /:complaintId');
// Send a chat message
router.post('/:complaintId', admin_chat_controller_1.sendChatMessage);
console.log('🔧 Admin chat route registered: POST /:complaintId');
// Mark messages as read
router.patch('/:complaintId/read', admin_chat_controller_1.markMessagesAsRead);
console.log('🔧 Admin chat route registered: PATCH /:complaintId/read');
console.log('✅ Admin chat routes module loaded successfully');
exports.default = router;
