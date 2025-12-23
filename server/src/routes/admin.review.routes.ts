import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Admin Review Routes
 * All routes require admin authentication
 * Base path: /api/admin/complaints/analytics/reviews
 */

/**
 * GET /api/admin/complaints/analytics/reviews
 * Get review analytics with filters
 * @query   cityCorporationCode - Filter by city corporation
 * @query   zoneId - Filter by zone
 * @query   wardId - Filter by ward
 * @query   startDate - Filter by start date (ISO format)
 * @query   endDate - Filter by end date (ISO format)
 * @access  Private (Admin only)
 */
router.get(
    '/analytics/reviews',
    authGuard,
    rbacGuard('SUPER_ADMIN', 'ADMIN', 'MASTER_ADMIN'),
    reviewController.getReviewAnalytics
);

export default router;
