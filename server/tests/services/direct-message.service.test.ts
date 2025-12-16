import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { DirectMessageService } from '../../src/services/direct-message.service';
import prisma from '../../src/utils/prisma';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('DirectMessageService', () => {
    let service: DirectMessageService;

    beforeEach(() => {
        service = new DirectMessageService();
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        it('should create a chat message successfully', async () => {
            const input = {
                senderId: 1,
                receiverId: 2,
                content: 'Hello',
                type: 'TEXT' as const,
            };

            const expectedMessage = {
                id: 1,
                ...input,
                fileUrl: null,
                isRead: false,
                createdAt: new Date(),
                sender: {
                    id: 1,
                    firstName: 'Admin',
                    lastName: 'User',
                    avatar: null
                }
            };

            prismaMock.chatMessage.create.mockResolvedValue(expectedMessage as any);

            const result = await service.sendMessage(input);

            expect(result).toEqual(expectedMessage);
            expect(prismaMock.chatMessage.create).toHaveBeenCalledWith({
                data: {
                    senderId: input.senderId,
                    receiverId: input.receiverId,
                    content: input.content,
                    type: input.type,
                    fileUrl: undefined,
                    isRead: false
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true
                        }
                    }
                }
            });
        });

        it('should throw error if prisma fails', async () => {
            prismaMock.chatMessage.create.mockRejectedValue(new Error('DB Error'));
            await expect(service.sendMessage({ senderId: 1, receiverId: 2, content: 'Hi' }))
                .rejects.toThrow('Failed to send direct message');
        });
    });

    describe('getConversation', () => {
        it('should fetch conversation messages', async () => {
            const userId1 = 1;
            const userId2 = 2;
            const messages = [
                { id: 1, content: 'Hi', senderId: 1, receiverId: 2 },
                { id: 2, content: 'Hello', senderId: 2, receiverId: 1 }
            ];
            const total = 2;

            prismaMock.chatMessage.findMany.mockResolvedValue(messages as any);
            prismaMock.chatMessage.count.mockResolvedValue(total);

            const result = await service.getConversation(userId1, userId2);

            expect(result.messages).toHaveLength(2);
            expect(result.pagination.total).toBe(2);
            expect(prismaMock.chatMessage.findMany).toHaveBeenCalled();
        });
    });

    describe('getRecentConversations', () => {
        it('should fetch unique recent contacts', async () => {
            const adminId = 1;
            const recentMessages = [
                { senderId: 1, receiverId: 2, createdAt: new Date() },
                { senderId: 2, receiverId: 1, createdAt: new Date() }, // Duplicate contact 2
                { senderId: 1, receiverId: 3, createdAt: new Date() }
            ];

            const contacts = [
                { id: 2, firstName: 'User', lastName: 'Two' },
                { id: 3, firstName: 'User', lastName: 'Three' }
            ];

            prismaMock.chatMessage.findMany.mockResolvedValue(recentMessages as any);
            prismaMock.user.findMany.mockResolvedValue(contacts as any);

            const result = await service.getRecentConversations(adminId);

            expect(result).toHaveLength(2);
            // Expect findMany to be called with IDs [2, 3] (or [3, 2] order not strictly guaranteed by Set iteration but reasonably stable)
            expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    id: { in: expect.arrayContaining([2, 3]) }
                }
            }));
        });
    });

    describe('markAsRead', () => {
        it('should update unread messages', async () => {
            prismaMock.chatMessage.updateMany.mockResolvedValue({ count: 5 });

            await service.markAsRead(2, 1);

            expect(prismaMock.chatMessage.updateMany).toHaveBeenCalledWith({
                where: {
                    senderId: 2,
                    receiverId: 1,
                    isRead: false
                },
                data: { isRead: true }
            });
        });
    });
});
