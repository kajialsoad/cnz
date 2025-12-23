import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { generateAccessToken } from '../helpers/test-utils';
import { users_role, UserStatus, Complaint_status } from '@prisma/client';

describe('Notification API Routes', () => {
    let userToken: string;
    let userId: number;
    let otherUserId: number;
    let complaintId: number;
    let notificationId: number;

    beforeAll(async () => {
        // Create test user
        const user = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                phone: '01700000101',
                email: 'testuser@test.com',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        userId = user.id;

        // Create another user for ownership tests
        const otherUser = await prisma.user.create({
            data: {
                firstName: 'Other',
                lastName: 'User',
                phone: '01700000102',
                email: 'otheruser@test.com',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
                status: UserStatus.ACTIVE,
                cityCorporationCode: 'DSCC',
            },
        });
        otherUserId = otherUser.id;

        // Generate token
        userToken = generateAccessToken({
            id: user.id,
            role: user.role,
            cityCorporationCode: user.cityCorporationCode,
            zoneId: user.zoneId,
            wardId: user.wardId,
        });

        // Create a test complaint
        const complaint = await prisma.complaint.create({
            data: {
                userId: user.id,
                title: 'Test Complaint',
                description: 'Test Description',
                category: 'WASTE_MANAGEMENT',
                subcategory: 'GARBAGE_NOT_COLLECTED',
                status: Complaint_status.PENDING,
                cityCorporationCode: 'DSCC',
                location: 'Test Location',
            },
        });
        complaintId = complaint.id;

        // Create test notifications
        const notification = await prisma.notification.create({
            data: {
                userId: user.id,
                title: 'Test Notification',
                message: 'Your complaint has been updated',
                type: 'COMPLAINT_UPDATE',
                isRead: false,
                complaintId: complaint.id,
                statusChange: 'PENDING_TO_IN_PROGRESS',
            },
        });
        notificationId = notification.id;

        // Create additional notifications for pagination tests
        await prisma.notification.createMany({
            data: [
                {
                    userId: user.id,
                    title: 'Notification 2',
                    message: 'Test message 2',
                    type: 'COMPLAINT_UPDATE',
                    isRead: true,
                },
                {
                    userId: user.id,
                    title: 'Notification 3',
                    message: 'Test message 3',
                    type: 'COMPLAINT_UPDATE',
                    isRead: false,
                },
            ],
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.notification.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
        await prisma.complaint.deleteMany({
            where: { userId: { in: [userId, otherUserId] } },
        });
        await prisma.user.deleteMany({
            where: {
                phone: { in: ['01700000101', '01700000102'] },
            },
        });
        await prisma.$disconnect();
    });

    describe('GET /api/notifications', () => {
        it('should return user notifications with pagination', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('notifications');
            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data).toHaveProperty('unreadCount');
            expect(Array.isArray(response.body.data.notifications)).toBe(true);
            expect(response.body.data.notifications.length).toBeGreaterThan(0);
        });

        it('should support pagination parameters', async () => {
            const response = await request(app)
                .get('/api/notifications?page=1&limit=2')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
            expect(response.body.data.notifications.length).toBeLessThanOrEqual(2);
        });

        it('should filter unread notifications only', async () => {
            const response = await request(app)
                .get('/api/notifications?unreadOnly=true')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.notifications.forEach((notification: any) => {
                expect(notification.isRead).toBe(false);
            });
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/notifications')
                .expect(401);
        });

        it('should include complaint and status change data', async () => {
            const response = await request(app)
                .get('/api/notifications')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            const notificationWithComplaint = response.body.data.notifications.find(
                (n: any) => n.complaintId === complaintId
            );
            expect(notificationWithComplaint).toBeDefined();
            expect(notificationWithComplaint.statusChange).toBe('PENDING_TO_IN_PROGRESS');
        });
    });

    describe('GET /api/notifications/unread-count', () => {
        it('should return unread notification count', async () => {
            const response = await request(app)
                .get('/api/notifications/unread-count')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('count');
            expect(typeof response.body.data.count).toBe('number');
            expect(response.body.data.count).toBeGreaterThan(0);
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/notifications/unread-count')
                .expect(401);
        });
    });

    describe('PATCH /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            const response = await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.notification.isRead).toBe(true);

            // Verify in database
            const notification = await prisma.notification.findUnique({
                where: { id: notificationId },
            });
            expect(notification?.isRead).toBe(true);
        });

        it('should require authentication', async () => {
            await request(app)
                .patch(`/api/notifications/${notificationId}/read`)
                .expect(401);
        });

        it('should return 404 for non-existent notification', async () => {
            await request(app)
                .patch('/api/notifications/999999/read')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });

        it('should prevent marking other users notifications', async () => {
            // Create notification for other user
            const otherNotification = await prisma.notification.create({
                data: {
                    userId: otherUserId,
                    title: 'Other User Notification',
                    message: 'Test message',
                    type: 'COMPLAINT_UPDATE',
                    isRead: false,
                },
            });

            await request(app)
                .patch(`/api/notifications/${otherNotification.id}/read`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            // Clean up
            await prisma.notification.delete({
                where: { id: otherNotification.id },
            });
        });
    });

    describe('PATCH /api/notifications/read-all', () => {
        it('should mark all user notifications as read', async () => {
            const response = await request(app)
                .patch('/api/notifications/read-all')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('updatedCount');
            expect(response.body.data.updatedCount).toBeGreaterThan(0);

            // Verify all notifications are read
            const unreadCount = await prisma.notification.count({
                where: {
                    userId: userId,
                    isRead: false,
                },
            });
            expect(unreadCount).toBe(0);
        });

        it('should require authentication', async () => {
            await request(app)
                .patch('/api/notifications/read-all')
                .expect(401);
        });

        it('should only affect current user notifications', async () => {
            // Create unread notification for other user
            await prisma.notification.create({
                data: {
                    userId: otherUserId,
                    title: 'Other User Notification',
                    message: 'Test message',
                    type: 'COMPLAINT_UPDATE',
                    isRead: false,
                },
            });

            await request(app)
                .patch('/api/notifications/read-all')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);

            // Verify other user still has unread notifications
            const otherUserUnreadCount = await prisma.notification.count({
                where: {
                    userId: otherUserId,
                    isRead: false,
                },
            });
            expect(otherUserUnreadCount).toBeGreaterThan(0);
        });
    });
});
