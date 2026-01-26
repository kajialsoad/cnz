/**
 * Bot Trigger Logic - Load Test
 * 
 * Tests the performance of bot trigger logic under high concurrent load
 * 
 * Test Scenarios:
 * 1. Concurrent bot trigger checks (100+ simultaneous requests)
 * 2. Database query performance under load
 * 3. State management consistency under concurrent updates
 * 4. Bot message retrieval performance
 * 5. Analytics tracking performance
 * 
 * Performance Targets:
 * - Bot trigger check: < 100ms per request
 * - Concurrent requests: Handle 100+ simultaneous checks
 * - Database queries: < 50ms average
 * - No race conditions in state updates
 */

import { PrismaClient, ChatType, SenderType } from '@prisma/client';
import { BotMessageService } from '../../src/services/bot-message.service';

const prisma = new PrismaClient();

describe('Bot Trigger Logic - Load Test', () => {
    let botService: BotMessageService;
    let testCityCorp: any;
    let testZone: any;
    let testWard: any;
    const testUsers: any[] = [];
    const CONCURRENT_USERS = 50; // Reduced for faster setup
    const MESSAGES_PER_USER = 5;

    beforeAll(async () => {
        botService = new BotMessageService();

        // Clean up any existing test data first
        await prisma.user.deleteMany({
            where: {
                email: {
                    startsWith: 'loadtest'
                }
            }
        });

        await prisma.ward.deleteMany({
            where: {
                wardNumber: 9999
            }
        });

        await prisma.zone.deleteMany({
            where: {
                number: 9999
            }
        });

        await prisma.cityCorporation.deleteMany({
            where: {
                code: 'LOAD_TEST'
            }
        });

        // Create test infrastructure
        testCityCorp = await prisma.cityCorporation.create({
            data: {
                code: 'LOAD_TEST',
                name: 'Load Test City Corp',
                status: 'ACTIVE',
                minWard: 1,
                maxWard: 100
            }
        });

        testZone = await prisma.zone.create({
            data: {
                number: 9999,
                name: 'Load Test Zone',
                cityCorporation: {
                    connect: { code: testCityCorp.code }
                },
                status: 'ACTIVE'
            }
        });

        testWard = await prisma.ward.create({
            data: {
                wardNumber: 9999,
                number: 9999,
                zone: {
                    connect: { id: testZone.id }
                },
                cityCorporationId: testCityCorp.id,
                status: 'ACTIVE'
            }
        });

        // Create test users with unique identifiers
        const timestamp = Date.now();
        for (let i = 0; i < CONCURRENT_USERS; i++) {
            const user = await prisma.user.create({
                data: {
                    firstName: `LoadTest`,
                    lastName: `User${i}`,
                    phone: `+88017${String(timestamp + i).slice(-8)}`,
                    email: `loadtest${timestamp}${i}@test.com`,
                    passwordHash: 'hashedpassword',
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                    wardId: testWard.id,
                    zoneId: testZone.id,
                    cityCorporationCode: testCityCorp.code
                }
            });
            testUsers.push(user);
        }

        // Setup bot messages
        await prisma.botMessageConfig.deleteMany({
            where: {
                chatType: ChatType.LIVE_CHAT,
                messageKey: {
                    startsWith: 'load_test_'
                }
            }
        });

        await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'load_test_step_1',
                    content: 'Load Test Step 1',
                    contentBn: 'লোড টেস্ট ধাপ ১',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'load_test_step_2',
                    content: 'Load Test Step 2',
                    contentBn: 'লোড টেস্ট ধাপ ২',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'load_test_step_3',
                    content: 'Load Test Step 3',
                    contentBn: 'লোড টেস্ট ধাপ ৩',
                    stepNumber: 3,
                    isActive: true,
                    displayOrder: 3
                }
            ]
        });

        // Setup trigger rules
        await prisma.botTriggerRule.upsert({
            where: {
                chatType: ChatType.LIVE_CHAT
            },
            update: {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            },
            create: {
                chatType: ChatType.LIVE_CHAT,
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            }
        });
    }, 120000); // 120 second timeout for setup

    afterAll(async () => {
        // Cleanup
        await prisma.botConversationState.deleteMany({
            where: {
                conversationId: {
                    startsWith: 'load-test-'
                }
            }
        });

        await prisma.botMessageAnalytics.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'load_test_'
                }
            }
        });

        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'load_test_'
                }
            }
        });

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: testUsers.map(u => u.id)
                }
            }
        });

        await prisma.ward.delete({ where: { id: testWard.id } });
        await prisma.zone.delete({ where: { id: testZone.id } });
        await prisma.cityCorporation.delete({ where: { code: testCityCorp.code } });

        await prisma.$disconnect();
    }, 120000); // 120 second timeout for cleanup

    describe('Concurrent Bot Trigger Checks', () => {
        it('should handle 50 concurrent bot trigger checks within performance target', async () => {
            const startTime = Date.now();
            const promises: Promise<any>[] = [];

            // Simulate 100 concurrent users sending first message
            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-user-${testUsers[i].id}`;
                const promise = botService.shouldTriggerBot({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    hasAdminReplied: false
                });
                promises.push(promise);
            }

            const results = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTimePerRequest = totalTime / CONCURRENT_USERS;

            console.log(`\n📊 Concurrent Bot Trigger Performance:`);
            console.log(`   Total Users: ${CONCURRENT_USERS}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time/Request: ${avgTimePerRequest.toFixed(2)}ms`);
            console.log(`   Requests/Second: ${(CONCURRENT_USERS / (totalTime / 1000)).toFixed(2)}`);

            // All should trigger bot
            const triggeredCount = results.filter(r => r.shouldSend).length;
            expect(triggeredCount).toBe(CONCURRENT_USERS);

            // Performance target: < 100ms average per request
            expect(avgTimePerRequest).toBeLessThan(100);
        }, 30000);

        it('should maintain consistency under concurrent state updates', async () => {
            const promises: Promise<any>[] = [];

            // Simulate concurrent user messages for same conversations
            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-user-${testUsers[i].id}`;

                // Each user sends multiple messages concurrently
                for (let j = 0; j < 3; j++) {
                    const promise = botService.handleUserMessage({
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    });
                    promises.push(promise);
                }
            }

            await Promise.all(promises);

            // Verify state consistency - no race conditions
            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-user-${testUsers[i].id}`;
                const state = await botService.getConversationState(
                    ChatType.LIVE_CHAT,
                    conversationId
                );

                expect(state).toBeTruthy();
                // State should exist and be valid
                expect(state?.currentStep).toBeGreaterThanOrEqual(0);
            }
        }, 30000);
    });

    describe('Sequential Message Load Test', () => {
        it('should handle sequential messages from multiple users efficiently', async () => {
            const timings: number[] = [];

            for (let messageNum = 0; messageNum < MESSAGES_PER_USER; messageNum++) {
                const startTime = Date.now();
                const promises: Promise<any>[] = [];

                for (let i = 0; i < CONCURRENT_USERS; i++) {
                    const conversationId = `load-test-seq-user-${testUsers[i].id}`;
                    const promise = botService.shouldTriggerBot({
                        chatType: ChatType.LIVE_CHAT,
                        conversationId,
                        hasAdminReplied: false
                    });
                    promises.push(promise);
                }

                await Promise.all(promises);
                const endTime = Date.now();
                timings.push(endTime - startTime);
            }

            const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
            const maxTime = Math.max(...timings);
            const minTime = Math.min(...timings);

            console.log(`\n📊 Sequential Message Load Performance:`);
            console.log(`   Messages per User: ${MESSAGES_PER_USER}`);
            console.log(`   Total Users: ${CONCURRENT_USERS}`);
            console.log(`   Avg Time/Batch: ${avgTime.toFixed(2)}ms`);
            console.log(`   Min Time: ${minTime}ms`);
            console.log(`   Max Time: ${maxTime}ms`);

            // Performance should remain consistent
            expect(avgTime).toBeLessThan(150);
            expect(maxTime).toBeLessThan(300);
        }, 60000);
    });

    describe('Database Query Performance', () => {
        it('should retrieve bot messages efficiently under load', async () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await botService.getBotMessageByStep(ChatType.LIVE_CHAT, 1);
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 Bot Message Retrieval Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            // Should be very fast (< 5ms average)
            expect(avgTime).toBeLessThan(5);
        }, 30000);

        it('should retrieve conversation state efficiently under load', async () => {
            const iterations = 1000;
            const conversationId = `load-test-user-${testUsers[0].id}`;

            // Ensure state exists
            await botService.shouldTriggerBot({
                chatType: ChatType.LIVE_CHAT,
                conversationId,
                hasAdminReplied: false
            });

            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await botService.getConversationState(ChatType.LIVE_CHAT, conversationId);
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 Conversation State Retrieval Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            // Should be very fast (< 5ms average)
            expect(avgTime).toBeLessThan(5);
        }, 30000);

        it('should retrieve trigger rules efficiently under load', async () => {
            const iterations = 1000;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await botService.getTriggerRules(ChatType.LIVE_CHAT);
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 Trigger Rules Retrieval Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            // Should be very fast (< 5ms average)
            expect(avgTime).toBeLessThan(5);
        }, 30000);
    });

    describe('Admin Reply Performance', () => {
        it('should handle concurrent admin replies efficiently', async () => {
            const startTime = Date.now();
            const promises: Promise<any>[] = [];

            // Simulate concurrent admin replies
            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-admin-reply-${testUsers[i].id}`;

                // First trigger bot
                await botService.shouldTriggerBot({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    hasAdminReplied: false
                });

                // Then admin replies
                const promise = botService.handleAdminReply({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId
                });
                promises.push(promise);
            }

            await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / CONCURRENT_USERS;

            console.log(`\n📊 Admin Reply Performance:`);
            console.log(`   Total Replies: ${CONCURRENT_USERS}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time/Reply: ${avgTime.toFixed(2)}ms`);

            // Should be fast (< 50ms average)
            expect(avgTime).toBeLessThan(50);
        }, 30000);
    });

    describe('Bot Reactivation Performance', () => {
        it('should handle bot reactivation efficiently under load', async () => {
            const promises: Promise<any>[] = [];

            // Setup: Create states with admin replies
            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-reactivate-${testUsers[i].id}`;

                // Trigger bot
                await botService.shouldTriggerBot({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    hasAdminReplied: false
                });

                // Admin replies
                await botService.handleAdminReply({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId
                });

                // Send messages up to threshold
                for (let j = 0; j < 5; j++) {
                    await botService.handleUserMessage({
                        chatType: ChatType.LIVE_CHAT,
                        conversationId
                    });
                }
            }

            // Test: Concurrent reactivation checks
            const startTime = Date.now();

            for (let i = 0; i < CONCURRENT_USERS; i++) {
                const conversationId = `load-test-reactivate-${testUsers[i].id}`;
                const promise = botService.shouldTriggerBot({
                    chatType: ChatType.LIVE_CHAT,
                    conversationId,
                    hasAdminReplied: true
                });
                promises.push(promise);
            }

            const results = await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / CONCURRENT_USERS;

            console.log(`\n📊 Bot Reactivation Performance:`);
            console.log(`   Total Reactivations: ${CONCURRENT_USERS}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            // All should reactivate
            const reactivatedCount = results.filter(r => r.shouldSend).length;
            expect(reactivatedCount).toBe(CONCURRENT_USERS);

            // Should be fast (< 100ms average)
            expect(avgTime).toBeLessThan(100);
        }, 60000);
    });

    describe('Memory and Resource Usage', () => {
        it('should not leak memory during sustained load', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const iterations = 100;

            for (let i = 0; i < iterations; i++) {
                const promises: Promise<any>[] = [];

                for (let j = 0; j < 10; j++) {
                    const conversationId = `load-test-memory-${i}-${j}`;
                    const promise = botService.shouldTriggerBot({
                        chatType: ChatType.LIVE_CHAT,
                        conversationId,
                        hasAdminReplied: false
                    });
                    promises.push(promise);
                }

                await Promise.all(promises);
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

            console.log(`\n📊 Memory Usage:`);
            console.log(`   Initial: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Final: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Increase: ${memoryIncreaseMB.toFixed(2)} MB`);

            // Memory increase should be reasonable (< 50MB for 1000 operations)
            expect(memoryIncreaseMB).toBeLessThan(50);
        }, 60000);
    });

    describe('Error Handling Under Load', () => {
        it('should handle errors gracefully under concurrent load', async () => {
            const promises: Promise<any>[] = [];
            let successCount = 0;
            let errorCount = 0;

            // Mix of valid and invalid requests
            for (let i = 0; i < 50; i++) {
                // Valid request
                promises.push(
                    botService.shouldTriggerBot({
                        chatType: ChatType.LIVE_CHAT,
                        conversationId: `load-test-valid-${i}`,
                        hasAdminReplied: false
                    }).then(() => successCount++).catch(() => errorCount++)
                );

                // Invalid chat type (should handle gracefully)
                promises.push(
                    botService.shouldTriggerBot({
                        chatType: 'INVALID' as any,
                        conversationId: `load-test-invalid-${i}`,
                        hasAdminReplied: false
                    }).then(() => successCount++).catch(() => errorCount++)
                );
            }

            await Promise.allSettled(promises);

            console.log(`\n📊 Error Handling:`);
            console.log(`   Success: ${successCount}`);
            console.log(`   Errors: ${errorCount}`);

            // Should handle at least the valid requests
            expect(successCount).toBeGreaterThan(0);
        }, 30000);
    });
});
