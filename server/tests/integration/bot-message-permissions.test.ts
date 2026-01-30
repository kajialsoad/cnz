/**
 * Bot Message Permission Restrictions Tests
 */

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { users_role } from '@prisma/client';
import { signAccessToken } from '../../src/utils/jwt';

describe('Bot Message Permission Restrictions', () => {
    let masterAdminToken: string;
    let superAdminToken: string;
    let adminToken: string;
    let customerToken: string;
    let testBotMessageId: number;

    beforeAll(async () => {
        const masterAdmin = await prisma.user.create({
            data: {
                firstName: 'Master',
                lastName: 'Admin',
                email: 'master-perm@test.com',
                phone: '+8801700000101',
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
                email: 'super-perm@test.com',
                phone: '+8801700000102',
                passwordHash: 'hashed_password',
                role: users_role.SUPER_ADMIN,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        const admin = await prisma.user.create({
            data: {
                firstName: 'Regular',
                lastName: 'Admin',
                email: 'admin-perm@test.com',
                phone: '+8801700000103',
                passwordHash: 'hashed_password',
                role: users_role.ADMIN,
                emailVerified: true,
                phoneVerified: true,
                cityCorporationCode: 'DSCC'
            }
        });

        const customer = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'Customer',
                email: 'customer-perm@test.com',
                phone: '+8801700000104',
                passwordHash: 'hashed_password',
                role: users_role.CUSTOMER,
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

        adminToken = signAccessToken({
            id: admin.id,
            sub: admin.id,
            role: admin.role,
            cityCorporationCode: admin.cityCorporationCode
        });

        customerToken = signAccessToken({
            id: customer.id,
            sub: customer.id,
            role: customer.role,
            cityCorporationCode: customer.cityCorporationCode
        });

        const botMessage = await prisma.botMessageConfig.create({
            data: {
                chatType: 'LIVE_CHAT',
                messageKey: 'perm_test_message_1',
                content: 'Permission test message',
                contentBn: 'অনুমতি পরীক্ষা বার্তা',
                stepNumber: 1,
                displayOrder: 1,
                isActive: true
            }
        });

        testBotMessageId = botMessage.id;

        await prisma.botTriggerRule.upsert({
            where: { chatType: 'LIVE_CHAT' },
            update: {},
            create: {
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            }
        });
    });

    afterAll(async () => {
        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'perm_test_'
                }
            }
        });
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'master-perm@test.com',
                        'super-perm@test.com',
                        'admin-perm@test.com',
                        'customer-perm@test.com'
                    ]
                }
            }
        });
        await prisma.$disconnect();
    });

    describe('GET /api/admin/bot-messages', () => {
        it('should allow MASTER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny CUSTOMER', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny unauthenticated requests', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
        });

        it('should deny invalid token', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
        });
    });

    describe('POST /api/admin/bot-messages', () => {
        it('should allow MASTER_ADMIN to create bot message', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'perm_test_message_2',
                    content: 'Test message',
                    contentBn: 'পরীক্ষা বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'perm_test_message_3',
                    content: 'Test message',
                    contentBn: 'পরীক্ষা বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            const response = await request(app)
                .post('/api/admin/bot-messages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'perm_test_message_4',
                    content: 'Test message',
                    contentBn: 'পরীক্ষা বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                })
                .expect(403);

            expect(response.body.success).toBe(false);
        });

        it('should deny unauthenticated requests', async () => {
            await request(app)
                .post('/api/admin/bot-messages')
                .send({
                    chatType: 'COMPLAINT_CHAT',
                    messageKey: 'perm_test_message_5',
                    content: 'Test message',
                    contentBn: 'পরীক্ষা বার্তা',
                    stepNumber: 1,
                    displayOrder: 1
                })
                .expect(401);
        });
    });

    describe('PUT /api/admin/bot-messages/:id', () => {
        it('should allow MASTER_ADMIN to update bot message', async () => {
            const response = await request(app)
                .put(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    content: 'Updated message',
                    contentBn: 'আপডেট করা বার্তা'
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.content).toBe('Updated message');
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .put(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    content: 'Updated message'
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            await request(app)
                .put(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    content: 'Updated message'
                })
                .expect(403);
        });

        it('should deny unauthenticated requests', async () => {
            await request(app)
                .put(`/api/admin/bot-messages/${testBotMessageId}`)
                .send({
                    content: 'Updated message'
                })
                .expect(401);
        });
    });

    describe('DELETE /api/admin/bot-messages/:id', () => {
        let messageToDelete: number;

        beforeAll(async () => {
            const message = await prisma.botMessageConfig.create({
                data: {
                    chatType: 'LIVE_CHAT',
                    messageKey: 'perm_test_delete_message',
                    content: 'Message to delete',
                    contentBn: 'মুছে ফেলার বার্তা',
                    stepNumber: 99,
                    displayOrder: 99,
                    isActive: true
                }
            });
            messageToDelete = message.id;
        });

        it('should allow MASTER_ADMIN to delete bot message', async () => {
            const response = await request(app)
                .delete(`/api/admin/bot-messages/${messageToDelete}`)
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .delete(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            await request(app)
                .delete(`/api/admin/bot-messages/${testBotMessageId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);
        });

        it('should deny unauthenticated requests', async () => {
            await request(app)
                .delete(`/api/admin/bot-messages/${testBotMessageId}`)
                .expect(401);
        });
    });

    describe('PUT /api/admin/bot-messages/rules/:chatType', () => {
        it('should allow MASTER_ADMIN to update trigger rules', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .send({
                    isEnabled: true,
                    reactivationThreshold: 3,
                    resetStepsOnReactivate: true
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reactivationThreshold).toBe(3);
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    isEnabled: false
                })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    isEnabled: false
                })
                .expect(403);
        });

        it('should deny unauthenticated requests', async () => {
            await request(app)
                .put('/api/admin/bot-messages/rules/LIVE_CHAT')
                .send({
                    isEnabled: false
                })
                .expect(401);
        });
    });

    describe('GET /api/admin/bot-messages/analytics', () => {
        it('should allow MASTER_ADMIN to view analytics', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${masterAdminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should deny SUPER_ADMIN', async () => {
            const response = await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTH_ROLE_NOT_AUTHORIZED');
        });

        it('should deny ADMIN', async () => {
            await request(app)
                .get('/api/admin/bot-messages/analytics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(403);
        });

        it('should deny unauthenticated requests', async () => {
            await request(app)
                .get('/api/admin/bot-messages/analytics')
                .expect(401);
        });
    });

    describe('Public Endpoint - GET /api/bot-messages/:chatType', () => {
        it('should allow unauthenticated access', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.messages).toBeDefined();
            expect(response.body.data.isEnabled).toBeDefined();
        });

        it('should allow CUSTOMER access', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .set('Authorization', `Bearer ${customerToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should allow ADMIN access', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should only return active messages', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            const messages = response.body.data.messages;
            expect(messages.every((m: any) => m.isActive === true)).toBe(true);
        });

        it('should reject invalid chat type', async () => {
            const response = await request(app)
                .get('/api/bot-messages/INVALID_TYPE')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CHAT_TYPE');
        });
    });
});
