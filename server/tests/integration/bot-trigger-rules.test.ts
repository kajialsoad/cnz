/**
 * Bot Trigger Rules - Integration Tests
 * 
 * Tests the complete bot trigger rule system including:
 * - Bot enabled/disabled state
 * - Reactivation threshold
 * - Step reset on reactivation
 * - Different chat types
 */

import { PrismaClient, ChatType, SenderType } from '@prisma/client';
import { BotMessageService } from '../../src/services/bot-message.service';

const prisma = new PrismaClient();
const botService = new BotMessageService();

describe('Bot Trigger Rules - Integration Tests', () => {
    let testUserId: number;
    let testAdminId: number;
    let testComplaintId: number;

    beforeAll(async () => {
        // Create test user
        const testUser = await prisma.user.create({
            data: {
                email: `bot-trigger-test-${Date.now()}@test.com`,
                phone: `01700${Date.now().toString().slice(-6)}`,
                passwordHash: 'hashedpassword',
                firstName: 'Bot',
                lastName: 'Test User',
                role: 'CUSTOMER',
                status: 'ACTIVE'
            }
        });
        testUserId = testUser.id;

        // Create test admin
        const testAdmin = await prisma.user.create({
            data: {
                email: `bot-trigger-admin-${Date.now()}@test.com`,
                phone: `01701${Date.now().toString().slice(-6)}`,
                passwordHash: 'hashedpassword',
                firstName: 'Bot',
                lastName: 'Test Admin',
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });
        testAdminId = testAdmin.id;

        // Create test complaint
        const testComplaint = await prisma.complaint.create({
            data: {
                title: 'Bot Trigger Test Complaint',
                description: 'Test complaint for bot trigger rules',
                location: 'Test Location',
                userId: testUserId,
                status: 'PENDING'
            }
        });
        testComplaintId = testComplaint.id;

        // Ensure bot messages exist
        const liveChatMessages = await prisma.botMessageConfig.count({
            where: { chatType: ChatType.LIVE_CHAT, isActive: true }
        });

        if (liveChatMessages === 0) {
            await prisma.botMessageConfig.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'welcome',
                        content: 'Welcome to Live Chat!',
                        contentBn: 'লাইভ চ্যাটে স্বাগতম!',
                        stepNumber: 1,
                        displayOrder: 1,
                        isActive: true
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'help',
                        content: 'How can we help you?',
                        contentBn: 'আমরা কিভাবে সাহায্য করতে পারি?',
                        stepNumber: 2,
                        displayOrder: 2,
                        isActive: true
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'office_hours',
                        content: 'Office hours: 9 AM - 5 PM',
                        contentBn: 'অফিস সময়: সকাল ৯টা - বিকাল ৫টা',
                        stepNumber: 3,
                        displayOrder: 3,
                        isActive: true
                    }
                ]
            });
        }

        const complaintChatMessages = await prisma.botMessageConfig.count({
            where: { chatType: ChatType.COMPLAINT_CHAT, isActive: true }
        });

        if (complaintChatMessages === 0) {
            await prisma.botMessageConfig.createMany({
                data: [
                    {
                        chatType: ChatType.COMPLAINT_CHAT,
                        messageKey: 'received',
                        content: 'Your complaint has been received.',
                        contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে।',
                        stepNumber: 1,
                        displayOrder: 1,
                        isActive: true
                    },
                    {
                        chatType: ChatType.COMPLAINT_CHAT,
                        messageKey: 'working',
                        content: 'We are working on your complaint.',
                        contentBn: 'আমরা আপনার অভিযোগে কাজ করছি।',
                        stepNumber: 2,
                        displayOrder: 2,
                        isActive: true
                    }
                ]
            });
        }
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.complaintChatMessage.deleteMany({
            where: { complaintId: testComplaintId }
        });
        await prisma.complaint.deleteMany({
            where: { id: testComplaintId }
        });
        await prisma.chatMessage.deleteMany({
            where: {
                OR: [
                    { senderId: testUserId },
                    { receiverId: testUserId }
                ]
            }
        });
        await prisma.user.deleteMany({
            where: {
                id: { in: [testUserId, testAdminId] }
            }
        });
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up conversation states before each test
        await prisma.botConversationState.deleteMany({
            where: {
                conversationId: {
                    in: [
                        `user-${testUserId}-admin-${testAdminId}`,
                        `complaint-${testComplaintId}`
                    ]
                }
            }
        });
    });

    describe('Bot Enabled/Disabled State', () => {
        it('should not trigger bot when disabled for Live Chat', async () => {
            // Disable bot
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: false
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: `user-${testUserId}-admin-${testAdminId}`,
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(false);

            // Re-enable for other tests
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true
            });
        });

        it('should trigger bot when enabled for Live Chat', async () => {
            // Ensure bot is enabled
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: `user-${testUserId}-admin-${testAdminId}`,
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1);
            expect(result.botMessage).toBeDefined();
        });

        it('should not trigger bot when disabled for Complaint Chat', async () => {
            // Disable bot
            await botService.updateTriggerRules(ChatType.COMPLAINT_CHAT, {
                isEnabled: false
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.COMPLAINT_CHAT,
                conversationId: `complaint-${testComplaintId}`,
                hasAdminReplied: false
            });

            expect(result.shouldSend).toBe(false);

            // Re-enable for other tests
            await botService.updateTriggerRules(ChatType.COMPLAINT_CHAT, {
                isEnabled: true
            });
        });
    });

    describe('Reactivation Threshold', () => {
        it('should not reactivate bot before threshold is reached', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Set threshold to 5
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Create state with admin reply
            const state = await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 2,
                    isActive: false,
                    userMessageCount: 3, // Below threshold
                    lastAdminReplyAt: new Date()
                }
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(false);
        });

        it('should reactivate bot when threshold is reached', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Set threshold to 5
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Create state with admin reply and threshold reached
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 2,
                    isActive: false,
                    userMessageCount: 5, // Threshold reached
                    lastAdminReplyAt: new Date()
                }
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(3); // Next step
            expect(result.botMessage).toBeDefined();

            // Verify counter was reset
            const updatedState = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(updatedState?.userMessageCount).toBe(0);
            expect(updatedState?.isActive).toBe(true);
        });

        it('should respect different thresholds for different chat types', async () => {
            const liveChatConversationId = `user-${testUserId}-admin-${testAdminId}`;
            const complaintChatConversationId = `complaint-${testComplaintId}`;

            // Set different thresholds
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 3
            });

            await botService.updateTriggerRules(ChatType.COMPLAINT_CHAT, {
                isEnabled: true,
                reactivationThreshold: 7
            });

            // Create states
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId: liveChatConversationId,
                    currentStep: 1,
                    isActive: false,
                    userMessageCount: 3,
                    lastAdminReplyAt: new Date()
                }
            });

            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.COMPLAINT_CHAT,
                    conversationId: complaintChatConversationId,
                    currentStep: 1,
                    isActive: false,
                    userMessageCount: 3,
                    lastAdminReplyAt: new Date()
                }
            });

            // Live chat should reactivate (threshold 3)
            const liveChatResult = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId: liveChatConversationId,
                hasAdminReplied: true
            });

            expect(liveChatResult.shouldSend).toBe(true);

            // Complaint chat should NOT reactivate (threshold 7)
            const complaintChatResult = await botService.shouldTriggerBot({
                chatType: ChatType.COMPLAINT_CHAT,
                conversationId: complaintChatConversationId,
                hasAdminReplied: true
            });

            expect(complaintChatResult.shouldSend).toBe(false);
        });
    });

    describe('Step Reset on Reactivation', () => {
        it('should continue from current step when resetStepsOnReactivate is false', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Configure to NOT reset steps
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Create state at step 2
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 2,
                    isActive: false,
                    userMessageCount: 5,
                    lastAdminReplyAt: new Date()
                }
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(3); // Continue to next step
        });

        it('should reset to step 1 when resetStepsOnReactivate is true', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Configure to reset steps
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: true
            });

            // Create state at step 2
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 2,
                    isActive: false,
                    userMessageCount: 5,
                    lastAdminReplyAt: new Date()
                }
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1); // Reset to step 1
            expect(result.botMessage?.messageKey).toBe('live_chat_welcome');
        });

        it('should reset to step 1 if next step does not exist', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Configure to NOT reset steps
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            });

            // Create state at step 3 (last step)
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 3,
                    isActive: false,
                    userMessageCount: 5,
                    lastAdminReplyAt: new Date()
                }
            });

            const result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });

            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1); // Reset to step 1 since step 4 doesn't exist
        });
    });

    describe('User Message Counter', () => {
        it('should increment counter on each user message when bot is inactive', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Create inactive state
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 1,
                    isActive: false,
                    userMessageCount: 0,
                    lastAdminReplyAt: new Date()
                }
            });

            // Simulate 3 user messages
            for (let i = 1; i <= 3; i++) {
                await botService.handleUserMessage({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId
                });

                const state = await prisma.botConversationState.findUnique({
                    where: {
                        chatType_conversationId: {
                            chatType: ChatType.LIVE_CHAT,
                            conversationId
                        }
                    }
                });

                expect(state?.userMessageCount).toBe(i);
            }
        });

        it('should not increment counter when bot is active', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Create active state
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 1,
                    isActive: true,
                    userMessageCount: 0
                }
            });

            // Simulate user message
            await botService.handleUserMessage({
                chatType: ChatType.LIVE_CHAT,
                conversationId
            });

            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.userMessageCount).toBe(0); // Should not increment
        });

        it('should reset counter to 0 when admin replies', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Create state with counter
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    currentStep: 2,
                    isActive: true,
                    userMessageCount: 3
                }
            });

            // Admin replies
            await botService.handleAdminReply({
                chatType: ChatType.LIVE_CHAT,
                conversationId
            });

            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.userMessageCount).toBe(0);
            expect(state?.isActive).toBe(false);
            expect(state?.lastAdminReplyAt).toBeDefined();
        });
    });

    describe('Complete Flow Scenarios', () => {
        it('should handle complete bot lifecycle: trigger → deactivate → reactivate', async () => {
            const conversationId = `user-${testUserId}-admin-${testAdminId}`;

            // Configure rules
            await botService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 3,
                resetStepsOnReactivate: false
            });

            // Phase 1: User messages trigger bot
            let result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: false
            });
            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(1);

            result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: false
            });
            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(2);

            // Phase 2: Admin replies → bot deactivates
            await botService.handleAdminReply({
                chatType: ChatType.LIVE_CHAT,
                conversationId
            });

            let state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });
            expect(state?.isActive).toBe(false);

            // Phase 3: User messages increment counter
            await botService.handleUserMessage({ chatType: ChatType.LIVE_CHAT, conversationId });
            await botService.handleUserMessage({ chatType: ChatType.LIVE_CHAT, conversationId });

            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });
            expect(state?.userMessageCount).toBe(2);

            // Bot should not trigger yet
            result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });
            expect(result.shouldSend).toBe(false);

            // Phase 4: Threshold reached → bot reactivates
            await botService.handleUserMessage({ chatType: ChatType.LIVE_CHAT, conversationId });

            result = await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: true
            });
            expect(result.shouldSend).toBe(true);
            expect(result.step).toBe(3); // Continue from step 2

            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });
            expect(state?.isActive).toBe(true);
            expect(state?.userMessageCount).toBe(0); // Reset
        }, 60000); // Increase timeout to 60 seconds for complete flow test
    });
});
