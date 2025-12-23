import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { generateAccessToken } from '../helpers/test-utils';
import { users_role, UserStatus, Complaint_status } from '@prisma/client';

describe('Review API Routes', () => {
    let userToken: string;
    let adminToken: string;
    let userId: number;
    let adminId: number;
    let otherUserId: number;
    let resolvedComplaintId: number;
    let pendingComplaintId: number;
    let reviewId: number;

    beforeAll(async () => {
        // Create test user
        const user = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                phone: '01700000201',
                email: 'reviewuser@test.com',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        userId = user.id;

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                firstName: 'Admin',
                lastName: 'User',
                phone: '01700000202',
                email: 'reviewadmin@test.com',
                passwordHash: 'hashed_password',
                role: users_role.ADMIN,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
                },
        });
        adminId = admin.id;

        // Create another user for ownership tests
        const otherUser = await prisma.user.create({
            data: {
                firstName: 'Other',
                lastName: 'User',
                phone: '01700000203',
                email: 'otherreviewuser@test.com',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        otherUserId = otherUser.id;

        // Generate tokens
        userToken = generateAccessToken({
            id: user.id,
            role: user.role,
            cityCorporationCode: user.cityCorporationCode,
            zoneId: user.zoneId,
            wardId: user.wardId,
        });

        adminToken = generateAccessToken({
            id: admin.id,
            role: admin.role,
            cityCorporationCode: admin.cityCorporationCode,
            zoneId: admin.zoneId,
            wardId: admin.wardId,
        });

        // Create resolved complaint
        const resolvedComplaint = await prisma.complaint.create({
            data: {
                userId: user.id,
                title: 'Resolved Complaint',
                description: 'Test Description',
                category: 'WASTE_MANAGEMENT',
                subcategory: 'GARBAGE_NOT_COLLECTED',
                status: Complaint_status.RESOLVED,
                cityCorporationCode: 'DSCC',
                location: 'Test Location',
                resolutionNote: 'Issue resolved',
                resolutionImages: 'https://example.com/image1.jpg',
            },
        });
        resolvedComplaintId = resolvedComplaint.id;

        // Create pending complaint
        const pendingComplaint = await prisma.complaint.create({
            data: {
                userId: user.id,
                title: 'Pending Complaint',
                description: 'Test Description',
                category: 'WASTE_MANAGEMENT',
                subcategory: 'GARBAGE_NOT_COLLECTED',
                status: Complaint_status.PENDING,
                cityCorporationCode: 'DSCC',
                location: 'Test Location',
            },
        });
        pendingComplaintId = pendingComplaint.id;

        // Create a test review
        const review = await prisma.review.create({
            data: {
                complaintId: resolvedComplaintId,
                userId: user.id,
                rating: 5,
                comment: 'Great service!',
            },
        });
        reviewId = review.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.review.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
        await prisma.complaint.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
        await prisma.user.deleteMany({
            where: {
                phone: { in: ['01700000201', '01700000202', '01700000203'] },
            },
        });
        await prisma.$disconnect();
    });

    describe('POST /api/complaints/:complaintId/review', () => {
        it('should submit a review for resolved complaint', async () => {
            // Create another resolved complaint for this test
            const complaint = await prisma.complaint.create({
                data: {
                    userId: userId,
                    title: 'Another Resolved Complaint',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.RESOLVED,
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
            });

            const response = await request(app)
                .post(`/api/complaints/${complaint.id}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 4,
                    comment: 'Good service',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.review).toHaveProperty('id');
            expect(response.body.data.review.rating).toBe(4);
            expect(response.body.data.review.comment).toBe('Good service');
            expect(response.body.data.review.complaintId).toBe(complaint.id);
            expect(response.body.data.review.userId).toBe(userId);

            // Clean up
            await prisma.review.delete({ where: { id: response.body.data.review.id } });
            await prisma.complaint.delete({ where: { id: complaint.id } });
        });

        it('should validate rating range (1-5)', async () => {
            await request(app)
                .post(`/api/complaints/${resolvedComplaintId}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 6, // Invalid
                    comment: 'Test',
                })
                .expect(400);

            await request(app)
                .post(`/api/complaints/${resolvedComplaintId}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 0, // Invalid
                    comment: 'Test',
                })
                .expect(400);
        });

        it('should validate comment length (max 300 chars)', async () => {
            const longComment = 'a'.repeat(301);

            await request(app)
                .post(`/api/complaints/${resolvedComplaintId}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 5,
                    comment: longComment,
                })
                .expect(400);
        });

        it('should allow review without comment', async () => {
            // Create another resolved complaint
            const complaint = await prisma.complaint.create({
                data: {
                    userId: userId,
                    title: 'Complaint Without Comment Review',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.RESOLVED,
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
            });

            const response = await request(app)
                .post(`/api/complaints/${complaint.id}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 3,
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.review.comment).toBeNull();

            // Clean up
            await prisma.review.delete({ where: { id: response.body.data.review.id } });
            await prisma.complaint.delete({ where: { id: complaint.id } });
        });

        it('should prevent duplicate reviews', async () => {
            await request(app)
                .post(`/api/complaints/${resolvedComplaintId}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 4,
                    comment: 'Duplicate attempt',
                })
                .expect(409);
        });

        it('should prevent review on non-resolved complaint', async () => {
            await request(app)
                .post(`/api/complaints/${pendingComplaintId}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 5,
                    comment: 'Should fail',
                })
                .expect(400);
        });

        it('should prevent review on other users complaint', async () => {
            // Create complaint for other user
            const otherComplaint = await prisma.complaint.create({
                data: {
                    userId: otherUserId,
                    title: 'Other User Complaint',
                    description: 'Test',
                    category: 'WASTE_MANAGEMENT',
                    subcategory: 'GARBAGE_NOT_COLLECTED',
                    status: Complaint_status.RESOLVED,
                    cityCorporationCode: 'DSCC',
                    location: 'Test Location',
                },
            });

            await request(app)
                .post(`/api/complaints/${otherComplaint.id}/review`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 5,
                    comment: 'Should fail',
                })
                .expect(403);

            // Clean up
            await prisma.complaint.delete({ where: { id: otherComplaint.id } });
        });

        it('should require authentication', async () => {
            await request(app)
                .post(`/api/complaints/${resolvedComplaintId}/review`)
                .send({
                    rating: 5,
                    comment: 'Test',
                })
                .expect(401);
        });

        it('should return 404 for non-existent complaint', async () => {
            await request(app)
                .post('/api/complaints/999999/review')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 5,
                    comment: 'Test',
                })
                .expect(404);
        });
    });

    describe('GET /api/complaints/:complaintId/reviews', () => {
        it('should return all reviews for a complaint', async () => {
            const response = await request(app)
                .get(`/api/complaints/${resolvedComplaintId}/reviews`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.reviews)).toBe(true);
            expect(response.body.data.reviews.length).toBeGreaterThan(0);
            expect(response.body.data.reviews[0]).toHaveProperty('rating');
            expect(response.body.data.reviews[0]).toHaveProperty('comment');
            expect(response.body.data.reviews[0]).toHaveProperty('user');
        });

        it('should not require authentication (public endpoint)', async () => {
            const response = await request(app)
                .get(`/api/complaints/${resolvedComplaintId}/reviews`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return empty array for complaint with no reviews', async () => {
            const response = await request(app)
                .get(`/api/complaints/${pendingComplaintId}/reviews`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews).toEqual([]);
        });

        it('should return 404 for non-existent complaint', async () => {
            await request(app)
                .get('/api/complaints/999999/reviews')
                .expect(404);
        });

        it('should include user information in reviews', async () => {
            const response = await request(app)
                .get(`/api/complaints/${resolvedComplaintId}/reviews`)
                .expect(200);

            const review = response.body.data.reviews[0];
            expect(review.user).toHaveProperty('firstName');
            expect(review.user).toHaveProperty('lastName');
            expect(review.user).not.toHaveProperty('passwordHash');
            expect(review.user).not.toHaveProperty('phone');
        });
    });

    describe('GET /api/admin/complaints/analytics/reviews', () => {
        it('should return review analytics for admin', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('averageRating');
            expect(response.body.data).toHaveProperty('totalReviews');
            expect(response.body.data).toHaveProperty('reviewPercentage');
            expect(response.body.data).toHaveProperty('ratingDistribution');
            expect(response.body.data).toHaveProperty('recentReviews');
        });

        it('should require admin authentication', async () => {
            await request(app)
                .get('/api/admin/complaints/analytics/reviews')
                .expect(401);
        });

        it('should prevent non-admin access', async () => {
            await request(app)
                .get('/api/admin/complaints/analytics/reviews')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should support city corporation filter', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews?cityCorporationCode=DSCC')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support zone filter', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews?zoneId=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support ward filter', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews?wardId=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should support date range filter', async () => {
            const startDate = new Date('2024-01-01').toISOString();
            const endDate = new Date().toISOString();

            const response = await request(app)
                .get(`/api/admin/complaints/analytics/reviews?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return correct rating distribution', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const distribution = response.body.data.ratingDistribution;
            expect(distribution).toHaveProperty('1');
            expect(distribution).toHaveProperty('2');
            expect(distribution).toHaveProperty('3');
            expect(distribution).toHaveProperty('4');
            expect(distribution).toHaveProperty('5');
        });

        it('should include recent reviews with complaint and user info', async () => {
            const response = await request(app)
                .get('/api/admin/complaints/analytics/reviews')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            if (response.body.data.recentReviews.length > 0) {
                const review = response.body.data.recentReviews[0];
                expect(review).toHaveProperty('complaint');
                expect(review).toHaveProperty('user');
                expect(review.complaint).toHaveProperty('title');
                expect(review.user).toHaveProperty('firstName');
            }
        });
    });
});
