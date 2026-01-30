"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const waste_management_controller_1 = require("../controllers/waste-management.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes (must come before public /posts/:id to avoid route collision)
router.get('/admin/posts', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.getAllPostsForAdmin.bind(waste_management_controller_1.wasteManagementController));
router.post('/admin/posts', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.createPost.bind(waste_management_controller_1.wasteManagementController));
router.put('/admin/posts/:id', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.updatePost.bind(waste_management_controller_1.wasteManagementController));
router.post('/admin/posts/:id/publish', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.publishPost.bind(waste_management_controller_1.wasteManagementController));
router.post('/admin/posts/:id/unpublish', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.unpublishPost.bind(waste_management_controller_1.wasteManagementController));
router.delete('/admin/posts/:id', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.deletePost.bind(waste_management_controller_1.wasteManagementController));
// Admin: View user interactions
router.get('/admin/users/:userId/reactions', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.getUserReactions.bind(waste_management_controller_1.wasteManagementController));
// Public routes (for mobile app users)
router.get('/posts', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.getPublishedPosts.bind(waste_management_controller_1.wasteManagementController));
router.get('/posts/category/:category', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.getPostsByCategory.bind(waste_management_controller_1.wasteManagementController));
router.get('/posts/:id', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.getPostById.bind(waste_management_controller_1.wasteManagementController));
router.post('/posts/:id/reaction', auth_middleware_1.authGuard, waste_management_controller_1.wasteManagementController.toggleReaction.bind(waste_management_controller_1.wasteManagementController));
exports.default = router;
