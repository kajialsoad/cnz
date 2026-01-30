import { Router } from 'express';
import { authGuard, optionalAuth } from '../middlewares/auth.middleware';
import {
    createNotice,
    getAllNotices,
    getActiveNotices,
    getNoticeById,
    updateNotice,
    toggleNoticeStatus,
    deleteNotice,
    incrementViewCount,
    markAsRead,
    getAnalytics,
    toggleInteraction,
    getNoticeInteractions
} from '../controllers/notice.controller';

const router = Router();

// Admin routes (protected) - MUST come before public routes to avoid conflicts
router.post('/', authGuard, createNotice);
router.get('/analytics/stats', authGuard, getAnalytics);
router.get('/', authGuard, getAllNotices);
router.put('/:id', authGuard, updateNotice);
router.patch('/:id/toggle', authGuard, toggleNoticeStatus);
router.delete('/:id', authGuard, deleteNotice);

// Public routes - specific routes before :id parameter
router.get('/active', optionalAuth, getActiveNotices);
router.post('/:id/view', optionalAuth, incrementViewCount);
router.post('/:id/read', optionalAuth, markAsRead);
router.post('/:id/interact', optionalAuth, toggleInteraction); // Allow without auth
router.get('/:id/interactions', optionalAuth, getNoticeInteractions);
router.get('/:id', optionalAuth, getNoticeById);

export default router;
