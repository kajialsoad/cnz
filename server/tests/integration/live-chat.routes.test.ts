import request from 'supertest';
import express from 'express';
import liveChatService from '../../src/services/live-chat.service';
import { liveChatController } from '../../src/controllers/live-chat.controller';
import { adminLiveChatController } from '../../src/controllers/admin.live-chat.controller';
import { ChatMessageType, SenderType } from '@prisma/client';

// Mock the service
jest.mock('../../src/services/live-chat.service');

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = {
        sub: 1,
        role: 'CUSTOMER',
        email: 'user@example.com',
        phone: '01712345678',
    };
    next();
};

const mockAdminAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = {
        sub: 100,
        role: 'ADMIN',
        email: 'admin@example.com',
        phone: '01712345679',
    };
    next();
};

// Setup routes
app.get('/api/live-chat', mockAuthMiddleware, (req, res) =>
    liveChatController.getUserMessages(req as any, res)
);
app.post('/api/live-chat', mockAuthMiddleware, (req, res) =>
    liveChatController.sendMessage(req as any, res)
);
app.patch('/api/live-chat/read', mockAuthMiddleware, (req, res) =>
    liveChatController.markAsRead(req as any, res)
);
app.get('/api/live-chat/unread', mockAuthMiddleware, (req, res) =>
    liveChatController.getUnreadCount(req as any, res)
);

// Statistics route must come before parameterized routes
app.get('/api/admin/live-chat/statistics', mockAdminAuthMiddleware, (req, res) =>
    adminLiveChatController.getStatistics(req as any, res)
);

app.get('/api/admin/live-chat', mockAdminAuthMiddleware, (req, res) =>
    adminLiveChatController.getConversations(req as any, res)
);
app.get('/api/admin/live-chat/:userId', mockAdminAuthMiddleware, (req, res) =>
    adminLiveChatController.getUserMessages(req as any, res)
);
app.post('/api/admin/live-chat/:userId', mockAdminAuthMiddleware, (req, res) =>
    adminLiveChatController.sendMessage(req as any, res)
);
app.patch('/api/admin/live-chat/:userId/read', mockAdminAuthMiddleware, (req, res) =>
    adminLiveChatController.markAsRead(req as any, res)
);

