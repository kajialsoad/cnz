import { Router } from 'express';
import { wasteManagementController } from '../controllers/waste-management.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// Admin routes (must come before public /posts/:id to avoid route collision)
router.get('/admin/posts', authGuard, wasteManagementController.getAllPostsForAdmin.bind(wasteManagementController));
router.post('/admin/posts/reorder', authGuard, wasteManagementController.reorder.bind(wasteManagementController));
router.post('/admin/posts', authGuard, wasteManagementController.createPost.bind(wasteManagementController));
router.put('/admin/posts/:id', authGuard, wasteManagementController.updatePost.bind(wasteManagementController));
router.post('/admin/posts/:id/publish', authGuard, wasteManagementController.publishPost.bind(wasteManagementController));
router.post('/admin/posts/:id/unpublish', authGuard, wasteManagementController.unpublishPost.bind(wasteManagementController));
router.delete('/admin/posts/:id', authGuard, wasteManagementController.deletePost.bind(wasteManagementController));

// Admin: View user interactions
router.get('/admin/users/:userId/reactions', authGuard, wasteManagementController.getUserReactions.bind(wasteManagementController));

// Public routes (for mobile app users)
router.get('/posts', authGuard, wasteManagementController.getPublishedPosts.bind(wasteManagementController));
router.get('/posts/category/:category', authGuard, wasteManagementController.getPostsByCategory.bind(wasteManagementController));
router.get('/posts/:id', authGuard, wasteManagementController.getPostById.bind(wasteManagementController));
router.post('/posts/:id/reaction', authGuard, wasteManagementController.toggleReaction.bind(wasteManagementController));

export default router;
