/**
 * Bot Message Service - Unit Tests
 * 
 * Tests all methods of the BotMessageService class
 */

import { BotMessageService } from '../../src/services/bot-message.service';
import { PrismaClient, ChatType } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        botMessageConfig: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        botTriggerRule: {
            findUnique: jest.fn(),
            upsert: jest.fn()
        },
        botConversationState: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        botMessageAnalytics: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        }
    };

    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
        ChatType: {
            LIVE_CHAT: 'LIVE_CHAT',
            COMPLAINT_CHAT: 'COMPLAINT_CHAT'
        }
    };
});

describe('BotMessageService', () => {
    let service: BotMessageService;
    let mockPrisma: any;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create service instance
        service = new BotMessageService();

        // Get mock prisma instance
        const PrismaClientMock = require('@prisma/client').PrismaClient;
        mockPrisma = new PrismaClientMock();
    });

    describe('shouldTriggerBot', () => {
        it('should return false if bot is disabled', async () => {
            // Mock trigger rules - bot disabled
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: false,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(false);
            expect(mockPrisma.botTriggerRule.findUnique).toHaveBeenCalledWith({
                where: { chatType: ChatType.LIVE_CHAT }
            });
        });

        it('should send bot step 1 when admin has not replied and no state exists', async () => {
            // Mock trigger rules - enabled
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Mock no existing state
            mockPrisma.botConversationState.findUnique.mockResolvedValue(null);

            // Mock state creation
            mockPrisma.botConversationState.create.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 0,
                isActive: true,
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: null
            });

            // Mock bot message
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome',
                content: 'Welcome!',
                contentBn: 'স্বাগতম!',
                stepNumber: 1,
                isActive: true,
                displayOrder: 1
            });

            // Mock state update
            mockPrisma.botConversationState.update.mockResolvedValue({});

            // Mock analytics findFirst and create
            mockPrisma.botMessageAnalytics.findFirst.mockResolvedValue(null);
            mockPrisma.botMessageAnalytics.create.mockResolvedValue({});

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1);
            expect(result.botMessage).toBeDefined();
            expect(result.botMessage?.content).toBe('Welcome!');
        });

        it('should send next bot step when admin has not replied', async () => {
            // Mock trigger rules
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Mock existing state at step 1
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 1,
                isActive: true,
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: new Date()
            });

            // Mock bot message for step 2
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue({
                id: 2,
                chatType: 'LIVE_CHAT',
                messageKey: 'help',
                content: 'How can we help?',
                contentBn: 'আমরা কিভাবে সাহায্য করতে পারি?',
                stepNumber: 2,
                isActive: true,
                displayOrder: 2
            });

            mockPrisma.botConversationState.update.mockResolvedValue({});
            mockPrisma.botMessageAnalytics.findFirst.mockResolvedValue(null);
            mockPrisma.botMessageAnalytics.create.mockResolvedValue({});

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(2);
            expect(result.botMessage?.content).toBe('How can we help?');
        });

        it('should not send bot when admin has replied and threshold not reached', async () => {
            // Mock trigger rules
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Mock state with admin reply and low user message count
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: false,
                userMessageCount: 3, // Below threshold of 5
                lastAdminReplyAt: new Date(),
                lastBotMessageAt: new Date()
            });

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(false);
        });

        it('should reactivate bot when threshold is reached', async () => {
            // Mock trigger rules
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Mock state with admin reply and high user message count
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: false,
                userMessageCount: 5, // Reached threshold
                lastAdminReplyAt: new Date(),
                lastBotMessageAt: new Date()
            });

            // Mock bot message for step 3
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue({
                id: 3,
                chatType: 'LIVE_CHAT',
                messageKey: 'office_hours',
                content: 'Office hours: 9 AM - 5 PM',
                contentBn: 'অফিস সময়: সকাল ৯টা - বিকাল ৫টা',
                stepNumber: 3,
                isActive: true,
                displayOrder: 3
            });

            mockPrisma.botConversationState.update.mockResolvedValue({});
            mockPrisma.botMessageAnalytics.findFirst.mockResolvedValue(null);
            mockPrisma.botMessageAnalytics.create.mockResolvedValue({});

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(3);
            expect(result.botMessage?.content).toBe('Office hours: 9 AM - 5 PM');
        });

        it('should reset steps on reactivation if configured', async () => {
            // Mock trigger rules with reset enabled
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: true // Reset enabled
            });

            // Mock state
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 3,
                isActive: false,
                userMessageCount: 5,
                lastAdminReplyAt: new Date(),
                lastBotMessageAt: new Date()
            });

            // Mock bot message for step 1 (reset)
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome',
                content: 'Welcome!',
                contentBn: 'স্বাগতম!',
                stepNumber: 1,
                isActive: true,
                displayOrder: 1
            });

            mockPrisma.botConversationState.update.mockResolvedValue({});
            mockPrisma.botMessageAnalytics.findFirst.mockResolvedValue(null);
            mockPrisma.botMessageAnalytics.create.mockResolvedValue({});

            const result = await service.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123',
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1); // Reset to step 1
        });
    });

    describe('handleAdminReply', () => {
        it('should deactivate bot and reset counter', async () => {
            // Mock existing state
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: true,
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: new Date()
            });

            mockPrisma.botConversationState.update.mockResolvedValue({});
            mockPrisma.botMessageAnalytics.findFirst.mockResolvedValue(null);

            await service.handleAdminReply({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123'
            });

            expect(mockPrisma.botConversationState.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: expect.objectContaining({
                    isActive: false,
                    userMessageCount: 0,
                    lastAdminReplyAt: expect.any(Date)
                })
            });
        });

        it('should handle missing state gracefully', async () => {
            mockPrisma.botConversationState.findUnique.mockResolvedValue(null);

            await expect(
                service.handleAdminReply({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId: 'user-123'
                })
            ).resolves.not.toThrow();

            expect(mockPrisma.botConversationState.update).not.toHaveBeenCalled();
        });
    });

    describe('handleUserMessage', () => {
        it('should increment counter when bot is inactive', async () => {
            // Mock inactive state
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: false, // Bot inactive
                userMessageCount: 3,
                lastAdminReplyAt: new Date(),
                lastBotMessageAt: new Date()
            });

            mockPrisma.botConversationState.update.mockResolvedValue({});

            await service.handleUserMessage({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123'
            });

            expect(mockPrisma.botConversationState.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    userMessageCount: 4 // Incremented
                }
            });
        });

        it('should not increment counter when bot is active', async () => {
            // Mock active state
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 1,
                isActive: true, // Bot active
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: new Date()
            });

            await service.handleUserMessage({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123'
            });

            expect(mockPrisma.botConversationState.update).not.toHaveBeenCalled();
        });
    });

    describe('getBotMessageByStep', () => {
        it('should return bot message for given step', async () => {
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome',
                content: 'Welcome!',
                contentBn: 'স্বাগতম!',
                stepNumber: 1,
                isActive: true,
                displayOrder: 1
            });

            const result = await service.getBotMessageByStep(ChatType.LIVE_CHAT, 1);

            expect(result).toBeDefined();
            expect(result?.stepNumber).toBe(1);
            expect(mockPrisma.botMessageConfig.findFirst).toHaveBeenCalledWith({
                where: {
                    chatType: ChatType.LIVE_CHAT,
                    stepNumber: 1,
                    isActive: true
                },
                orderBy: {
                    displayOrder: 'asc'
                }
            });
        });

        it('should return null if no message found', async () => {
            mockPrisma.botMessageConfig.findFirst.mockResolvedValue(null);

            const result = await service.getBotMessageByStep(ChatType.LIVE_CHAT, 99);

            expect(result).toBeNull();
        });
    });

    describe('getConversationState', () => {
        it('should return conversation state', async () => {
            mockPrisma.botConversationState.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: true,
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: new Date()
            });

            const result = await service.getConversationState(ChatType.LIVE_CHAT, 'user-123');

            expect(result).toBeDefined();
            expect(result?.conversationId).toBe('user-123');
        });

        it('should return null if state not found', async () => {
            mockPrisma.botConversationState.findUnique.mockResolvedValue(null);

            const result = await service.getConversationState(ChatType.LIVE_CHAT, 'user-999');

            expect(result).toBeNull();
        });
    });

    describe('createConversationState', () => {
        it('should create new conversation state', async () => {
            mockPrisma.botConversationState.create.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 0,
                isActive: true,
                userMessageCount: 0,
                lastAdminReplyAt: null,
                lastBotMessageAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await service.createConversationState({
                chatType: ChatType.LIVE_CHAT,
                conversationId: 'user-123'
            });

            expect(result).toBeDefined();
            expect(result.currentStep).toBe(0);
            expect(result.isActive).toBe(true);
        });
    });

    describe('updateConversationState', () => {
        it('should update conversation state', async () => {
            mockPrisma.botConversationState.update.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                conversationId: 'user-123',
                currentStep: 2,
                isActive: false,
                userMessageCount: 0,
                lastAdminReplyAt: new Date(),
                lastBotMessageAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await service.updateConversationState(1, {
                currentStep: 2,
                isActive: false
            });

            expect(result).toBeDefined();
            expect(result.currentStep).toBe(2);
            expect(result.isActive).toBe(false);
        });
    });

    describe('getTriggerRules', () => {
        it('should return trigger rules', async () => {
            mockPrisma.botTriggerRule.findUnique.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await service.getTriggerRules(ChatType.LIVE_CHAT);

            expect(result).toBeDefined();
            expect(result?.isEnabled).toBe(true);
            expect(result?.reactivationThreshold).toBe(5);
        });
    });

    describe('getBotMessages', () => {
        it('should return all bot messages for chat type', async () => {
            mockPrisma.botMessageConfig.findMany.mockResolvedValue([
                {
                    id: 1,
                    chatType: 'LIVE_CHAT',
                    messageKey: 'welcome',
                    content: 'Welcome!',
                    contentBn: 'স্বাগতম!',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    id: 2,
                    chatType: 'LIVE_CHAT',
                    messageKey: 'help',
                    content: 'How can we help?',
                    contentBn: 'আমরা কিভাবে সাহায্য করতে পারি?',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                }
            ]);

            const result = await service.getBotMessages(ChatType.LIVE_CHAT);

            expect(result).toHaveLength(2);
            expect(result[0].stepNumber).toBe(1);
            expect(result[1].stepNumber).toBe(2);
        });
    });

    describe('createBotMessage', () => {
        it('should create new bot message', async () => {
            mockPrisma.botMessageConfig.create.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome',
                content: 'Welcome!',
                contentBn: 'স্বাগতম!',
                stepNumber: 1,
                isActive: true,
                displayOrder: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await service.createBotMessage({
                chatType: ChatType.LIVE_CHAT,
                messageKey: 'welcome',
                content: 'Welcome!',
                contentBn: 'স্বাগতম!',
                stepNumber: 1
            });

            expect(result).toBeDefined();
            expect(result.messageKey).toBe('welcome');
        });
    });

    describe('updateBotMessage', () => {
        it('should update bot message', async () => {
            mockPrisma.botMessageConfig.update.mockResolvedValue({
                id: 1,
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome',
                content: 'Welcome updated!',
                contentBn: 'স্বাগতম আপডেট!',
                stepNumber: 1,
                isActive: true,
                displayOrder: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            const result = await service.updateBotMessage(1, {
                content: 'Welcome updated!',
                contentBn: 'স্বাগতম আপডেট!'
            });

            expect(result).toBeDefined();
            expect(result.content).toBe('Welcome updated!');
        });
    });

    describe('deleteBotMessage', () => {
        it('should delete bot message', async () => {
            mockPrisma.botMessageConfig.delete.mockResolvedValue({});

            await expect(service.deleteBotMessage(1)).resolves.not.toThrow();

            expect(mockPrisma.botMessageConfig.delete).toHaveBeenCalledWith({
                where: { id: 1 }
            });
        });
    });

    describe('getBotAnalytics', () => {
        it('should return analytics data', async () => {
            mockPrisma.botMessageAnalytics.findMany.mockResolvedValue([
                {
                    id: 1,
                    chatType: 'LIVE_CHAT',
                    messageKey: 'welcome',
                    stepNumber: 1,
                    triggerCount: 100,
                    adminReplyCount: 80,
                    avgResponseTime: 300,
                    date: new Date()
                },
                {
                    id: 2,
                    chatType: 'LIVE_CHAT',
                    messageKey: 'help',
                    stepNumber: 2,
                    triggerCount: 50,
                    adminReplyCount: 40,
                    avgResponseTime: 400,
                    date: new Date()
                }
            ]);

            const result = await service.getBotAnalytics({
                chatType: ChatType.LIVE_CHAT
            });

            expect(result.totalTriggers).toBe(150);
            expect(result.adminReplyRate).toBeCloseTo(80, 1); // (120/150)*100
            expect(result.avgResponseTime).toBeCloseTo(350, 0); // (300+400)/2
            expect(result.stepBreakdown).toHaveLength(2);
        });
    });
});