describe('Live Chat Routes - User Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });


    describe('GET /api/live-chat', () => {
        it('should return user messages with admin info', async () => {
            const mockAdmin = {
                id: 100,
                firstName: 'Admin',
                lastName: 'User',
                avatar: null,
                role: 'ADMIN',
                designation: 'Ward Inspector',
                phone: '01712345679',
                ward: { id: 10, number: '10', wardNumber: '10' },
                zone: { id: 5, number: '5', name: 'Zone 5' },
            };

            const mockMessages = [
                {
                    id: 1,
                    content: 'Hello',
                    type: ChatMessageType.TEXT,
                    senderId: 1,
                    receiverId: 100,
                    senderType: SenderType.CITIZEN,
                    isRead: false,
                    createdAt: new Date(),
                },
            ];

            (liveChatService.getUserAdmin as jest.Mock).mockResolvedValue(mockAdmin);
            (liveChatService.getUserMessages as jest.Mock).mockResolvedValue({
                messages: mockMessages,
                total: 1,
                page: 1,
                limit: 50,
                hasMore: false,
            });

            const response = await request(app).get('/api/live-chat').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.messages).toHaveLength(1);
            expect(response.body.data.admin).toBeDefined();
            expect(response.body.data.admin.name).toBe('Admin User');
        });

        it('should handle pagination parameters', async () => {
            (liveChatService.getUserAdmin as jest.Mock).mockResolvedValue({ id: 100 });
            (liveChatService.getUserMessages as jest.Mock).mockResolvedValue({
                messages: [],
                total: 0,
                page: 2,
                limit: 20,
                hasMore: false,
            });

            const response = await request(app)
                .get('/api/live-chat')
                .query({ page: 2, limit: 20 })
                .expect(200);

            expect(liveChatService.getUserMessages).toHaveBeenCalledWith(1, {
                page: 2,
                limit: 20,
                adminId: 100,
            });
        });

        it('should return 500 on service error', async () => {
            (liveChatService.getUserAdmin as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const response = await request(app).get('/api/live-chat').expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Database error');
        });
    });

    describe('POST /api/live-chat', () => {
        it('should send a text message', async () => {
            const mockMessage = {
                id: 1,
                content: 'Hello Admin',
                type: ChatMessageType.TEXT,
                senderId: 1,
                receiverId: 100,
                senderType: SenderType.CITIZEN,
                isRead: false,
                createdAt: new Date(),
            };

            (liveChatService.sendUserMessage as jest.Mock).mockResolvedValue(mockMessage);

            const response = await request(app)
                .post('/api/live-chat')
                .send({ message: 'Hello Admin' })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.message.content).toBe('Hello Admin');
        });

        it('should reject empty message', async () => {
            const response = await request(app)
                .post('/api/live-chat')
                .send({ message: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message content is required');
        });

        it('should reject message exceeding 5000 characters', async () => {
            const longMessage = 'a'.repeat(5001);

            const response = await request(app)
                .post('/api/live-chat')
                .send({ message: longMessage })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message is too long (max 5000 characters)');
        });

        it('should send image message', async () => {
            const mockMessage = {
                id: 1,
                content: 'Check this',
                type: ChatMessageType.IMAGE,
                fileUrl: '/uploads/image.jpg',
                senderId: 1,
                receiverId: 100,
                senderType: SenderType.CITIZEN,
                isRead: false,
                createdAt: new Date(),
            };

            (liveChatService.sendUserMessage as jest.Mock).mockResolvedValue(mockMessage);

            const response = await request(app)
                .post('/api/live-chat')
                .send({ message: 'Check this', imageUrl: '/uploads/image.jpg' })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(liveChatService.sendUserMessage).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    content: 'Check this',
                    type: ChatMessageType.IMAGE,
                    fileUrl: '/uploads/image.jpg',
                })
            );
        });
    });

    describe('PATCH /api/live-chat/read', () => {
        it('should mark messages as read', async () => {
            const mockAdmin = { id: 100 };

            (liveChatService.getUserAdmin as jest.Mock).mockResolvedValue(mockAdmin);
            (liveChatService.markMessagesAsRead as jest.Mock).mockResolvedValue({ updated: 5 });

            const response = await request(app).patch('/api/live-chat/read').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.updated).toBe(5);
        });

        it('should return 404 when no admin assigned', async () => {
            (liveChatService.getUserAdmin as jest.Mock).mockResolvedValue(null);

            const response = await request(app).patch('/api/live-chat/read').expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No admin assigned to your ward');
        });
    });

    describe('GET /api/live-chat/unread', () => {
        it('should return unread count', async () => {
            (liveChatService.getUnreadCount as jest.Mock).mockResolvedValue({ count: 10 });

            const response = await request(app).get('/api/live-chat/unread').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(10);
        });
    });
});


