/**
 * Integration Tests: Bot Analytics
 * 
 * Tests the bot analytics functionality including:
 * - Analytics data retrieval
 * - Date filtering
 * - Chat type filtering
 * - Calculation accuracy
 * - Permission checks
 */

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { ChatType, users_role } from '@prisma/client';
import { signAccessToken } from '../../src/utils/jwt';

describe('Bot Analytics Integration Tests', () => {
    let masterAdminToken: string;
    let masterAdmin: any;
    let testUser: any;

    beforeAll(async () => {
        // Clean up test data
        await prisma.botMessageAnalytics.deleteMany({});
        await prisma.botConversationState.deleteMany({});
        await prisma.botMessageConfig.deleteMany({});
        await prisma.botTriggerRule.deleteMany({});

        // Create master admin
        masterAdmin = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'Master Admin',
                email: 'test-master-analytics@test.com',
                passwordHash: 'hashed_password',
                phone: '+8801700000099',
                role: users_role.MASTER_ADMIN,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        masterAdminToken = signAccessToken({
            id: masterAdmin.id,
            sub: masterAdmin.id,
            email: masterAdmin.email || undefined,
            role: masterAdmin.role
        });

        // Create test user
        testUser = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User Analytics',
                email: 'test-user-analytics@test.com',
                passwordHash: 'hashed_password',
                phone: '+8801700000098',
                role: users_role.CUSTOMER,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        // Create bot trigger rules
        await prisma.botTriggerRule.create({
            data: {
                chatType: ChatType.LIVE_CHAT,
                isEnabled: true,
                reactivationThreshold: 3,
                resetStepsOnReactivate: false
            }
        });

        await prisma.botTriggerRule.create({
            data: {
                chatType: ChatType.COMPLAINT_CHAT,
                isEnabled: true,
                reactivationThreshold: 3,
                resetStepsOnReactivate: false
            }
        });

        // Create bot messages
        await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'live_chat_step_1',
                    content: 'Welcome to Live Chat',
                    contentBn: 'লাইভ চ্যাটে স্বাগতম',
                    stepNumber: 1,
                    displayOrder: 1,
                    isActive: true
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'live_chat_step_2',
                    content: 'How can we help?',
                    contentBn: 'আমরা কিভাবে সাহায্য করতে পারি?',
                    stepNumber: 2,
                    displayOrder: 2,
                    isActive: true
                },
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'complaint_chat_step_1',
                    content: 'Your complaint is received',
                    contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে',
                    stepNumber: 1,
                    displayOrder: 1,
                    isActive: true
                }
            ]
        });
    });

    afterAll(async () => {
        // Clean up
        await prisma.botMessageAnalytics.deleteMany({});
        await prisma.botConversationState.deleteMany({});
        await prisma.botMessageConfig.deleteMany({});
        await prisma.botTriggerRule.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: ['test-master-analytics@test.com', 'test-user-analytics@test.com']
                }
            }
        });
        await prisma.$disconnect();
    });

    describe('GET /api/admin/bot-messages/analytics', () => {
        beforeEach(async () => {
            // Clean analytics data before each test
            await prisma.botMessageAnalytics.deleteMany({});
        });

        it('should return empty analytics when no data exists', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.totalTriggers).toBe(0);
            expect(response.body.data.adminReplyRate).toBe(0);
            expect(response.body.data.avgResponseTime).toBe(0);
            expect(response.body.data.stepBreakdown).toEqual([]);
        });

        it('should return analytics data for all chat types', async () => {
            // Create test analytics data
            const today = new Date();
            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 80,
                        avgResponseTime: 300,
                        date: today
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_2',
                        stepNumber: 2,
                        triggerCount: 50,
                        adminReplyCount: 40,
                        avgResponseTime: 400,
                        date: today
                    },
                    {
                        chatType: ChatType.COMPLAINT_CHAT,
                        messageKey: 'complaint_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 75,
                        adminReplyCount: 60,
                        avgResponseTime: 350,
                        date: today
                    }
                ]
            });

            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalTriggers).toBe(225); // 100 + 50 + 75
            expect(response.body.data.adminReplyRate).toBeCloseTo(0.8, 2); // 180/225
            expect(response.body.data.avgResponseTime).toBeCloseTo(350, 0); // (300+400+350)/3
            // Step breakdown merges same step numbers across chat types
            // Step 1: 100 (LIVE_CHAT) + 75 (COMPLAINT_CHAT) = 175 triggers
            // Step 2: 50 (LIVE_CHAT) = 50 triggers
            expect(response.body.data.stepBreakdown).toHaveLength(2);

            const step1 = response.body.data.stepBreakdown.find((s: any) => s.step === 1);
            expect(step1.triggers).toBe(175); // 100 + 75
            expect(step1.replies).toBe(140); // 80 + 60
        });

        it('should filter analytics by chat type', async () => {
            // Create test analytics data
            const today = new Date();
            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 80,
                        avgResponseTime: 300,
                        date: today
                    },
                    {
                        chatType: ChatType.COMPLAINT_CHAT,
                        messageKey: 'complaint_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 75,
                        adminReplyCount: 60,
                        avgResponseTime: 350,
                        date: today
                    }
                ]
            });

            // Test LIVE_CHAT filter
            const liveChatResponse = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'LIVE_CHAT' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(liveChatResponse.body.success).toBe(true);
            expect(liveChatResponse.body.data.totalTriggers).toBe(100);
            expect(liveChatResponse.body.data.stepBreakdown).toHaveLength(1);
            expect(liveChatResponse.body.data.stepBreakdown[0].step).toBe(1);

            // Test COMPLAINT_CHAT filter
            const complaintChatResponse = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'COMPLAINT_CHAT' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(complaintChatResponse.body.success).toBe(true);
            expect(complaintChatResponse.body.data.totalTriggers).toBe(75);
            expect(complaintChatResponse.body.data.stepBreakdown).toHaveLength(1);
        });

        it('should filter analytics by date range', async () => {
            // Create test analytics data with different dates
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Start of today

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const twoDaysAgo = new Date(today);
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 80,
                        avgResponseTime: 300,
                        date: today
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 50,
                        adminReplyCount: 40,
                        avgResponseTime: 350,
                        date: yesterday
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 25,
                        adminReplyCount: 20,
                        avgResponseTime: 400,
                        date: twoDaysAgo
                    }
                ]
            });

            // Test with date range (yesterday to tomorrow to include today)
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({
                    startDate: yesterday.toISOString().split('T')[0],
                    endDate: tomorrow.toISOString().split('T')[0]
                })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalTriggers).toBe(150); // 100 + 50 (excludes twoDaysAgo)
        });

        it('should reject invalid chat type', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'INVALID_TYPE' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            // Validation middleware returns 'errors' array or 'message' field
            expect(response.body.errors || response.body.message).toBeDefined();
        });

        it('should require authentication', async () => {
            await request(app)
                .get('/api/admin/bot-messages/analytics')
                .expect(401);
        });

        it('should require MASTER_ADMIN role', async () => {
            // Create a regular admin
            const regularAdmin = await prisma.user.create({
                data: {
                    firstName: 'Regular',
                    lastName: 'Admin',
                    email: 'regular-admin-analytics@test.com',
                    passwordHash: 'hashed_password',
                    phone: '+8801700000097',
                    role: users_role.ADMIN,
                    emailVerified: true,
                    phoneVerified: true,
                    cityCorporationCode: 'DSCC'
                }
            });

            const regularAdminToken = signAccessToken({
                id: regularAdmin.id,
                sub: regularAdmin.id,
                email: regularAdmin.email || undefined,
                role: regularAdmin.role
            });

            await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${regularAdminToken}`)
                .expect(403);

            // Clean up
            await prisma.user.delete({
                where: { id: regularAdmin.id }
            });
        });

        it('should calculate reply rate correctly', async () => {
            // Create test data with known values
            const today = new Date();
            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 75, // 75% reply rate
                        avgResponseTime: 300,
                        date: today
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_2',
                        stepNumber: 2,
                        triggerCount: 100,
                        adminReplyCount: 85, // 85% reply rate
                        avgResponseTime: 400,
                        date: today
                    }
                ]
            });

            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'LIVE_CHAT' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Total: 200 triggers, 160 replies = 80% reply rate
            expect(response.body.data.totalTriggers).toBe(200);
            expect(response.body.data.adminReplyRate).toBeCloseTo(0.8, 2);
        });

        it('should calculate average response time correctly', async () => {
            // Create test data with known values
            const today = new Date();
            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 80,
                        avgResponseTime: 300, // 5 minutes
                        date: today
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_2',
                        stepNumber: 2,
                        triggerCount: 50,
                        adminReplyCount: 40,
                        avgResponseTime: 600, // 10 minutes
                        date: today
                    }
                ]
            });

            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'LIVE_CHAT' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Average: (300 + 600) / 2 = 450 seconds
            expect(response.body.data.avgResponseTime).toBeCloseTo(450, 0);
        });

        it('should return step breakdown in correct format', async () => {
            // Create test data
            const today = new Date();
            await prisma.botMessageAnalytics.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_1',
                        stepNumber: 1,
                        triggerCount: 100,
                        adminReplyCount: 80,
                        avgResponseTime: 300,
                        date: today
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'live_chat_step_2',
                        stepNumber: 2,
                        triggerCount: 50,
                        adminReplyCount: 40,
                        avgResponseTime: 400,
                        date: today
                    }
                ]
            });

            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .query({ chatType: 'LIVE_CHAT' })
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.stepBreakdown).toHaveLength(2);

            // Validate step 1
            const step1 = response.body.data.stepBreakdown.find((s: any) => s.step === 1);
            expect(step1).toBeDefined();
            expect(step1.triggers).toBe(100);
            expect(step1.replies).toBe(80);

            // Validate step 2
            const step2 = response.body.data.stepBreakdown.find((s: any) => s.step === 2);
            expect(step2).toBeDefined();
            expect(step2.triggers).toBe(50);
            expect(step2.replies).toBe(40);
        });
    });
});
