/**
 * Dual Chat System - Integration Tests
 * 
 * Tests the complete end-to-end flow of both chat systems:
 * - Live Chat (user-to-admin general messaging)
 * - Complaint Chat (complaint-specific messaging)
 * 
 * Verifies:
 * 1. Complete separation between chat types
 * 2. Location-based routing
 * 3. Access control
 * 4. Message flow (send/receive)
 */

import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/utils/prisma';
import { signAccessToken } from '../../src/utils/jwt';

describe('Dual Chat System - Integration Tests', () => {
    let citizenToken: string;
    let citizenId: number;
    let wardAdminToken: string;
    let wardAdminId: number;
    let zoneAdminToken: string;
    let zoneAdminId: number;
    let superAdminToken: string;
    let superAdminId: number;
    let complaintId: number;
    let wardId: number;
    let zoneId: number;
    let cityCorporationCode: string;

    beforeAll(async () => {
        // Clean up test data
        await prisma.chatMessage.deleteMany({});
        await prisma.complaintChatMessage.deleteMany({});
        await prisma.complaint.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'citizen@test.com',
                        'wardadmin@test.com',
                        'zoneadmin@test.com',
                        'superadmin@test.com',
                    ],
                },
            },
        });

        // Create test city corporation, zone, and ward
        cityCorporationCode = 'DSCC';
        zoneId = 1;
        wardId = 1;

        // Create test citizen
        const citizen = await prisma.user.create({
            data: {
                email: 'citizen@test.com',
                phone: '01712345678',
                passwordHash: 'hashedpassword',
                firstName: 'Test',
                lastName: 'Citizen',
                role: 'CUSTOMER',
                wardId: wardId,
                zoneId: zoneId,
                cityCorporationCode: cityCorporationCode,
                emailVerified: true,
                phoneVerified: true,
                status: 'ACTIVE',
            },
        });
        citizenId = citizen.id;
        citizenToken = signAccessToken({ id: citizen.id, sub: citizen.id, role: citizen.role });

        // Create test ward admin
        const wardAdmin = await prisma.user.create({
            data: {
                email: 'wardadmin@test.com',
                phone: '01712345679',
                passwordHash: 'hashedpassword',
                firstName: 'Ward',
                lastName: 'Admin',
                role: 'ADMIN',
                wardId: wardId,
                zoneId: zoneId,
                cityCorporationCode: cityCorporationCode,
                emailVerified: true,
                phoneVerified: true,
                status: 'ACTIVE',
            },
        });
        wardAdminId = wardAdmin.id;
        wardAdminToken = signAccessToken({ id: wardAdmin.id, sub: wardAdmin.id, role: wardAdmin.role });

        // Create test zone admin
        const zoneAdmin = await prisma.user.create({
            data: {
                email: 'zoneadmin@test.com',
                phone: '01712345680',
                passwordHash: 'hashedpassword',
                firstName: 'Zone',
                lastName: 'Admin',
                role: 'SUPER_ADMIN',
                zoneId: zoneId,
                cityCorporationCode: cityCorporationCode,
                emailVerified: true,
                phoneVerified: true,
                status: 'ACTIVE',
            },
        });
        zoneAdminId = zoneAdmin.id;
        zoneAdminToken = signAccessToken({ id: zoneAdmin.id, sub: zoneAdmin.id, role: zoneAdmin.role });

        // Create test super admin
        const superAdmin = await prisma.user.create({
            data: {
                email: 'superadmin@test.com',
                phone: '01712345681',
                passwordHash: 'hashedpassword',
                firstName: 'Super',
                lastName: 'Admin',
                role: 'MASTER_ADMIN',
                emailVerified: true,
                phoneVerified: true,
                status: 'ACTIVE',
            },
        });
        superAdminId = superAdmin.id;
        superAdminToken = signAccessToken({ id: superAdmin.id, sub: superAdmin.id, role: superAdmin.role });

        // Create test complaint
        const complaint = await prisma.complaint.create({
            data: {
                userId: citizenId,
                title: 'Test complaint',
                category: 'WASTE_MANAGEMENT',
                description: 'Test complaint',
                location: 'Test location',
                wardId: wardId,
                zoneId: zoneId,
                cityCorporationCode: cityCorporationCode,
                status: 'PENDING',
            },
        });
        complaintId = complaint.id;
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.chatMessage.deleteMany({});
        await prisma.complaintChatMessage.deleteMany({});
        await prisma.complaint.deleteMany({});
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: [
                        'citizen@test.com',
                        'wardadmin@test.com',
                        'zoneadmin@test.com',
                        'superadmin@test.com',
                    ],
                },
            },
        });
        await prisma.$disconnect();
    });

    describe('1. Live Chat Flow', () => {
        let liveChatMessageId: number;

        it('1.1 User sends live chat message', async () => {
            const response = await request(app)
                .post('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    message: 'Hello, I need help with my area',
                })
                .expect(201);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('message');
            expect(response.body.data.message.content).toBe('Hello, I need help with my area');
            expect(response.body.data.message.senderId).toBe(citizenId);
            expect(response.body.data.message.senderType).toBe('CITIZEN');

            liveChatMessageId = response.body.data.message.id;
        });

        it('1.2 Admin receives live chat message', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('conversations');
            expect(response.body.data.conversations.length).toBeGreaterThan(0);

            const conversation = response.body.data.conversations.find(
                (c: any) => c.user.id === citizenId
            );
            expect(conversation).toBeDefined();
            expect(conversation.unreadCount).toBeGreaterThan(0);
        });

        it('1.3 Admin replies to live chat', async () => {
            const response = await request(app)
                .post(`/api/admin/live-chat/${citizenId}`)
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .send({
                    message: 'Hello! How can I help you?',
                })
                .expect(201);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.message.content).toBe('Hello! How can I help you?');
            expect(response.body.data.message.senderId).toBe(wardAdminId);
            expect(response.body.data.message.receiverId).toBe(citizenId);
            expect(response.body.data.message.senderType).toBe('ADMIN');
        });

        it('1.4 User receives admin reply', async () => {
            const response = await request(app)
                .get('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.messages.length).toBeGreaterThanOrEqual(2);

            const adminMessage = response.body.data.messages.find(
                (m: any) => m.senderType === 'ADMIN'
            );
            expect(adminMessage).toBeDefined();
            expect(adminMessage.content).toBe('Hello! How can I help you?');
        });

        it('1.5 User marks messages as read', async () => {
            const response = await request(app)
                .patch('/api/live-chat/read')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.updated).toBeGreaterThan(0);
        });
    });

    describe('2. Complaint Chat Flow', () => {
        let complaintChatMessageId: number;

        it('2.1 User sends complaint chat message', async () => {
            const response = await request(app)
                .post(`/api/complaints/${complaintId}/chat`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    message: 'When will this complaint be resolved?',
                })
                .expect(201);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.message.complaintId).toBe(complaintId);
            expect(response.body.data.message.message).toBe('When will this complaint be resolved?');
            expect(response.body.data.message.senderId).toBe(citizenId);
            expect(response.body.data.message.senderType).toBe('CITIZEN');

            complaintChatMessageId = response.body.data.message.id;
        });

        it('2.2 Admin receives complaint chat message', async () => {
            const response = await request(app)
                .get('/api/admin/chat')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.conversations.length).toBeGreaterThan(0);

            const conversation = response.body.data.conversations.find(
                (c: any) => c.complaint.id === complaintId
            );
            expect(conversation).toBeDefined();
            expect(conversation.unreadCount).toBeGreaterThan(0);
        });

        it('2.3 Admin replies to complaint chat', async () => {
            const response = await request(app)
                .post(`/api/admin/chat/${complaintId}`)
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .send({
                    message: 'We are working on it. It will be resolved soon.',
                })
                .expect(201);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.message.message).toBe('We are working on it. It will be resolved soon.');
            expect(response.body.data.message.complaintId).toBe(complaintId);
            expect(response.body.data.message.senderId).toBe(wardAdminId);
            expect(response.body.data.message.senderType).toBe('ADMIN');
        });

        it('2.4 User receives complaint chat reply', async () => {
            const response = await request(app)
                .get(`/api/complaints/${complaintId}/chat`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data.messages.length).toBeGreaterThanOrEqual(2);

            const adminMessage = response.body.data.messages.find(
                (m: any) => m.senderType === 'ADMIN'
            );
            expect(adminMessage).toBeDefined();
            expect(adminMessage.message).toBe('We are working on it. It will be resolved soon.');
        });
    });

    describe('3. Chat Isolation', () => {
        it('3.1 Live chat messages do not appear in complaint chat', async () => {
            const response = await request(app)
                .get(`/api/complaints/${complaintId}/chat`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');

            // Check that no live chat messages appear
            const liveChatMessage = response.body.data.messages.find(
                (m: any) => m.message === 'Hello, I need help with my area'
            );
            expect(liveChatMessage).toBeUndefined();
        });

        it('3.2 Complaint chat messages do not appear in live chat', async () => {
            const response = await request(app)
                .get('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');

            // Check that no complaint chat messages appear
            const complaintChatMessage = response.body.data.messages.find(
                (m: any) => m.content === 'When will this complaint be resolved?'
            );
            expect(complaintChatMessage).toBeUndefined();
        });

        it('3.3 Admin sees separate complaint and live chat lists', async () => {
            const complaintChatsResponse = await request(app)
                .get('/api/admin/chat')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            const liveChatsResponse = await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(complaintChatsResponse.body.data.conversations).toBeDefined();
            expect(liveChatsResponse.body.data.conversations).toBeDefined();

            // Verify they contain different data
            const complaintConv = complaintChatsResponse.body.data.conversations[0];
            const liveConv = liveChatsResponse.body.data.conversations[0];

            expect(complaintConv).toHaveProperty('complaint');
            expect(liveConv).toHaveProperty('user');
            expect(liveConv).not.toHaveProperty('complaint');
        });
    });

    describe('4. Location-Based Routing', () => {
        let otherWardCitizenId: number;
        let otherWardCitizenToken: string;

        beforeAll(async () => {
            // Create citizen in different ward
            const otherWardCitizen = await prisma.user.create({
                data: {
                    email: 'otherward@test.com',
                    phone: '01712345682',
                    passwordHash: 'hashedpassword',
                    firstName: 'Other',
                    lastName: 'Ward',
                    role: 'CUSTOMER',
                    wardId: 999, // Different ward
                    zoneId: 999,
                    cityCorporationCode: cityCorporationCode,
                    emailVerified: true,
                    phoneVerified: true,
                    status: 'ACTIVE',
                },
            });
            otherWardCitizenId = otherWardCitizen.id;
            otherWardCitizenToken = signAccessToken({ id: otherWardCitizen.id, sub: otherWardCitizen.id, role: otherWardCitizen.role });

            // Send a live chat message from other ward citizen
            await request(app)
                .post('/api/live-chat')
                .set('Authorization', `Bearer ${otherWardCitizenToken}`)
                .send({
                    message: 'Message from other ward',
                });
        });

        afterAll(async () => {
            await prisma.chatMessage.deleteMany({
                where: { senderId: otherWardCitizenId },
            });
            await prisma.user.delete({
                where: { id: otherWardCitizenId },
            });
        });

        it('4.1 Ward admin only sees messages from their ward', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();

            // Should see citizen from same ward
            const sameWardConv = response.body.data.conversations.find(
                (c: any) => c.user.id === citizenId
            );
            expect(sameWardConv).toBeDefined();

            // Should NOT see citizen from different ward
            const otherWardConv = response.body.data.conversations.find(
                (c: any) => c.user.id === otherWardCitizenId
            );
            expect(otherWardConv).toBeUndefined();
        });

        it('4.2 Zone admin sees messages from all wards in their zone', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${zoneAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();

            // Should see citizen from same zone
            const sameZoneConv = response.body.data.conversations.find(
                (c: any) => c.user.id === citizenId
            );
            expect(sameZoneConv).toBeDefined();
        });

        it('4.3 Super admin sees all messages', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();
            expect(response.body.data.conversations.length).toBeGreaterThanOrEqual(2);

            // Should see both citizens
            const conv1 = response.body.data.conversations.find(
                (c: any) => c.user.id === citizenId
            );
            const conv2 = response.body.data.conversations.find(
                (c: any) => c.user.id === otherWardCitizenId
            );

            expect(conv1).toBeDefined();
            expect(conv2).toBeDefined();
        });
    });

    describe('5. Access Control', () => {
        it('5.1 Citizen cannot access admin endpoints', async () => {
            await request(app)
                .get('/api/admin/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(403);
        });

        it('5.2 Citizen cannot access other users complaint chat', async () => {
            // Create complaint for another user
            const otherComplaint = await prisma.complaint.create({
                data: {
                    userId: wardAdminId,
                    title: 'Other user complaint',
                    category: 'ROAD_MAINTENANCE',
                    description: 'Other user complaint',
                    location: 'Other location',
                    wardId: wardId,
                    zoneId: zoneId,
                    cityCorporationCode: cityCorporationCode,
                    status: 'PENDING',
                },
            });

            await request(app)
                .get(`/api/complaints/${otherComplaint.id}/chat`)
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(403);

            // Clean up
            await prisma.complaint.delete({
                where: { id: otherComplaint.id },
            });
        });

        it('5.3 Ward admin cannot access messages from other wards', async () => {
            // Try to access other ward citizen's messages
            const otherWardCitizen = await prisma.user.findFirst({
                where: {
                    email: 'otherward@test.com',
                },
            });

            if (otherWardCitizen) {
                await request(app)
                    .get(`/api/admin/live-chat/${otherWardCitizen.id}`)
                    .set('Authorization', `Bearer ${wardAdminToken}`)
                    .expect(403);
            }
        });

        it('5.4 Admin can only send messages to users in their jurisdiction', async () => {
            const otherWardCitizen = await prisma.user.findFirst({
                where: {
                    email: 'otherward@test.com',
                },
            });

            if (otherWardCitizen) {
                await request(app)
                    .post(`/api/admin/live-chat/${otherWardCitizen.id}`)
                    .set('Authorization', `Bearer ${wardAdminToken}`)
                    .send({
                        message: 'Unauthorized message',
                    })
                    .expect(403);
            }
        });
    });

    describe('6. Statistics and Analytics', () => {
        it('6.1 Admin can get live chat statistics', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat/statistics')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('totalConversations');
            expect(response.body.data).toHaveProperty('unreadMessages');
            expect(response.body.data.totalConversations).toBeGreaterThan(0);
        });

        it('6.2 Statistics reflect correct ward/zone data', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat/statistics')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            // Ward admin should only see stats for their ward
            expect(response.body.data.totalConversations).toBeGreaterThan(0);
        });
    });

    describe('7. Message Features', () => {
        it('7.1 User can send message with image URL', async () => {
            const response = await request(app)
                .post('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    message: 'Check this image',
                    imageUrl: 'https://example.com/image.jpg',
                })
                .expect(201);

            expect(response.body.data.message.fileUrl).toBe('https://example.com/image.jpg');
        });

        it('7.2 User can send message with voice URL', async () => {
            const response = await request(app)
                .post('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    message: 'Voice message',
                    voiceUrl: 'https://example.com/voice.mp3',
                })
                .expect(201);

            expect(response.body.data.message.voiceUrl).toBe('https://example.com/voice.mp3');
        });

        it('7.3 Messages are ordered by creation time', async () => {
            const response = await request(app)
                .get('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body.data.messages).toBeDefined();
            expect(response.body.data.messages.length).toBeGreaterThan(1);

            // Check that messages are ordered (oldest first or newest first)
            const messages = response.body.data.messages;
            for (let i = 1; i < messages.length; i++) {
                const prevDate = new Date(messages[i - 1].createdAt);
                const currDate = new Date(messages[i].createdAt);
                expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
            }
        });
    });

    describe('8. Error Handling', () => {
        it('8.1 Returns 401 for unauthenticated requests', async () => {
            await request(app)
                .get('/api/live-chat')
                .expect(401);
        });

        it('8.2 Returns 400 for invalid message data', async () => {
            await request(app)
                .post('/api/live-chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .send({
                    // Missing message field
                })
                .expect(400);
        });

        it('8.3 Returns 404 for non-existent complaint chat', async () => {
            await request(app)
                .get('/api/complaints/999999/chat')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(404);
        });

        it('8.4 Returns 404 for non-existent user in admin live chat', async () => {
            await request(app)
                .get('/api/admin/live-chat/999999')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(404);
        });
    });

    describe('9. Pagination', () => {
        it('9.1 Live chat supports pagination', async () => {
            const response = await request(app)
                .get('/api/live-chat?page=1&limit=2')
                .set('Authorization', `Bearer ${citizenToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data.pagination).toHaveProperty('page');
            expect(response.body.data.pagination).toHaveProperty('limit');
            expect(response.body.data.pagination).toHaveProperty('total');
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(2);
        });

        it('9.2 Admin live chat conversations support pagination', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat?page=1&limit=5')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
        });
    });

    describe('10. Filtering', () => {
        it('10.1 Admin can filter live chats by ward', async () => {
            const response = await request(app)
                .get(`/api/admin/live-chat?wardId=${wardId}`)
                .set('Authorization', `Bearer ${zoneAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();

            // All conversations should be from the specified ward
            response.body.data.conversations.forEach((conv: any) => {
                expect(conv.user.wardId).toBe(wardId);
            });
        });

        it('10.2 Admin can filter live chats by zone', async () => {
            const response = await request(app)
                .get(`/api/admin/live-chat?zoneId=${zoneId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();

            // All conversations should be from the specified zone
            response.body.data.conversations.forEach((conv: any) => {
                expect(conv.user.zoneId).toBe(zoneId);
            });
        });

        it('10.3 Admin can filter by unread messages only', async () => {
            const response = await request(app)
                .get('/api/admin/live-chat?unreadOnly=true')
                .set('Authorization', `Bearer ${wardAdminToken}`)
                .expect(200);

            expect(response.body.data.conversations).toBeDefined();

            // All conversations should have unread messages
            response.body.data.conversations.forEach((conv: any) => {
                expect(conv.unreadCount).toBeGreaterThan(0);
            });
        });
    });
});
