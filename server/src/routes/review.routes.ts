import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Review Routes
 * Base path: /api/complaints/:complaintId/reviews (user routes)
 * Base path: /api/admin/complaints/analytics/reviews (admin routes)
 */

/**
 * POST /api/complaints/:complaintId/review
 * Submit a review for a complaint
 * @param   complaintId - Complaint ID
 * @body    rating - Rating (1-5)
 * @body    comment - Optional comment (max 300 chars)
 * @access  Private (Authenticated users, must own complaint)
 */
router.post(
    '/:complaintId/review',
    authGuard,
    reviewController.submitReview
);

/**
 * GET /api/complaints/:complaintId/reviews
 * Get all reviews for a specific complaint
 * @param   complaintId - Complaint ID
 * @access  Public (anyone can view reviews)
 */
router.get(
    '/:complaintId/reviews',
    reviewController.getComplaintReviews
);

export default router;
