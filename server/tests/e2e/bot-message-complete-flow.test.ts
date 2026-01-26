/**
 * End-to-End Tests for Complete Bot Message Flow
 * 
 * Tests the complete bot flow:
 * User → Bot → Admin → Bot reactivation
 * 
 * This test suite validates the entire bot message system across both
 * Live Chat and Complaint Chat contexts.
 */

import { PrismaClient, ChatType, SenderType } from '@prisma/client';
import { LiveChatService } from '../../src/services/live-chat.service';
import { chatService } from '../../src/services/chat.service';
import { botMessageService } from '../../src/services/bot-message.service';

// Use a single shared Prisma client to avoid connection pool exhaustion
let prisma: PrismaClient;
let liveChatService: LiveChatService;

// Increase timeout for E2E tests
jest.setTimeout(180000); // 3 minutes

describe('Bot Message System - Complete E2E Flow', () => {
    let testCityCorp: any;
    let testZone: any;
    let testWard: any;
    let testUser: any;
    let testAdmin: any;
    let testComplaint: any;

    beforeAll(async () => {
        // Initialize Prisma client and services
        prisma = new PrismaClient();
        liveChatService = new LiveChatService();

        // Create test infrastructure
        testCityCorp = await prisma.cityCorporation.create({
            data: {
                code: 'E2E_BOT_TEST',
                name: 'E2E Bot Test City Corp',
                status: 'ACTIVE',
                minWard: 1,
                maxWard: 100
            }
        });

        testZone = await prisma.zone.create({
            data: {
                number: 997,
                name: 'E2E Bot Test Zone',
                cityCorporation: {
                    connect: { code: testCityCorp.code }
                },
                status: 'ACTIVE'
            }
        });

        testWard = await prisma.ward.create({
            data: {
                wardNumber: 997,
                number: 997,
                zone: {
                    connect: { id: testZone.id }
                },
                cityCorporationId: testCityCorp.id,
                status: 'ACTIVE'
            }
        });

        // Create test users
        testUser = await prisma.user.create({
            data: {
                firstName: 'E2E',
                lastName: 'User',
                phone: `+88017${Math.floor(Math.random() * 100000000)}`,
                email: `e2e-user-${Date.now()}@test.com`,
                passwordHash: 'hashedpassword',
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wardId: testWard.id,
                zoneId: testZone.id,
                cityCorporationCode: testCityCorp.code
            }
        });

        testAdmin = await prisma.user.create({
            data: {
                firstName: 'E2E',
                lastName: 'Admin',
                phone: `+88018${Math.floor(Math.random() * 100000000)}`,
                email: `e2e-admin-${Date.now()}@test.com`,
                passwordHash: 'hashedpassword',
                role: 'ADMIN',
                status: 'ACTIVE',
                wardId: testWard.id,
                zoneId: testZone.id,
                cityCorporationCode: testCityCorp.code
            }
        });

        // Create test complaint
        testComplaint = await prisma.complaint.create({
            data: {
                userId: testUser.id,
                title: 'E2E Bot Test Complaint',
                description: 'Testing complete bot flow',
                location: 'Test Location',
                category: 'WASTE_MANAGEMENT',
                status: 'PENDING',
                cityCorporationCode: testCityCorp.code,
                wardId: testWard.id,
                zoneId: testZone.id
            }
        });

        // Setup bot messages for both chat types
        await setupBotMessages();
    });

    afterAll(async () => {
        // Cleanup in reverse order of creation
        try {
            await prisma.complaintChatMessage.deleteMany({
                where: { complaintId: testComplaint.id }
            });

            await prisma.chatMessage.deleteMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                }
            });

            await prisma.botConversationState.deleteMany({
                where: {
                    OR: [
                        { conversationId: { contains: `user-${testUser.id}` } },
                        { conversationId: `complaint-${testComplaint.id}` }
                    ]
                }
            });

            await prisma.botMessageAnalytics.deleteMany({
                where: {
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            });

            await prisma.complaint.delete({ where: { id: testComplaint.id } });
            await prisma.user.deleteMany({
                where: { id: { in: [testUser.id, testAdmin.id] } }
            });
            await prisma.ward.delete({ where: { id: testWard.id } });
            await prisma.zone.delete({ where: { id: testZone.id } });
            await prisma.cityCorporation.delete({ where: { code: testCityCorp.code } });
        } catch (error) {
            console.error('Error during cleanup:', error);
        } finally {
            // Ensure Prisma client is properly disconnected
            await prisma.$disconnect();
        }
    });

    describe('Live Chat - Complete Bot Flow', () => {
        beforeEach(async () => {
            // Clean up messages and state before each test
            await prisma.chatMessage.deleteMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                }
            });

            await prisma.botConversationState.deleteMany({
                where: {
                    conversationId: { contains: `user-${testUser.id}` }
                }
            });

            // Add small delay to allow connections to settle
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should complete full flow: User → Bot → Admin → Bot Reactivation', async () => {
            // ===== PHASE 1: User sends messages, bot responds =====
            console.log('PHASE 1: User sends messages, bot responds');

            // User sends first message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Hello, I need help with waste collection'
            });

            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 1 was sent
            let messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(2); // User message + Bot step 1
            expect(messages[0].senderType).toBe(SenderType.CITIZEN);
            expect(messages[1].senderType).toBe(SenderType.BOT);
            expect(messages[1].content).toContain('Welcome');

            // User sends second message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'When will someone respond?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 2 was sent
            messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(4); // 2 user + 2 bot
            expect(messages[3].senderType).toBe(SenderType.BOT);
            expect(messages[3].content).toContain('respond shortly');

            // User sends third message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'What are your office hours?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 3 was sent
            messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(6); // 3 user + 3 bot
            expect(messages[5].senderType).toBe(SenderType.BOT);
            expect(messages[5].content).toContain('Office hours');

            // Verify conversation state
            let conversationId = `user-${testUser.id}-admin-${testAdmin.id}`;
            let state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state).toBeTruthy();
            expect(state?.currentStep).toBe(3);
            expect(state?.isActive).toBe(true);
            expect(state?.lastAdminReplyAt).toBeNull();

            // ===== PHASE 2: Admin replies, bot deactivates =====
            console.log('PHASE 2: Admin replies, bot deactivates');

            // Admin sends reply
            await liveChatService.sendAdminMessage(testAdmin.id, testUser.id, {
                content: 'Hello! I can help you with waste collection. What is your address?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot is deactivated
            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.isActive).toBe(false);
            expect(state?.lastAdminReplyAt).toBeTruthy();
            expect(state?.userMessageCount).toBe(0); // Reset

            // User sends message after admin reply
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'My address is 123 Test Street'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify no new bot message was sent
            messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            const botMessagesCount = messages.filter(m => m.senderType === SenderType.BOT).length;
            expect(botMessagesCount).toBe(3); // Still only 3 bot messages

            // ===== PHASE 3: User sends multiple messages, bot reactivates =====
            console.log('PHASE 3: User sends multiple messages, bot reactivates');

            // User sends message 2 (after admin reply)
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Are you still there?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify user message count incremented
            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.userMessageCount).toBe(2);
            expect(state?.isActive).toBe(false); // Still inactive

            // User sends message 3 (reaches threshold)
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Hello? Anyone there?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot reactivated and sent message
            messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                },
                orderBy: { createdAt: 'asc' }
            });

            const finalBotMessagesCount = messages.filter(m => m.senderType === SenderType.BOT).length;
            expect(finalBotMessagesCount).toBe(4); // Bot sent a new message

            // Verify conversation state after reactivation
            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.isActive).toBe(true); // Reactivated
            expect(state?.userMessageCount).toBe(0); // Reset
            expect(state?.currentStep).toBe(4); // Continued from step 3

            console.log('✅ Live Chat complete flow test passed!');
        }, 90000); // 90 second timeout for this test

        it('should handle bot reactivation with step reset', async () => {
            // Update trigger rules to reset steps on reactivation
            await botMessageService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 3,
                resetStepsOnReactivate: true // Enable reset
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends first message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'First message'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Admin replies
            await liveChatService.sendAdminMessage(testAdmin.id, testUser.id, {
                content: 'Admin response'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends 3 messages to trigger reactivation
            for (let i = 1; i <= 3; i++) {
                await liveChatService.sendUserMessage(testUser.id, {
                    content: `Message ${i} after admin reply`
                });
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Verify bot reactivated with step 1
            const messages = await prisma.chatMessage.findMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ],
                    senderType: SenderType.BOT
                },
                orderBy: { createdAt: 'desc' }
            });

            expect(messages[0].content).toContain('Welcome'); // Step 1 message

            // Reset trigger rules back to default
            await botMessageService.updateTriggerRules(ChatType.LIVE_CHAT, {
                isEnabled: true,
                reactivationThreshold: 3,
                resetStepsOnReactivate: false
            });
        }, 45000); // 45 second timeout
    });

    describe('Complaint Chat - Complete Bot Flow', () => {
        beforeEach(async () => {
            // Clean up messages and state before each test
            await prisma.complaintChatMessage.deleteMany({
                where: { complaintId: testComplaint.id }
            });

            await prisma.botConversationState.deleteMany({
                where: { conversationId: `complaint-${testComplaint.id}` }
            });

            // Add small delay to allow connections to settle
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        it('should complete full flow: User → Bot → Admin → Bot Reactivation', async () => {
            // ===== PHASE 1: User sends messages, bot responds =====
            console.log('PHASE 1: User sends messages in complaint chat, bot responds');

            // User sends first message
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'When will my complaint be resolved?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 1 was sent
            let messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaint.id },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(2); // User message + Bot step 1
            expect(messages[0].senderType).toBe('CITIZEN');
            expect(messages[1].senderType).toBe('BOT');
            expect(messages[1].message).toContain('received');

            // User sends second message
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'This is urgent!'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 2 was sent
            messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaint.id },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(4); // 2 user + 2 bot
            expect(messages[3].senderType).toBe('BOT');
            expect(messages[3].message).toContain('working');

            // User sends third message
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Please respond quickly'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot step 3 was sent
            messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaint.id },
                orderBy: { createdAt: 'asc' }
            });

            expect(messages.length).toBe(6); // 3 user + 3 bot
            expect(messages[5].senderType).toBe('BOT');
            expect(messages[5].message).toContain('patience');

            // Verify conversation state
            let conversationId = `complaint-${testComplaint.id}`;
            let state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId
                    }
                }
            });

            expect(state).toBeTruthy();
            expect(state?.currentStep).toBe(3);
            expect(state?.isActive).toBe(true);

            // ===== PHASE 2: Admin replies, bot deactivates =====
            console.log('PHASE 2: Admin replies in complaint chat, bot deactivates');

            // Admin sends reply
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testAdmin.id,
                senderType: SenderType.ADMIN,
                message: 'We are working on your complaint. It will be resolved within 24 hours.'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot is deactivated
            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.isActive).toBe(false);
            expect(state?.lastAdminReplyAt).toBeTruthy();
            expect(state?.userMessageCount).toBe(0);

            // User sends message after admin reply
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Thank you for the update'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify no new bot message was sent
            messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaint.id },
                orderBy: { createdAt: 'asc' }
            });

            const botMessagesCount = messages.filter(m => m.senderType === 'BOT').length;
            expect(botMessagesCount).toBe(3); // Still only 3 bot messages

            // ===== PHASE 3: User sends multiple messages, bot reactivates =====
            console.log('PHASE 3: User sends multiple messages, bot reactivates');

            // User sends message 2 (after admin reply)
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Any update on my complaint?'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends message 3
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Still waiting for resolution'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends message 4 (reaches threshold of 3)
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Please help!'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify bot reactivated and sent message
            messages = await prisma.complaintChatMessage.findMany({
                where: { complaintId: testComplaint.id },
                orderBy: { createdAt: 'asc' }
            });

            const finalBotMessagesCount = messages.filter(m => m.senderType === 'BOT').length;
            expect(finalBotMessagesCount).toBe(4); // Bot sent a new message

            // Verify conversation state after reactivation
            state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.COMPLAINT_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.isActive).toBe(true); // Reactivated
            expect(state?.userMessageCount).toBe(0); // Reset

            console.log('✅ Complaint Chat complete flow test passed!');
        }, 60000); // 60 second timeout
    });

    describe('Bot Analytics Tracking', () => {
        it('should track bot message triggers and admin replies', async () => {
            // Clean up
            await prisma.chatMessage.deleteMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                }
            });

            await prisma.botConversationState.deleteMany({
                where: { conversationId: { contains: `user-${testUser.id}` } }
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends message (triggers bot)
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Test message for analytics'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Admin replies
            await liveChatService.sendAdminMessage(testAdmin.id, testUser.id, {
                content: 'Admin response for analytics'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Check analytics
            const analytics = await botMessageService.getBotAnalytics({
                chatType: ChatType.LIVE_CHAT,
                startDate: new Date(new Date().setHours(0, 0, 0, 0)),
                endDate: new Date(new Date().setHours(23, 59, 59, 999))
            });

            expect(analytics.totalTriggers).toBeGreaterThan(0);
            expect(analytics.stepBreakdown.length).toBeGreaterThan(0);
        }, 30000); // 30 second timeout
    });

    describe('Bot Message Display in All Locations', () => {
        it('should retrieve bot messages in getUserMessages (Live Chat)', async () => {
            // Clean up
            await prisma.chatMessage.deleteMany({
                where: {
                    OR: [
                        { senderId: testUser.id },
                        { receiverId: testUser.id }
                    ]
                }
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // User sends message (triggers bot)
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Test message'
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            // Get messages
            const result = await liveChatService.getUserMessages(testUser.id);

            const botMessages = result.messages.filter(
                (msg: any) => msg.senderType === SenderType.BOT
            );

            expect(botMessages.length).toBeGreaterThan(0);
            expect(botMessages[0].senderType).toBe(SenderType.BOT);
        }, 30000); // 30 second timeout

        it('should retrieve bot messages in getChatMessages (Complaint Chat)', async () => {
            // Clean up messages and state
            await prisma.complaintChatMessage.deleteMany({
                where: { complaintId: testComplaint.id }
            });

            await prisma.botConversationState.deleteMany({
                where: { conversationId: `complaint-${testComplaint.id}` }
            });

            await new Promise(resolve => setTimeout(resolve, 300));

            // User sends message (triggers bot)
            await chatService.sendChatMessage({
                complaintId: testComplaint.id,
                senderId: testUser.id,
                senderType: SenderType.CITIZEN,
                message: 'Test message for display'
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Get messages
            const result = await chatService.getChatMessages(testComplaint.id);

            const botMessages = result.messages.filter(
                (msg: any) => msg.senderType === 'BOT'
            );

            expect(botMessages.length).toBeGreaterThan(0);
            expect(botMessages[0].senderType).toBe('BOT');
        }, 30000); // 30 second timeout
    });
});

/**
 * Helper function to setup bot messages for testing
 */
async function setupBotMessages() {
    // Setup Live Chat bot messages
    const liveChatMessages = await prisma.botMessageConfig.findMany({
        where: { chatType: ChatType.LIVE_CHAT }
    });

    if (liveChatMessages.length === 0) {
        await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'live_chat_step_1',
                    content: 'Welcome to Clean Care Live Chat! How can we help you today?',
                    contentBn: 'ক্লিন কেয়ার লাইভ চ্যাটে স্বাগতম! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি?',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'live_chat_step_2',
                    content: 'Our team will respond shortly. You can send text, images, or voice messages.',
                    contentBn: 'আমাদের টিম শীঘ্রই উত্তর দেবে। আপনি টেক্সট, ছবি বা ভয়েস মেসেজ পাঠাতে পারেন।',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'live_chat_step_3',
                    content: 'Office hours: Saturday to Thursday, 9 AM - 5 PM',
                    contentBn: 'অফিস সময়: শনিবার থেকে বৃহস্পতিবার, সকাল ৯টা - বিকাল ৫টা',
                    stepNumber: 3,
                    isActive: true,
                    displayOrder: 3
                }
            ]
        });
    }

    // Setup Complaint Chat bot messages
    const complaintChatMessages = await prisma.botMessageConfig.findMany({
        where: { chatType: ChatType.COMPLAINT_CHAT }
    });

    if (complaintChatMessages.length === 0) {
        await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'complaint_step_1',
                    content: 'Your complaint has been received and is being reviewed.',
                    contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে এবং পর্যালোচনা করা হচ্ছে।',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'complaint_step_2',
                    content: 'Our team is working on your complaint. We will update you soon.',
                    contentBn: 'আমাদের টিম আপনার অভিযোগে কাজ করছে। আমরা শীঘ্রই আপডেট দেব।',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                },
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'complaint_step_3',
                    content: 'Please wait while we process your complaint. Thank you for your patience.',
                    contentBn: 'আপনার অভিযোগ প্রক্রিয়া করার সময় অনুগ্রহ করে অপেক্ষা করুন। আপনার ধৈর্যের জন্য ধন্যবাদ।',
                    stepNumber: 3,
                    isActive: true,
                    displayOrder: 3
                }
            ]
        });
    }

    // Setup trigger rules
    await prisma.botTriggerRule.upsert({
        where: { chatType: ChatType.LIVE_CHAT },
        update: {
            isEnabled: true,
            reactivationThreshold: 3,
            resetStepsOnReactivate: false
        },
        create: {
            chatType: ChatType.LIVE_CHAT,
            isEnabled: true,
            reactivationThreshold: 3,
            resetStepsOnReactivate: false
        }
    });

    await prisma.botTriggerRule.upsert({
        where: { chatType: ChatType.COMPLAINT_CHAT },
        update: {
            isEnabled: true,
            reactivationThreshold: 3,
            resetStepsOnReactivate: false
        },
        create: {
            chatType: ChatType.COMPLAINT_CHAT,
            isEnabled: true,
            reactivationThreshold: 3,
            resetStepsOnReactivate: false
        }
    });
}
