/**
 * Integration Tests for Bot Message System in Complaint Chat
 * 
 * Tests bot trigger logic, deactivation, and reactivation in complaint chat context
 */

import { PrismaClient, ChatType, SenderType } from '@prisma/client';
import { chatService } from '../../src/services/chat.service';
import { botMessageService } from '../../src/services/bot-message.service';

const prisma = new PrismaClient();

describe('Complaint Chat Bot Integration', () => {
    let testComplaintId: number;
    let testUserId: number;
    let testAdminId: number;
    let testCityCorp: any;
    let testZone: any;
    let testWard: any;

    beforeAll(async () => {
        // Create test city corporation
        testCityCorp = await prisma.cityCorporation.create({
            data: {
                code: 'TEST_COMPLAINT_BOT',
                name: 'Test Complaint Bot City Corp',
                status: 'ACTIVE',
                minWard: 1,
                maxWard: 100
            }
        });

        // Create test zone
        testZone = await prisma.zone.create({
            data: {
                number: 998,
                name: 'Test Complaint Bot Zone',
                cityCorporation: {
                    connect: { code: testCityCorp.code }
                },
                status: 'ACTIVE'
            }
        });

        // Create test ward
        testWard = await prisma.ward.create({
            data: {
                wardNumber: 998,
                number: 998,
                zone: {
                    connect: { id: testZone.id }
                },
                cityCorporationId: testCityCorp.id,
                status: 'ACTIVE'
            }
        });

        // Create test user
        const user = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                email: `test-bot-complaint-${Date.now()}@example.com`,
                phone: `01700${Math.floor(Math.random() * 1000000)}`,
                passwordHash: 'hashedpassword',
                cityCorporationCode: testCityCorp.code,
                wardId: testWard.id,
                zoneId: testZone.id,
                status: 'ACTIVE'
            }
        });
        testUserId = user.id;

        // Create test admin
        const admin = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'Admin',
                email: `test-admin-bot-complaint-${Date.now()}@example.com`,
                phone: `01800${Math.floor(Math.random() * 1000000)}`,
                passwordHash: 'hashedpassword',
                role: 'ADMIN',
                cityCorporationCode: testCityCorp.code,
                wardId: testWard.id,
                zoneId: testZone.id,
                status: 'ACTIVE'
            }
        });
        testAdminId = admin.id;

        // Create test complaint
        const complaint = await prisma.complaint.create({
            data: {
                userId: testUserId,
                title: 'Test Complaint for Bot',
                description: 'Testing bot integration',
                location: 'Test Location',
                category: 'WASTE_MANAGEMENT',
                status: 'PENDING',
                cityCorporationCode: testCityCorp.code,
                wardId: testWard.id,
                zoneId: testZone.id
            }
        });
        testComplaintId = complaint.id;

        // Ensure bot trigger rules exist for COMPLAINT_CHAT
        await botMessageService.updateTriggerRules(ChatType.COMPLAINT_CHAT, {
            isEnabled: true,
            reactivationThreshold: 3,
            resetStepsOnReactivate: false
        });

        // Create test bot messages if they don't exist
        const existingMessages = await botMessageService.getBotMessages(ChatType.COMPLAINT_CHAT);
        if (existingMessages.length === 0) {
            await botMessageService.createBotMessage({
                chatType: ChatType.COMPLAINT_CHAT,
                messageKey: 'complaint_step_1',
                content: 'Your complaint has been received and is being reviewed.',
                contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে এবং পর্যালোচনা করা হচ্ছে।',
                stepNumber: 1,
                displayOrder: 1
            });

            await botMessageService.createBotMessage({
                chatType: ChatType.COMPLAINT_CHAT,
                messageKey: 'complaint_step_2',
                content: 'Our team is working on your complaint. We will update you soon.',
                contentBn: 'আমাদের টিম আপনার অভিযোগে কাজ করছে। আমরা শীঘ্রই আপডেট দেব।',
                stepNumber: 2,
                displayOrder: 2
            });

            await botMessageService.createBotMessage({
                chatType: ChatType.COMPLAINT_CHAT,
                messageKey: 'complaint_step_3',
                content: 'Please wait while we process your complaint. Thank you for your patience.',
                contentBn: 'আপনার অভিযোগ প্রক্রিয়া করার সময় অনুগ্রহ করে অপেক্ষা করুন। আপনার ধৈর্যের জন্য ধন্যবাদ।',
                stepNumber: 3,
                displayOrder: 3
            });
        }
    });

    afterAll(async () => {
        // Clean up test data
        await prisma.complaintChatMessage.deleteMany({
            where: { complaintId: testComplaintId }
        });

        await prisma.botConversationState.deleteMany({
            where: { conversationId: `complaint-${testComplaintId}` }
        });

        await prisma.complaint.delete({
            where: { id: testComplaintId }
        });

        await prisma.user.deleteMany({
            where: {
                id: { in: [testUserId, testAdminId] }
            }
        });

        await prisma.ward.delete({
            where: { id: testWard.id }
        });

        await prisma.zone.delete({
            where: { id: testZone.id }
        });

        await prisma.cityCorporation.delete({
            where: { code: testCityCorp.code }
        });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean messages and state before each test
        await prisma.complaintChatMessage.deleteMany({
            where: { complaintId: testComplaintId }
        });

        await prisma.botConversationState.deleteMany({
            where: { conversationId: `complaint-${testComplaintId}` }
        });
    });

    describe('Bot Trigger on User Messages', () => {
        it('should trigger bot step 1 on first user message', async () => {
            // Send first user message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'This is my first message'
            });

            // Check messages
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(2); // User message + bot message
            expect(messages[0].senderType).toBe('CITIZEN');
            expect(messages[1].senderType).toBe('BOT');
            expect(messages[1].message).toContain('received');
        });

        it('should trigger bot step 2 on second user message', async () => {
            // Send first user message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'First message'
            });

            // Send second user message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'Second message'
            });

            // Check messages
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(4); // 2 user messages + 2 bot messages
            expect(messages[3].senderType).toBe('BOT');
            expect(messages[3].message).toContain('working');
        });

        it('should trigger bot step 3 on third user message', async () => {
            // Send three user messages
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'First message'
            });

            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'Second message'
            });

            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'Third message'
            });

            // Check messages
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(6); // 3 user messages + 3 bot messages
            expect(messages[5].senderType).toBe('BOT');
            expect(messages[5].message).toContain('patience');
        });
    });

    describe('Bot Deactivation on Admin Reply', () => {
        it('should deactivate bot when admin replies', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message'
            });

            // Admin replies
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testAdminId,
                senderType: SenderType.ADMIN,
                message: 'Admin response'
            });

            // Check conversation state
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId: `complaint-${testComplaintId}`
                    }
                }
            });

            expect(state).not.toBeNull();
            expect(state?.isActive).toBe(false);
            expect(state?.lastAdminReplyAt).not.toBeNull();
        });

        it('should not send bot messages after admin has replied', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 1'
            });

            // Admin replies
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testAdminId,
                senderType: SenderType.ADMIN,
                message: 'Admin response'
            });

            // User sends another message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 2'
            });

            // Check messages
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            // Should have: user1, bot1, admin, user2 (no bot2)
            expect(messages.length).toBe(4);
            expect(messages[0].senderType).toBe('CITIZEN');
            expect(messages[1].senderType).toBe('BOT');
            expect(messages[2].senderType).toBe('ADMIN');
            expect(messages[3].senderType).toBe('CITIZEN');
        });
    });

    describe('Bot Reactivation on Threshold', () => {
        it('should reactivate bot after threshold user messages', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 1'
            });

            // Admin replies (deactivates bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testAdminId,
                senderType: SenderType.ADMIN,
                message: 'Admin response'
            });

            // User sends 3 more messages (threshold = 3)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 2'
            });

            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 3'
            });

            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 4'
            });

            // Check messages - bot should reactivate on 4th user message
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            // Should have: user1, bot1, admin, user2, user3, user4, bot2
            expect(messages.length).toBe(7);
            expect(messages[6].senderType).toBe('BOT');
        });

        it('should reset user message count after reactivation', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message 1'
            });

            // Admin replies
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testAdminId,
                senderType: SenderType.ADMIN,
                message: 'Admin response'
            });

            // User sends 3 messages (triggers reactivation)
            for (let i = 2; i <= 4; i++) {
                await chatService.sendChatMessage({
                    complaintId: testComplaintId,
                    senderId: testUserId,
                    senderType: SenderType.CITIZEN,
                    message: `User message ${i}`
                });
            }

            // Check conversation state
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId: `complaint-${testComplaintId}`
                    }
                }
            });

            expect(state).not.toBeNull();
            expect(state?.userMessageCount).toBe(0); // Should be reset
            expect(state?.isActive).toBe(true); // Should be reactivated
        });
    });

    describe('Message Queries Include BOT Type', () => {
        it('should retrieve bot messages in getChatMessages', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message'
            });

            // Get messages
            const result = await chatService.getChatMessages(testComplaintId);

            expect(result.messages.length).toBe(2);
            expect(result.messages[0].senderType).toBe('CITIZEN');
            expect(result.messages[1].senderType).toBe('BOT');
        });

        it('should display bot messages with correct sender type', async () => {
            // Send user message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message'
            });

            // Get messages directly from database
            const messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaintId },
                orderBy: { createdAt: 'asc' }
            });

            const botMessage = messages.find(m => m.senderType === 'BOT');
            expect(botMessage).toBeDefined();
            expect(botMessage?.senderType).toBe('BOT');
            expect(botMessage?.message).toBeTruthy();
        });
    });

    describe('Bot Respects Complaint-Specific Rules', () => {
        it('should use COMPLAINT_CHAT trigger rules', async () => {
            // Get trigger rules
            const rules = await botMessageService.getTriggerRules(ChatType.COMPLAINT_CHAT);

            expect(rules).not.toBeNull();
            expect(rules?.chatType).toBe(ChatType.COMPLAINT_CHAT);
            expect(rules?.isEnabled).toBe(true);
        });

        it('should use COMPLAINT_CHAT bot messages', async () => {
            // Send user message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message'
            });

            // Get bot message
            const messages = await prisma.complaintChatMessage.findMany({
                where: {
                    complaintId: testComplaintId,
                    senderType: 'BOT'
                }
            });

            expect(messages.length).toBe(1);
            expect(messages[0].message).toContain('received'); // Complaint-specific message
        });

        it('should use complaint ID as conversation ID', async () => {
            // Send user message
            await chatService.sendChatMessage({
                complaintId: testComplaintId,
                senderId: testUserId,
                senderType: SenderType.CITIZEN,
                message: 'User message'
            });

            // Check conversation state
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId: `complaint-${testComplaintId}`
                    }
                }
            });

            expect(state).not.toBeNull();
            expect(state?.conversationId).toBe(`complaint-${testComplaintId}`);
        });
    });
});
