/**
 * Bot Message Routes Integration Tests
 * 
 * Tests for bot message admin API endpoints
 */

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { users_role, ChatType } from '@prisma/client';
import { signAccessToken } from '../../src/utils/jwt';

describe('Bot Message Routes', () => {
    let masterAdminToken: string;
    let superAdminToken: string;
    let testBotMessageId: number;

    beforeAll(async () => {
        // Create test users
        const masterAdmin = await prisma.user.create({
            data: {
                firstName: 'Master',
                lastName: 'Admin',
                email: 'master@test.com',
                phone: '+8801700000001',
                passwordHash: 'hashed_password',
                role: users_role.MASTER_ADMIN,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        const superAdmin = await prisma.user.create({
            data: {
                firstName: 'Super',
                lastName: 'Admin',
                email: 'super@test.com',
                phone: '+8801700000002',
                passwordHash: 'hashed_password',
                role: users_role.SUPER_ADMIN,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        masterAdminToken = signAccessToken({
            id: masterAdmin.id,
            sub: masterAdmin.id,
            role: masterAdmin.role,
            cityCorporationCode: masterAdmin.cityCorporationCode
        });

        superAdminToken = signAccessToken({
            id: superAdmin.id,
            sub: superAdmin.id,
            role: superAdmin.role,
            cityCorporationCode: superAdmin.cityCorporationCode
        });

        // Create test bot message
        const botMessage = await prisma.botMessageConfig.create({
            data: {
                chatType: 'LIVE_CHAT',
                messageKey: 'test_message_1',
                content: 'Test message in English',
                contentBn: 'পরীক্ষা বার্তা বাংলায়',
                stepNumber: 1,
                displayOrder: 1,
                isActive: true
            }
        });

        testBotMessageId = botMessage.id;

        // Create test trigger rules
        await prisma.botTriggerRule.create({
            data: {
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            }
        });
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'test_'
                }
            }
        });
        await prisma.botTriggerRule.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: ['master@test.com', 'super@test.com']
                }
            }
        });
        await prisma.$disconnect();
    });

    describe('GET /api/admin/bot-messages', () => {
        it('should get all bot messages for MASTER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('LIVE_CHAT');
            expect(response.body.data).toHaveProperty('COMPLAINT_CHAT');
        });

        it('should get bot messages filtered by chat type', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages?chatType=LIVE_CHAT')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('messages');
            expect(response.body.data).toHaveProperty('rules');
            expect(Array.isArray(response.body.data.messages)).toBe(true);
        });

        it('should reject request from SUPER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });

        it('should reject request without authentication', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages');

            expect(response.status).toBe(401);
        });

        it('should reject invalid chat type', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages?chatType=INVALID')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/admin/bot-messages', () => {
        it('should create a new bot message', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'test_message_2',
                    content: 'New test message',
                    contentBn: 'নতুন পরীক্ষা বার্তা',
                    stepNumber: 2,
                    displayOrder: 2
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.messageKey).toBe('test_message_2');
        });

        it('should reject duplicate message key', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'test_message_1', // Duplicate
                    content: 'Duplicate message',
                    contentBn: 'ডুপ্লিকেট বার্তা',
                    stepNumber: 3,
                    displayOrder: 3
                });

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should reject invalid input', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'INVALID_TYPE',
                    messageKey: 'test',
                    content: '',
                    contentBn: '',
                    stepNumber: -1
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject request from SUPER_ADMIN', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    chatType: 'LIVE_CHAT',
                    messageKey: 'test_message_3',
                    content: 'Test',
                    contentBn: 'পরীক্ষা',
                    stepNumber: 1
                });

            expect(response.status).toBe(403);
        });
    });

    describe('PUT /api/admin/bot-messages/:id', () => {
        it('should update a bot message', async () => {
            const response = await request(app)
                .put(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    content: 'Updated test message',
                    isActive: false
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.content).toBe('Updated test message');
            expect(response.body.data.isActive).toBe(false);
        });

        it('should reject invalid message ID', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/invalid')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    content: 'Updated'
                });

            expect(response.status).toBe(400);
        });

        it('should return 404 for non-existent message', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/999999')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    content: 'Updated'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/admin/bot-messages/:id', () => {
        it('should delete a bot message', async () => {
            // Create a message to delete
            const message = await prisma.botMessageConfig.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'test_message_to_delete',
                    content: 'To be deleted',
                    contentBn: 'মুছে ফেলা হবে',
                    stepNumber: 99,
                    displayOrder: 99
                }
            });

            const response = await request(app)
                .delete(`/api/admin/bot-messages/${message.id}`)
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Verify deletion
            const deleted = await prisma.botMessageConfig.findUnique({
                where: { id: message.id }
            });
            expect(deleted).toBeNull();
        });

        it('should return 404 for non-existent message', async () => {
            const response = await request(app)
                .delete('/api/admin/bot-messages/999999')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/admin/bot-messages/rules/:chatType', () => {
        it('should update trigger rules', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    isEnabled: false,
                    reactivationThreshold: 10,
                    resetStepsOnReactivate: true
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.isEnabled).toBe(false);
            expect(response.body.data.reactivationThreshold).toBe(10);
            expect(response.body.data.resetStepsOnReactivate).toBe(true);
        });

        it('should reject invalid chat type', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/rules/INVALID')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    isEnabled: true
                });

            expect(response.status).toBe(400);
        });

        it('should reject invalid threshold value', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    reactivationThreshold: -1
                });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/admin/bot-messages/analytics', () => {
        beforeAll(async () => {
            // Create test analytics data
            await prisma.botMessageAnalytics.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'test_message_1',
                    stepNumber: 1,
                    triggerCount: 10,
                    adminReplyCount: 8,
                    avgResponseTime: 300,
                    date: new Date()
                }
            });
        });

        afterAll(async () => {
            await prisma.botMessageAnalytics.deleteMany({});
        });

        it('should get bot analytics', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalTriggers');
            expect(response.body.data).toHaveProperty('adminReplyRate');
            expect(response.body.data).toHaveProperty('avgResponseTime');
            expect(response.body.data).toHaveProperty('stepBreakdown');
        });

        it('should filter analytics by chat type', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics?chatType=LIVE_CHAT')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should filter analytics by date range', async () => {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date();

            const response = await request(app)
                .get(`/api/admin/bot-messages/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject invalid date format', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics?startDate=invalid-date')
                .set('Authorization', `Bearer ${masterAdminToken}`);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/bot-messages/:chatType (Public)', () => {
        it('should get public bot messages without authentication', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('messages');
            expect(response.body.data).toHaveProperty('isEnabled');
            expect(Array.isArray(response.body.data.messages)).toBe(true);
        });

        it('should only return active bot messages', async () => {
            // Create an inactive message
            await prisma.botMessageConfig.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'test_inactive_message',
                    content: 'Inactive message',
                    contentBn: 'নিষ্ক্রিয় বার্তা',
                    stepNumber: 99,
                    displayOrder: 99,
                    isActive: false
                }
            });

            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            // Check that inactive messages are not returned
            const inactiveMessage = response.body.data.messages.find(
                (m: any) => m.messageKey === 'test_inactive_message'
            );
            expect(inactiveMessage).toBeUndefined();

            // Clean up
            await prisma.botMessageConfig.deleteMany({
                where: { messageKey: 'test_inactive_message' }
            });
        });

        it('should include cache headers', async () => {
            const response = await request(app)
                .get('/api/bot-messages/COMPLAINT_CHAT');

            expect(response.status).toBe(200);
            expect(response.headers['cache-control']).toBeDefined();
            expect(response.headers['cache-control']).toContain('public');
            expect(response.headers['cache-control']).toContain('max-age=300');
        });

        it('should reject invalid chat type', async () => {
            const response = await request(app)
                .get('/api/bot-messages/INVALID_TYPE');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should be rate limited', async () => {
            // Make multiple requests to trigger rate limit
            const requests = [];
            for (let i = 0; i < 105; i++) {
                requests.push(
                    request(app).get('/api/bot-messages/LIVE_CHAT')
                );
            }

            const responses = await Promise.all(requests);

            // At least one request should be rate limited (429)
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });

        it('should return isEnabled status from trigger rules', async () => {
            // Update trigger rules to disabled
            await prisma.botTriggerRule.upsert({
                where: { chatType: 'COMPLAINT_CHAT' },
                update: { isEnabled: false },
                create: {
                    chatType: 'COMPLAINT_CHAT',
                    isEnabled: false,
                    reactivationThreshold: 5,
                    resetStepsOnReactivate: false
                }
            });

            const response = await request(app)
                .get('/api/bot-messages/COMPLAINT_CHAT');

            expect(response.status).toBe(200);
            expect(response.body.data.isEnabled).toBe(false);

            // Reset to enabled
            await prisma.botTriggerRule.update({
                where: { chatType: 'COMPLAINT_CHAT' },
                data: { isEnabled: true }
            });
        });
    });
});
