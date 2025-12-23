"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
/**
 * ReviewService
 * Handles all review-related operations including submission, retrieval, and analytics
 */
class ReviewService {
    /**
     * Submit a review for a complaint
     * @param input - Review submission data
     * @returns Created review
     * @throws Error if validation fails or duplicate review
     */
    async submitReview(input) {
        try {
            const { complaintId, userId, rating, comment } = input;
            // Validate rating (1-5)
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }
            // Validate comment length if provided
            if (comment && comment.length > 300) {
                throw new Error('Comment must not exceed 300 characters');
            }
            // Check if complaint exists and is resolved
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id: complaintId },
                select: {
                    id: true,
                    status: true,
                    userId: true
                }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Only resolved complaints can be reviewed
            if (complaint.status !== client_1.Complaint_status.RESOLVED) {
                throw new Error('Only resolved complaints can be reviewed');
            }
            // Verify user owns the complaint
            if (complaint.userId !== userId) {
                throw new Error('You can only review your own complaints');
            }
            // Check for existing review (unique constraint will also catch this)
            const existingReview = await prisma_1.default.review.findUnique({
                where: {
                    complaintId_userId: {
                        complaintId,
                        userId
                    }
                }
            });
            if (existingReview) {
                throw new Error('You have already submitted a review for this complaint');
            }
            // Create review
            const review = await prisma_1.default.review.create({
                data: {
                    complaintId,
                    userId,
                    rating,
                    comment: comment || null
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    },
                    complaint: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                }
            });
            return review;
        }
        catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    }
    /**
     * Get all reviews for a specific complaint
     * @param complaintId - ID of the complaint
     * @returns Array of reviews with user details
     */
    async getReviewsByComplaint(complaintId) {
        try {
            const reviews = await prisma_1.default.review.findMany({
                where: { complaintId },
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    }
                }
            });
            return reviews;
        }
        catch (error) {
            console.error('Error getting reviews by complaint:', error);
            throw new Error('Failed to fetch reviews');
        }
    }
    /**
     * Get comprehensive review analytics
     * @param filters - Optional filters for analytics
     * @returns Review analytics data
     */
    async getReviewAnalytics(filters = {}) {
        try {
            const { cityCorporationCode, zoneId, wardId, startDate, endDate } = filters;
            // Build where clause for complaints
            const complaintWhere = {
                status: client_1.Complaint_status.RESOLVED
            };
            // Add user filters through complaint relationship
            const userFilter = {};
            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }
            if (zoneId) {
                userFilter.zoneId = zoneId;
            }
            if (wardId) {
                userFilter.wardId = wardId;
            }
            if (Object.keys(userFilter).length > 0) {
                complaintWhere.user = userFilter;
            }
            // Add date range filter
            if (startDate || endDate) {
                complaintWhere.resolvedAt = {};
                if (startDate) {
                    complaintWhere.resolvedAt.gte = startDate;
                }
                if (endDate) {
                    complaintWhere.resolvedAt.lte = endDate;
                }
            }
            // Get all resolved complaints matching filters
            const resolvedComplaints = await prisma_1.default.complaint.findMany({
                where: complaintWhere,
                select: { id: true }
            });
            const resolvedComplaintIds = resolvedComplaints.map(c => c.id);
            // If no resolved complaints, return empty analytics
            if (resolvedComplaintIds.length === 0) {
                return {
                    averageRating: 0,
                    totalReviews: 0,
                    reviewPercentage: 0,
                    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    recentReviews: []
                };
            }
            // Get reviews for these complaints
            const reviews = await prisma_1.default.review.findMany({
                where: {
                    complaintId: { in: resolvedComplaintIds }
                },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    },
                    complaint: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            // Calculate metrics
            const totalReviews = reviews.length;
            const totalResolved = resolvedComplaintIds.length;
            const reviewPercentage = totalResolved > 0
                ? Math.round((totalReviews / totalResolved) * 100)
                : 0;
            const averageRating = await this.getAverageRating(filters);
            const ratingDistribution = await this.getRatingDistribution(filters);
            // Get recent reviews (top 10)
            const recentReviews = reviews.slice(0, 10).map(review => ({
                id: review.id,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                complaint: review.complaint,
                user: review.user
            }));
            return {
                averageRating,
                totalReviews,
                reviewPercentage,
                ratingDistribution,
                recentReviews
            };
        }
        catch (error) {
            console.error('Error getting review analytics:', error);
            throw new Error('Failed to fetch review analytics');
        }
    }
    /**
     * Get average rating for complaints
     * @param filters - Optional filters
     * @returns Average rating (0-5)
     */
    async getAverageRating(filters = {}) {
        try {
            const { cityCorporationCode, zoneId, wardId, startDate, endDate } = filters;
            // Build where clause
            const complaintWhere = {
                status: client_1.Complaint_status.RESOLVED
            };
            const userFilter = {};
            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }
            if (zoneId) {
                userFilter.zoneId = zoneId;
            }
            if (wardId) {
                userFilter.wardId = wardId;
            }
            if (Object.keys(userFilter).length > 0) {
                complaintWhere.user = userFilter;
            }
            if (startDate || endDate) {
                complaintWhere.resolvedAt = {};
                if (startDate) {
                    complaintWhere.resolvedAt.gte = startDate;
                }
                if (endDate) {
                    complaintWhere.resolvedAt.lte = endDate;
                }
            }
            // Get complaint IDs
            const complaints = await prisma_1.default.complaint.findMany({
                where: complaintWhere,
                select: { id: true }
            });
            const complaintIds = complaints.map(c => c.id);
            if (complaintIds.length === 0) {
                return 0;
            }
            // Calculate average rating
            const result = await prisma_1.default.review.aggregate({
                where: {
                    complaintId: { in: complaintIds }
                },
                _avg: {
                    rating: true
                }
            });
            return result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0;
        }
        catch (error) {
            console.error('Error calculating average rating:', error);
            throw new Error('Failed to calculate average rating');
        }
    }
    /**
     * Get rating distribution (count of each rating 1-5)
     * @param filters - Optional filters
     * @returns Rating distribution object
     */
    async getRatingDistribution(filters = {}) {
        try {
            const { cityCorporationCode, zoneId, wardId, startDate, endDate } = filters;
            // Build where clause
            const complaintWhere = {
                status: client_1.Complaint_status.RESOLVED
            };
            const userFilter = {};
            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }
            if (zoneId) {
                userFilter.zoneId = zoneId;
            }
            if (wardId) {
                userFilter.wardId = wardId;
            }
            if (Object.keys(userFilter).length > 0) {
                complaintWhere.user = userFilter;
            }
            if (startDate || endDate) {
                complaintWhere.resolvedAt = {};
                if (startDate) {
                    complaintWhere.resolvedAt.gte = startDate;
                }
                if (endDate) {
                    complaintWhere.resolvedAt.lte = endDate;
                }
            }
            // Get complaint IDs
            const complaints = await prisma_1.default.complaint.findMany({
                where: complaintWhere,
                select: { id: true }
            });
            const complaintIds = complaints.map(c => c.id);
            // Initialize distribution
            const distribution = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            };
            if (complaintIds.length === 0) {
                return distribution;
            }
            // Get all reviews
            const reviews = await prisma_1.default.review.findMany({
                where: {
                    complaintId: { in: complaintIds }
                },
                select: {
                    rating: true
                }
            });
            // Count each rating
            reviews.forEach(review => {
                if (review.rating >= 1 && review.rating <= 5) {
                    distribution[review.rating]++;
                }
            });
            return distribution;
        }
        catch (error) {
            console.error('Error getting rating distribution:', error);
            throw new Error('Failed to get rating distribution');
        }
    }
    /**
     * Check if user can submit review for a complaint
     * @param complaintId - ID of the complaint
     * @param userId - ID of the user
     * @returns Boolean indicating if review can be submitted
     */
    async canSubmitReview(complaintId, userId) {
        try {
            // Check complaint status and ownership
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id: complaintId },
                select: {
                    status: true,
                    userId: true
                }
            });
            if (!complaint) {
                return false;
            }
            // Must be resolved and owned by user
            if (complaint.status !== client_1.Complaint_status.RESOLVED || complaint.userId !== userId) {
                return false;
            }
            // Check if review already exists
            const existingReview = await prisma_1.default.review.findUnique({
                where: {
                    complaintId_userId: {
                        complaintId,
                        userId
                    }
                }
            });
            return !existingReview;
        }
        catch (error) {
            console.error('Error checking review eligibility:', error);
            return false;
        }
    }
}
exports.ReviewService = ReviewService;
// Export singleton instance
exports.default = new ReviewService();
