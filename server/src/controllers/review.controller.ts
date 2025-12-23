import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import reviewService from '../services/review.service';
import { z } from 'zod';

/**
 * Review Controller
 * Handles all review-related HTTP requests
 */

/**
 * Validation schema for review submission
 */
const reviewSubmissionSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(300).optional()
});

/**
 * Submit a review for a complaint
 * POST /api/complaints/:complaintId/review
 */
export async function submitReview(req: AuthRequest, res: Response) {
    try {
        // Verify user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const userId = req.user.sub;
        const complaintId = parseInt(req.params.complaintId);

        // Validate complaint ID
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        // Validate request body
        const validation = reviewSubmissionSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: validation.error.errors
            });
        }

        const { rating, comment } = validation.data;

        // Submit review
        const review = await reviewService.submitReview({
            complaintId,
            userId,
            rating,
            comment
        });

        return res.status(201).json({
            success: true,
            data: {
                review: {
                    id: review.id,
                    complaintId: review.complaintId,
                    userId: review.userId,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt
                }
            }
        });
    } catch (error: any) {
        console.error('Error in submitReview:', error);

        // Handle specific error cases
        if (error.message === 'Complaint not found') {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (error.message === 'Only resolved complaints can be reviewed') {
            return res.status(400).json({
                success: false,
                message: 'Only resolved complaints can be reviewed'
            });
        }

        if (error.message === 'You can only review your own complaints') {
            return res.status(403).json({
                success: false,
                message: 'You can only review your own complaints'
            });
        }

        if (error.message === 'You have already submitted a review for this complaint') {
            return res.status(409).json({
                success: false,
                message: 'You have already submitted a review for this complaint'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit review'
        });
    }
}

/**
 * Get all reviews for a specific complaint
 * GET /api/complaints/:complaintId/reviews
 */
export async function getComplaintReviews(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.complaintId);

        // Validate complaint ID
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        // Get reviews
        const reviews = await reviewService.getReviewsByComplaint(complaintId);

        return res.status(200).json({
            success: true,
            data: {
                reviews: reviews.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    user: {
                        id: review.user.id,
                        firstName: review.user.firstName,
                        lastName: review.user.lastName,
                        avatar: review.user.avatar
                    }
                }))
            }
        });
    } catch (error: any) {
        console.error('Error in getComplaintReviews:', error);

        // Handle specific error cases
        if (error.message === 'Complaint not found') {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch reviews'
        });
    }
}

/**
 * Get review analytics (Admin only)
 * GET /api/admin/complaints/analytics/reviews
 */
export async function getReviewAnalytics(req: AuthRequest, res: Response) {
    try {
        // Verify user is authenticated as admin
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Parse query parameters for filters
        const cityCorporationCode = req.query.cityCorporationCode as string | undefined;
        const zoneId = req.query.zoneId ? parseInt(req.query.zoneId as string) : undefined;
        const wardId = req.query.wardId ? parseInt(req.query.wardId as string) : undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        // Validate date parameters
        if (startDate && isNaN(startDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid start date format'
            });
        }

        if (endDate && isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid end date format'
            });
        }

        // Get analytics
        const analytics = await reviewService.getReviewAnalytics({
            cityCorporationCode,
            zoneId,
            wardId,
            startDate,
            endDate
        });

        return res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error: any) {
        console.error('Error in getReviewAnalytics:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch review analytics'
        });
    }
}