describe('Live Chat Routes - Admin Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/live-chat', () => {
        it('should return conversations for admin', async () => {
            const mockConversations = [
                {
                    user: {
                        id: 1,
                        firstName: 'User',
                        lastName: 'One',
                        phone: '01712345678',
                        avatar: null,
                        ward: { id: 10, number: '10', wardNumber: '10' },
                        zone: { id: 5, number: '5', name: 'Zone 5' },
                    },
                    lastMessage: {
                        id: 1,
                        content: 'Hello',
                        createdAt: new Date(),
                    },
                    unreadCount: 3,
                },
            ];

            (liveChatService.getAllUserConversations as jest.Mock).mockResolvedValue({
                conversations: mockConversations,
                total: 1,
                page: 1,
                limit: 20,
                hasMore: false,
            });

            const response = await request(app).get('/api/admin/live-chat').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.conversations).toHaveLength(1);
            expect(response.body.data.conversations[0].unreadCount).toBe(3);
        });

        it('should apply filters', async () => {
            (liveChatService.getAllUserConversations as jest.Mock).mockResolvedValue({
                conversations: [],
                total: 0,
                page: 1,
                limit: 20,
                hasMore: false,
            });

            await request(app)
                .get('/api/admin/live-chat')
                .query({
                    cityCorporationCode: 'DSCC',
                    zoneId: 5,
                    wardId: 10,
                    unreadOnly: 'true',
                    search: 'John',
                })
                .expect(200);

            expect(liveChatService.getAllUserConversations).toHaveBeenCalledWith(
                100,
                expect.objectContaining({
                    cityCorporationCode: 'DSCC',
                    zoneId: 5,
                    wardId: 10,
                    unreadOnly: true,
                    search: 'John',
                })
            );
        });
    });

    describe('GET /api/admin/live-chat/:userId', () => {
        it('should return messages for specific user', async () => {
            const mockMessages = [
                {
                    id: 1,
                    content: 'Hello',
                    type: ChatMessageType.TEXT,
                    senderId: 1,
                    receiverId: 100,
                    senderType: SenderType.CITIZEN,
                    isRead: false,
                    createdAt: new Date(),
                },
            ];

            (liveChatService.getUserMessages as jest.Mock).mockResolvedValue({
                messages: mockMessages,
                total: 1,
                page: 1,
                limit: 50,
                hasMore: false,
            });

            const response = await request(app).get('/api/admin/live-chat/1').expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.messages).toHaveLength(1);
        });

        it('should return 400 for invalid user ID', async () => {
            const response = await request(app).get('/api/admin/live-chat/invalid').expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should return 403 when admin does not have access', async () => {
            (liveChatService.getUserMessages as jest.Mock).mockRejectedValue(
                new Error('Admin does not have access to this user')
            );

            const response = await request(app).get('/api/admin/live-chat/1').expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/admin/live-chat/:userId', () => {
        it('should send message to user', async () => {
            const mockMessage = {
                id: 1,
                content: 'Hello User',
                type: ChatMessageType.TEXT,
                senderId: 100,
                receiverId: 1,
                senderType: SenderType.ADMIN,
                isRead: false,
                createdAt: new Date(),
            };

            (liveChatService.sendAdminMessage as jest.Mock).mockResolvedValue(mockMessage);

            const response = await request(app)
                .post('/api/admin/live-chat/1')
                .send({ message: 'Hello User' })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.message.content).toBe('Hello User');
        });

        it('should return 400 for invalid user ID', async () => {
            const response = await request(app)
                .post('/api/admin/live-chat/invalid')
                .send({ message: 'Hello' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });

        it('should reject empty message', async () => {
            const response = await request(app)
                .post('/api/admin/live-chat/1')
                .send({ message: '' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Message content is required');
        });

        it('should return 403 when admin does not have access', async () => {
            (liveChatService.sendAdminMessage as jest.Mock).mockRejectedValue(
                new Error('Admin does not have access to this user')
            );

            const response = await request(app)
                .post('/api/admin/live-chat/1')
                .send({ message: 'Hello' })
                .expect(403);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PATCH /api/admin/live-chat/:userId/read', () => {
        it('should mark user messages as read', async () => {
            (liveChatService.markMessagesAsRead as jest.Mock).mockResolvedValue({ updated: 5 });

            const response = await request(app)
                .patch('/api/admin/live-chat/1/read')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.updated).toBe(5);
        });

        it('should return 400 for invalid user ID', async () => {
            const response = await request(app)
                .patch('/api/admin/live-chat/invalid/read')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid user ID');
        });
    });

    describe('GET /api/admin/live-chat/statistics', () => {
        it('should return statistics', async () => {
            const mockStats = {
                totalConversations: 25,
                unreadMessages: 8,
                todayMessages: 15,
            };

            (liveChatService.getStatistics as jest.Mock).mockResolvedValue(mockStats);

            const response = await request(app)
                .get('/api/admin/live-chat/statistics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalConversations).toBe(25);
            expect(response.body.data.unreadMessages).toBe(8);
            expect(response.body.data.todayMessages).toBe(15);
        });
    });
});
