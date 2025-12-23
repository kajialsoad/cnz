import reviewService, { ReviewService, ReviewSubmissionInput } from '../../src/services/review.service';
import prisma from '../../src/utils/prisma';
import { Review, Complaint_status } from '@prisma/client';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        review: {
            create: jest.fn(),
            findMany: jest.fn(),
            findUnique: jest.fn(),
            aggregate: jest.fn(),
        },
        complaint: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe('ReviewService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('submitReview', () => {
        const validInput: ReviewSubmissionInput = {
            complaintId: 50,
            userId: 100,
            rating: 4,
            comment: 'Great service!'
        };

        it('should successfully submit a valid review', async () => {
            const mockComplaint = {
                id: 50,
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            const mockReview: any = {
                id: 1,
                complaintId: 50,
                userId: 100,
                rating: 4,
                comment: 'Great service!',
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 100,
                    firstName: 'John',
                    lastName: 'Doe',
                    avatar: null
                },
                complaint: {
                    id: 50,
                    title: 'Test Complaint'
                }
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

            const result = await reviewService.submitReview(validInput);

            expect(prisma.review.create).toHaveBeenCalledWith({
                data: {
                    complaintId: 50,
                    userId: 100,
                    rating: 4,
                    comment: 'Great service!'
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

            expect(result).toEqual(mockReview);
        });

        it('should reject rating below 1', async () => {
            const invalidInput = { ...validInput, rating: 0 };

            await expect(
                reviewService.submitReview(invalidInput)
            ).rejects.toThrow('Rating must be between 1 and 5');
        });

        it('should reject rating above 5', async () => {
            const invalidInput = { ...validInput, rating: 6 };

            await expect(
                reviewService.submitReview(invalidInput)
            ).rejects.toThrow('Rating must be between 1 and 5');
        });

        it('should reject comment exceeding 300 characters', async () => {
            const longComment = 'a'.repeat(301);
            const invalidInput = { ...validInput, comment: longComment };

            await expect(
                reviewService.submitReview(invalidInput)
            ).rejects.toThrow('Comment must not exceed 300 characters');
        });

        it('should reject review for non-existent complaint', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(null);

            await expect(
                reviewService.submitReview(validInput)
            ).rejects.toThrow('Complaint not found');
        });

        it('should reject review for non-resolved complaint', async () => {
            const mockComplaint = {
                id: 50,
                status: Complaint_status.PENDING,
                userId: 100
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);

            await expect(
                reviewService.submitReview(validInput)
            ).rejects.toThrow('Only resolved complaints can be reviewed');
        });

        it('should reject review for complaint not owned by user', async () => {
            const mockComplaint = {
                id: 50,
                status: Complaint_status.RESOLVED,
                userId: 999 // Different user
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);

            await expect(
                reviewService.submitReview(validInput)
            ).rejects.toThrow('You can only review your own complaints');
        });

        it('should reject duplicate review', async () => {
            const mockComplaint = {
                id: 50,
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            const existingReview = {
                id: 1,
                complaintId: 50,
                userId: 100,
                rating: 5,
                comment: 'Already reviewed'
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

            await expect(
                reviewService.submitReview(validInput)
            ).rejects.toThrow('You have already submitted a review for this complaint');
        });

        it('should accept review without comment', async () => {
            const inputWithoutComment = {
                complaintId: 50,
                userId: 100,
                rating: 5
            };

            const mockComplaint = {
                id: 50,
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            const mockReview: any = {
                id: 1,
                complaintId: 50,
                userId: 100,
                rating: 5,
                comment: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: { id: 100, firstName: 'John', lastName: 'Doe', avatar: null },
                complaint: { id: 50, title: 'Test' }
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

            const result = await reviewService.submitReview(inputWithoutComment);

            expect(result.comment).toBeNull();
        });
    });

    describe('getReviewsByComplaint', () => {
        it('should fetch all reviews for a complaint', async () => {
            const mockReviews = [
                {
                    id: 1,
                    complaintId: 50,
                    userId: 100,
                    rating: 5,
                    comment: 'Excellent',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 100,
                        firstName: 'John',
                        lastName: 'Doe',
                        avatar: null
                    }
                },
                {
                    id: 2,
                    complaintId: 50,
                    userId: 101,
                    rating: 4,
                    comment: 'Good',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    user: {
                        id: 101,
                        firstName: 'Jane',
                        lastName: 'Smith',
                        avatar: null
                    }
                }
            ];

            (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

            const result = await reviewService.getReviewsByComplaint(50);

            expect(prisma.review.findMany).toHaveBeenCalledWith({
                where: { complaintId: 50 },
                orderBy: { createdAt: 'desc' },
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

            expect(result).toHaveLength(2);
            expect(result[0].rating).toBe(5);
        });

        it('should return empty array when no reviews exist', async () => {
            (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reviewService.getReviewsByComplaint(50);

            expect(result).toEqual([]);
        });

        it('should handle errors during fetch', async () => {
            (prisma.review.findMany as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            await expect(
                reviewService.getReviewsByComplaint(50)
            ).rejects.toThrow('Failed to fetch reviews');
        });
    });

    describe('getReviewAnalytics', () => {
        it('should return comprehensive analytics', async () => {
            const mockComplaints = [
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ];

            const mockReviews = [
                {
                    id: 1,
                    complaintId: 1,
                    rating: 5,
                    comment: 'Great',
                    createdAt: new Date(),
                    user: { firstName: 'John', lastName: 'Doe' },
                    complaint: { id: 1, title: 'Test 1' }
                },
                {
                    id: 2,
                    complaintId: 2,
                    rating: 4,
                    comment: 'Good',
                    createdAt: new Date(),
                    user: { firstName: 'Jane', lastName: 'Smith' },
                    complaint: { id: 2, title: 'Test 2' }
                }
            ];

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);
            (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
            (prisma.review.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: 4.5 }
            });

            const result = await reviewService.getReviewAnalytics();

            expect(result.totalReviews).toBe(2);
            expect(result.reviewPercentage).toBe(67); // 2/3 * 100
            expect(result.averageRating).toBe(4.5);
            expect(result.recentReviews).toHaveLength(2);
        });

        it('should return empty analytics when no resolved complaints', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reviewService.getReviewAnalytics();

            expect(result.totalReviews).toBe(0);
            expect(result.reviewPercentage).toBe(0);
            expect(result.averageRating).toBe(0);
            expect(result.ratingDistribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
            expect(result.recentReviews).toEqual([]);
        });

        it('should apply city corporation filter', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await reviewService.getReviewAnalytics({
                cityCorporationCode: 'DSCC'
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.RESOLVED,
                    user: { cityCorporationCode: 'DSCC' }
                },
                select: { id: true }
            });
        });

        it('should apply zone and ward filters', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await reviewService.getReviewAnalytics({
                zoneId: 5,
                wardId: 10
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.RESOLVED,
                    user: {
                        zoneId: 5,
                        wardId: 10
                    }
                },
                select: { id: true }
            });
        });

        it('should apply date range filters', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            await reviewService.getReviewAnalytics({
                startDate,
                endDate
            });

            expect(prisma.complaint.findMany).toHaveBeenCalledWith({
                where: {
                    status: Complaint_status.RESOLVED,
                    resolvedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                select: { id: true }
            });
        });
    });

    describe('getAverageRating', () => {
        it('should calculate average rating correctly', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([
                { id: 1 },
                { id: 2 }
            ]);

            (prisma.review.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: 4.3 }
            });

            const result = await reviewService.getAverageRating();

            expect(result).toBe(4.3);
        });

        it('should return 0 when no reviews exist', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
            (prisma.review.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: null }
            });

            const result = await reviewService.getAverageRating();

            expect(result).toBe(0);
        });

        it('should return 0 when no resolved complaints', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reviewService.getAverageRating();

            expect(result).toBe(0);
        });
    });

    describe('getRatingDistribution', () => {
        it('should calculate rating distribution correctly', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([
                { id: 1 },
                { id: 2 },
                { id: 3 }
            ]);

            (prisma.review.findMany as jest.Mock).mockResolvedValue([
                { rating: 5 },
                { rating: 5 },
                { rating: 4 },
                { rating: 3 },
                { rating: 1 }
            ]);

            const result = await reviewService.getRatingDistribution();

            expect(result).toEqual({
                1: 1,
                2: 0,
                3: 1,
                4: 1,
                5: 2
            });
        });

        it('should return zero distribution when no reviews', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
            (prisma.review.findMany as jest.Mock).mockResolvedValue([]);

            const result = await reviewService.getRatingDistribution();

            expect(result).toEqual({
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            });
        });

        it('should ignore invalid ratings', async () => {
            (prisma.complaint.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);
            (prisma.review.findMany as jest.Mock).mockResolvedValue([
                { rating: 5 },
                { rating: 0 }, // Invalid
                { rating: 6 }, // Invalid
                { rating: 4 }
            ]);

            const result = await reviewService.getRatingDistribution();

            expect(result).toEqual({
                1: 0,
                2: 0,
                3: 0,
                4: 1,
                5: 1
            });
        });
    });

    describe('canSubmitReview', () => {
        it('should return true when user can submit review', async () => {
            const mockComplaint = {
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(true);
        });

        it('should return false when complaint not found', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(false);
        });

        it('should return false when complaint not resolved', async () => {
            const mockComplaint = {
                status: Complaint_status.PENDING,
                userId: 100
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(false);
        });

        it('should return false when user does not own complaint', async () => {
            const mockComplaint = {
                status: Complaint_status.RESOLVED,
                userId: 999
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(false);
        });

        it('should return false when review already exists', async () => {
            const mockComplaint = {
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            const existingReview = {
                id: 1,
                complaintId: 50,
                userId: 100
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(existingReview);

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(false);
        });

        it('should handle errors gracefully', async () => {
            (prisma.complaint.findUnique as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const result = await reviewService.canSubmitReview(50, 100);

            expect(result).toBe(false);
        });
    });

    describe('Edge Cases', () => {
        it('should handle exactly 300 character comment', async () => {
            const exactComment = 'a'.repeat(300);
            const input = {
                complaintId: 50,
                userId: 100,
                rating: 5,
                comment: exactComment
            };

            const mockComplaint = {
                id: 50,
                status: Complaint_status.RESOLVED,
                userId: 100
            };

            const mockReview: any = {
                id: 1,
                complaintId: 50,
                userId: 100,
                rating: 5,
                comment: exactComment,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: { id: 100, firstName: 'John', lastName: 'Doe', avatar: null },
                complaint: { id: 50, title: 'Test' }
            };

            (prisma.complaint.findUnique as jest.Mock).mockResolvedValue(mockComplaint);
            (prisma.review.findUnique as jest.Mock).mockResolvedValue(null);
            (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

            const result = await reviewService.submitReview(input);

            expect(result.comment).toHaveLength(300);
        });

        it('should limit recent reviews to 10', async () => {
            const mockComplaints = Array.from({ length: 15 }, (_, i) => ({ id: i + 1 }));
            const mockReviews = Array.from({ length: 15 }, (_, i) => ({
                id: i + 1,
                complaintId: i + 1,
                rating: 5,
                comment: `Review ${i + 1}`,
                createdAt: new Date(),
                user: { firstName: 'User', lastName: `${i + 1}` },
                complaint: { id: i + 1, title: `Complaint ${i + 1}` }
            }));

            (prisma.complaint.findMany as jest.Mock).mockResolvedValue(mockComplaints);
            (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
            (prisma.review.aggregate as jest.Mock).mockResolvedValue({
                _avg: { rating: 5 }
            });

            const result = await reviewService.getReviewAnalytics();

            expect(result.recentReviews).toHaveLength(10);
        });
    });
});
