import { Router } from 'express';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';
import * as DirectMessageController from '../controllers/admin.direct-message.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(authGuard);
router.use(rbacGuard('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'));

// Get recent contacts
router.get('/contacts', DirectMessageController.getRecentContacts);

// Get conversation with specific user
router.get('/:userId', DirectMessageController.getConversation);

// Send message to specific user
router.post('/:userId', DirectMessageController.sendMessage);

export default router;
