/**
 * Live Chat Bot Integration Tests
 * 
 * Tests the integration of bot messages in the live chat system
 */

import { PrismaClient, ChatType, SenderType } from '@prisma/client';
import { LiveChatService } from '../../src/services/live-chat.service';
import { botMessageService } from '../../src/services/bot-message.service';

const prisma = new PrismaClient();
const liveChatService = new LiveChatService();

describe('Live Chat Bot Integration', () => {
    let testUser: any;
    let testAdmin: any;
    let testWard: any;
    let testZone: any;
    let testCityCorp: any;

    beforeAll(async () => {
        // Create test city corporation
        testCityCorp = await prisma.cityCorporation.create({
            data: {
                code: 'TEST_BOT',
                name: 'Test Bot City Corp',
                status: 'ACTIVE',
                minWard: 1,
                maxWard: 100
            }
        });

        // Create test zone
        testZone = await prisma.zone.create({
            data: {
                number: 999,
                name: 'Test Bot Zone',
                cityCorporation: {
                    connect: { code: testCityCorp.code }
                },
                status: 'ACTIVE'
            }
        });

        // Create test ward
        testWard = await prisma.ward.create({
            data: {
                wardNumber: 999,
                number: 999,
                zone: {
                    connect: { id: testZone.id }
                },
                cityCorporationId: testCityCorp.id,
                status: 'ACTIVE'
            }
        });

        // Create test admin
        testAdmin = await prisma.user.create({
            data: {
                firstName: 'Bot',
                lastName: 'Admin',
                phone: '+8801700000999',
                email: 'botadmin@test.com',
                passwordHash: 'hashedpassword',
                role: 'ADMIN',
                status: 'ACTIVE',
                wardId: testWard.id,
                zoneId: testZone.id,
                cityCorporationCode: testCityCorp.code
            }
        });

        // Create test user
        testUser = await prisma.user.create({
            data: {
                firstName: 'Bot',
                lastName: 'User',
                phone: '+8801800000999',
                email: 'botuser@test.com',
                passwordHash: 'hashedpassword',
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wardId: testWard.id,
                zoneId: testZone.id,
                cityCorporationCode: testCityCorp.code
            }
        });

        // Clean up existing bot messages for testing
        await prisma.botMessageConfig.deleteMany({
            where: {
                chatType: ChatType.LIVE_CHAT,
                messageKey: {
                    in: ['live_chat_step_1', 'live_chat_step_2', 'live_chat_step_3']
                }
            }
        });

        // Setup bot messages for testing
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

        // Setup bot trigger rules
        await prisma.botTriggerRule.upsert({
            where: {
                chatType: ChatType.LIVE_CHAT
            },
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
    });

    afterAll(async () => {
        // Cleanup
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
                conversationId: {
                    contains: `user-${testUser.id}`
                }
            }
        });

        await prisma.botMessageAnalytics.deleteMany({
            where: {
                chatType: ChatType.LIVE_CHAT,
                date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }
        });

        // Don't delete bot message configs and trigger rules as they might be used by other tests

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [testUser.id, testAdmin.id]
                }
            }
        });

        await prisma.ward.delete({ where: { id: testWard.id } });
        await prisma.zone.delete({ where: { id: testZone.id } });
        await prisma.cityCorporation.delete({ where: { code: testCityCorp.code } });

        await prisma.$disconnect();
    });

    describe('Bot Trigger on User Messages', () => {
        it('should send bot step 1 when user sends first message', async () => {
            // Send first user message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Hello, I need help'
            });

            // Check if bot message was created
            const botMessage = await prisma.chatMessage.findFirst({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            expect(botMessage).toBeTruthy();
            expect(botMessage?.content).toContain('Welcome to Clean Care Live Chat');
        });

        it('should send bot step 2 when user sends second message', async () => {
            // Send second user message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'I have a complaint'
            });

            // Get all bot messages
            const botMessages = await prisma.chatMessage.findMany({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            expect(botMessages.length).toBeGreaterThanOrEqual(2);
            expect(botMessages[1]?.content).toContain('Our team will respond shortly');
        });

        it('should send bot step 3 when user sends third message', async () => {
            // Send third user message
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'When will you respond?'
            });

            // Get all bot messages
            const botMessages = await prisma.chatMessage.findMany({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            expect(botMessages.length).toBeGreaterThanOrEqual(3);
            expect(botMessages[2]?.content).toContain('Office hours');
        });
    });

    describe('Bot Deactivation on Admin Reply', () => {
        it('should deactivate bot when admin replies', async () => {
            // Admin sends a reply
            await liveChatService.sendAdminMessage(testAdmin.id, testUser.id, {
                content: 'Hello! How can I help you?'
            });

            // Check conversation state
            const conversationId = `user-${testUser.id}-admin-${testAdmin.id}`;
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state).toBeTruthy();
            expect(state?.isActive).toBe(false);
            expect(state?.lastAdminReplyAt).toBeTruthy();
        });

        it('should not send bot message after admin has replied', async () => {
            const botMessagesBefore = await prisma.chatMessage.count({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                }
            });

            // User sends message after admin replied
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Thank you for your help'
            });

            const botMessagesAfter = await prisma.chatMessage.count({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                }
            });

            // Bot message count should not increase
            expect(botMessagesAfter).toBe(botMessagesBefore);
        });
    });

    describe('Bot Reactivation on Threshold', () => {
        it('should reactivate bot after threshold user messages', async () => {
            // Send messages up to threshold (3 messages)
            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Message 1'
            });

            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Message 2'
            });

            const botMessagesBefore = await prisma.chatMessage.count({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                }
            });

            await liveChatService.sendUserMessage(testUser.id, {
                content: 'Message 3 - should trigger bot'
            });

            const botMessagesAfter = await prisma.chatMessage.count({
                where: {
                    receiverId: testUser.id,
                    senderType: SenderType.BOT
                }
            });

            // Bot should have sent a new message
            expect(botMessagesAfter).toBeGreaterThan(botMessagesBefore);
        });

        it('should reset user message count after bot reactivation', async () => {
            const conversationId = `user-${testUser.id}-admin-${testAdmin.id}`;
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    }
                }
            });

            expect(state?.userMessageCount).toBe(0);
        });
    });

    describe('Message Queries Include BOT Type', () => {
        it('should retrieve bot messages in getUserMessages', async () => {
            const result = await liveChatService.getUserMessages(testUser.id);

            const botMessages = result.messages.filter(
                (msg: any) => msg.senderType === SenderType.BOT
            );

            expect(botMessages.length).toBeGreaterThan(0);
        });

        it('should display bot messages with correct sender type', async () => {
            const result = await liveChatService.getUserMessages(testUser.id);

            const botMessage = result.messages.find(
                (msg: any) => msg.senderType === SenderType.BOT
            );

            expect(botMessage).toBeTruthy();
            expect(botMessage?.senderType).toBe(SenderType.BOT);
        });
    });
});
