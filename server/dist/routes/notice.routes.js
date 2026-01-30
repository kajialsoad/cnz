"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notice_controller_1 = require("../controllers/notice.controller");
const router = (0, express_1.Router)();
// Admin routes (protected) - MUST come before public routes to avoid conflicts
router.post('/', auth_middleware_1.authGuard, notice_controller_1.createNotice);
router.get('/analytics/stats', auth_middleware_1.authGuard, notice_controller_1.getAnalytics);
router.get('/', auth_middleware_1.authGuard, notice_controller_1.getAllNotices);
router.put('/:id', auth_middleware_1.authGuard, notice_controller_1.updateNotice);
router.patch('/:id/toggle', auth_middleware_1.authGuard, notice_controller_1.toggleNoticeStatus);
router.delete('/:id', auth_middleware_1.authGuard, notice_controller_1.deleteNotice);
// Public routes - specific routes before :id parameter
router.get('/active', auth_middleware_1.optionalAuth, notice_controller_1.getActiveNotices);
router.post('/:id/view', auth_middleware_1.optionalAuth, notice_controller_1.incrementViewCount);
router.post('/:id/read', auth_middleware_1.optionalAuth, notice_controller_1.markAsRead);
router.post('/:id/interact', auth_middleware_1.optionalAuth, notice_controller_1.toggleInteraction); // Allow without auth
router.get('/:id/interactions', auth_middleware_1.optionalAuth, notice_controller_1.getNoticeInteractions);
router.get('/:id', auth_middleware_1.optionalAuth, notice_controller_1.getNoticeById);
exports.default = router;
