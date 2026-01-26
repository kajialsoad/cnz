/**
 * Bot Message System - Database Query Performance Test
 * 
 * Tests the performance of individual database queries used by the bot system
 * 
 * Test Coverage:
 * 1. BotMessageConfig queries (findFirst, findMany, create, update, delete)
 * 2. BotConversationState queries (findUnique, create, update)
 * 3. BotTriggerRule queries (findUnique, upsert)
 * 4. BotMessageAnalytics queries (findFirst, create, update)
 * 5. Complex queries with joins and filters
 * 6. Index effectiveness
 * 7. Query optimization opportunities
 * 
 * Performance Targets:
 * - Simple queries (findUnique, findFirst): < 5ms
 * - List queries (findMany): < 10ms
 * - Write operations (create, update): < 10ms
 * - Complex queries with filters: < 20ms
 * - Bulk operations: < 50ms
 */

import { PrismaClient, ChatType } from '@prisma/client';

const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
    ],
});

describe('Bot Message System - Database Query Performance', () => {
    let testCityCorp: any;
    let testZone: any;
    let testWard: any;
    let testUser: any;
    let queryTimes: number[] = [];

    // Query performance tracking
    beforeAll(() => {
        // @ts-ignore
        prisma.$on('query', (e: any) => {
            queryTimes.push(e.duration);
        });
    });

    beforeEach(async () => {
        queryTimes = [];

        // Create minimal test data
        testCityCorp = await prisma.cityCorporation.create({
            data: {
                code: 'PERF_TEST',
                name: 'Performance Test Corp',
                status: 'ACTIVE',
                minWard: 1,
                maxWard: 100
            }
        });

        testZone = await prisma.zone.create({
            data: {
                number: 8888,
                name: 'Performance Test Zone',
                cityCorporation: {
                    connect: { code: testCityCorp.code }
                },
                status: 'ACTIVE'
            }
        });

        testWard = await prisma.ward.create({
            data: {
                wardNumber: 8888,
                number: 8888,
                zone: {
                    connect: { id: testZone.id }
                },
                cityCorporationId: testCityCorp.id,
                status: 'ACTIVE'
            }
        });

        testUser = await prisma.user.create({
            data: {
                firstName: 'Perf',
                lastName: 'Test',
                phone: `+880178888${Date.now().toString().slice(-4)}`,
                email: `perftest${Date.now()}@test.com`,
                passwordHash: 'hashedpassword',
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wardId: testWard.id,
                zoneId: testZone.id,
                cityCorporationCode: testCityCorp.code
            }
        });
    });

    afterEach(async () => {
        // Cleanup
        await prisma.botConversationState.deleteMany({
            where: {
                conversationId: {
                    startsWith: 'perf-test-'
                }
            }
        });

        await prisma.botMessageAnalytics.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'perf_test_'
                }
            }
        });

        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'perf_test_'
                }
            }
        });

        await prisma.user.delete({ where: { id: testUser.id } });
        await prisma.ward.delete({ where: { id: testWard.id } });
        await prisma.zone.delete({ where: { id: testZone.id } });
        await prisma.cityCorporation.delete({ where: { code: testCityCorp.code } });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('BotMessageConfig Queries', () => {
        it('should retrieve bot message by step efficiently (findFirst)', async () => {
            // Setup
            await prisma.botMessageConfig.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'perf_test_step_1',
                    content: 'Test Message',
                    contentBn: 'টেস্ট মেসেজ',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                }
            });

            queryTimes = [];
            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageConfig.findFirst({
                    where: {
                        chatType: ChatType.LIVE_CHAT,
                        stepNumber: 1,
                        isActive: true
                    },
                    orderBy: {
                        displayOrder: 'asc'
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;
            const avgQueryTime = queryTimes.length > 0
                ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length
                : 0;

            console.log(`\n📊 BotMessageConfig.findFirst Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);
            console.log(`   Avg Query Time: ${avgQueryTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(5);
        });

        it('should retrieve all bot messages efficiently (findMany)', async () => {
            // Setup - create multiple messages
            await prisma.botMessageConfig.createMany({
                data: [
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'perf_test_step_1',
                        content: 'Test 1',
                        contentBn: 'টেস্ট ১',
                        stepNumber: 1,
                        isActive: true,
                        displayOrder: 1
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'perf_test_step_2',
                        content: 'Test 2',
                        contentBn: 'টেস্ট ২',
                        stepNumber: 2,
                        isActive: true,
                        displayOrder: 2
                    },
                    {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'perf_test_step_3',
                        content: 'Test 3',
                        contentBn: 'টেস্ট ৩',
                        stepNumber: 3,
                        isActive: true,
                        displayOrder: 3
                    }
                ]
            });

            queryTimes = [];
            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageConfig.findMany({
                    where: { chatType: ChatType.LIVE_CHAT },
                    orderBy: [
                        { displayOrder: 'asc' },
                        { stepNumber: 'asc' }
                    ]
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotMessageConfig.findMany Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });

        it('should create bot messages efficiently', async () => {
            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageConfig.create({
                    data: {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: `perf_test_create_${i}`,
                        content: `Test ${i}`,
                        contentBn: `টেস্ট ${i}`,
                        stepNumber: i + 1,
                        isActive: true,
                        displayOrder: i + 1
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotMessageConfig.create Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });

        it('should update bot messages efficiently', async () => {
            // Setup
            const message = await prisma.botMessageConfig.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'perf_test_update',
                    content: 'Original',
                    contentBn: 'মূল',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                }
            });

            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageConfig.update({
                    where: { id: message.id },
                    data: {
                        content: `Updated ${i}`,
                        contentBn: `আপডেট ${i}`
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotMessageConfig.update Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });
    });

    describe('BotConversationState Queries', () => {
        it('should retrieve conversation state efficiently (findUnique)', async () => {
            // Setup
            await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId: 'perf-test-conv-1',
                    currentStep: 1,
                    isActive: true,
                    userMessageCount: 0
                }
            });

            queryTimes = [];
            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botConversationState.findUnique({
                    where: {
                        chatType_conversationId: {
                            chatType: ChatType.LIVE_CHAT,
                            conversationId: 'perf-test-conv-1'
                        }
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotConversationState.findUnique Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(5);
        });

        it('should create conversation states efficiently', async () => {
            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botConversationState.create({
                    data: {
                        chatType: ChatType.LIVE_CHAT,
                        conversationId: `perf-test-conv-create-${i}`,
                        currentStep: 0,
                        isActive: true,
                        userMessageCount: 0
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotConversationState.create Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });

        it('should update conversation states efficiently', async () => {
            // Setup
            const state = await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId: 'perf-test-conv-update',
                    currentStep: 0,
                    isActive: true,
                    userMessageCount: 0
                }
            });

            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botConversationState.update({
                    where: { id: state.id },
                    data: {
                        currentStep: i + 1,
                        userMessageCount: i
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotConversationState.update Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });

        it('should handle concurrent state updates without race conditions', async () => {
            // Setup
            const state = await prisma.botConversationState.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    conversationId: 'perf-test-conv-concurrent',
                    currentStep: 0,
                    isActive: true,
                    userMessageCount: 0
                }
            });

            const concurrentUpdates = 20;
            const startTime = Date.now();
            const promises: Promise<any>[] = [];

            for (let i = 0; i < concurrentUpdates; i++) {
                promises.push(
                    prisma.botConversationState.update({
                        where: { id: state.id },
                        data: {
                            userMessageCount: {
                                increment: 1
                            }
                        }
                    })
                );
            }

            await Promise.all(promises);
            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Verify final count
            const finalState = await prisma.botConversationState.findUnique({
                where: { id: state.id }
            });

            console.log(`\n📊 Concurrent State Updates Performance:`);
            console.log(`   Concurrent Updates: ${concurrentUpdates}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Final Count: ${finalState?.userMessageCount}`);

            expect(finalState?.userMessageCount).toBe(concurrentUpdates);
            expect(totalTime).toBeLessThan(500);
        });
    });

    describe('BotTriggerRule Queries', () => {
        it('should retrieve trigger rules efficiently (findUnique)', async () => {
            // Setup
            await prisma.botTriggerRule.upsert({
                where: { chatType: ChatType.LIVE_CHAT },
                update: {},
                create: {
                    chatType: ChatType.LIVE_CHAT,
                    isEnabled: true,
                    reactivationThreshold: 5,
                    resetStepsOnReactivate: false
                }
            });

            queryTimes = [];
            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botTriggerRule.findUnique({
                    where: { chatType: ChatType.LIVE_CHAT }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotTriggerRule.findUnique Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(5);
        });

        it('should upsert trigger rules efficiently', async () => {
            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botTriggerRule.upsert({
                    where: { chatType: ChatType.LIVE_CHAT },
                    update: {
                        reactivationThreshold: i + 1
                    },
                    create: {
                        chatType: ChatType.LIVE_CHAT,
                        isEnabled: true,
                        reactivationThreshold: i + 1,
                        resetStepsOnReactivate: false
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotTriggerRule.upsert Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(15);
        });
    });

    describe('BotMessageAnalytics Queries', () => {
        it('should find analytics records efficiently (findFirst)', async () => {
            // Setup
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await prisma.botMessageAnalytics.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'perf_test_analytics',
                    stepNumber: 1,
                    triggerCount: 10,
                    adminReplyCount: 5,
                    date: today
                }
            });

            queryTimes = [];
            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageAnalytics.findFirst({
                    where: {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: 'perf_test_analytics',
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotMessageAnalytics.findFirst Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(10);
        });

        it('should retrieve analytics with date range efficiently (findMany)', async () => {
            // Setup - create analytics for multiple days
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);

                await prisma.botMessageAnalytics.create({
                    data: {
                        chatType: ChatType.LIVE_CHAT,
                        messageKey: `perf_test_analytics_${i}`,
                        stepNumber: 1,
                        triggerCount: 10 + i,
                        adminReplyCount: 5 + i,
                        date
                    }
                });
            }

            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);

            queryTimes = [];
            const iterations = 50;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageAnalytics.findMany({
                    where: {
                        chatType: ChatType.LIVE_CHAT,
                        date: {
                            gte: startDate,
                            lte: today
                        }
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            console.log(`\n📊 BotMessageAnalytics.findMany (date range) Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);

            expect(avgTime).toBeLessThan(20);
        });

        it('should update analytics efficiently (increment)', async () => {
            // Setup
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const analytics = await prisma.botMessageAnalytics.create({
                data: {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'perf_test_analytics_update',
                    stepNumber: 1,
                    triggerCount: 0,
                    adminReplyCount: 0,
                    date: today
                }
            });

            const iterations = 100;
            const startTime = Date.now();

            for (let i = 0; i < iterations; i++) {
                await prisma.botMessageAnalytics.update({
                    where: { id: analytics.id },
                    data: {
                        triggerCount: {
                            increment: 1
                        }
                    }
                });
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            // Verify final count
            const finalAnalytics = await prisma.botMessageAnalytics.findUnique({
                where: { id: analytics.id }
            });

            console.log(`\n📊 BotMessageAnalytics.update (increment) Performance:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time: ${avgTime.toFixed(2)}ms`);
            console.log(`   Final Count: ${finalAnalytics?.triggerCount}`);

            expect(finalAnalytics?.triggerCount).toBe(iterations);
            expect(avgTime).toBeLessThan(10);
        });
    });

    describe('Index Effectiveness', () => {
        it('should use indexes for BotMessageConfig queries', async () => {
            // Create multiple messages
            await prisma.botMessageConfig.createMany({
                data: Array.from({ length: 20 }, (_, i) => ({
                    chatType: i % 2 === 0 ? ChatType.LIVE_CHAT : ChatType.COMPLAINT_CHAT,
                    messageKey: `perf_test_index_${i}`,
                    content: `Test ${i}`,
                    contentBn: `টেস্ট ${i}`,
                    stepNumber: (i % 5) + 1,
                    isActive: i % 3 !== 0,
                    displayOrder: i + 1
                }))
            });

            queryTimes = [];
            const startTime = Date.now();

            // Query with indexed fields
            await prisma.botMessageConfig.findMany({
                where: {
                    chatType: ChatType.LIVE_CHAT,
                    isActive: true
                },
                orderBy: {
                    displayOrder: 'asc'
                }
            });

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            console.log(`\n📊 Index Effectiveness (BotMessageConfig):`);
            console.log(`   Query Time: ${queryTime}ms`);

            // Should be very fast with proper indexes
            expect(queryTime).toBeLessThan(10);
        });

        it('should use indexes for BotConversationState queries', async () => {
            // Create multiple states
            await Promise.all(
                Array.from({ length: 20 }, (_, i) =>
                    prisma.botConversationState.create({
                        data: {
                            chatType: i % 2 === 0 ? ChatType.LIVE_CHAT : ChatType.COMPLAINT_CHAT,
                            conversationId: `perf-test-index-${i}`,
                            currentStep: i % 5,
                            isActive: i % 3 !== 0,
                            userMessageCount: i
                        }
                    })
                )
            );

            queryTimes = [];
            const startTime = Date.now();

            // Query with indexed fields
            await prisma.botConversationState.findMany({
                where: {
                    chatType: ChatType.LIVE_CHAT,
                    isActive: true
                }
            });

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            console.log(`\n📊 Index Effectiveness (BotConversationState):`);
            console.log(`   Query Time: ${queryTime}ms`);

            // Should be very fast with proper indexes
            expect(queryTime).toBeLessThan(10);
        });
    });

    describe('Bulk Operations', () => {
        it('should handle bulk message creation efficiently', async () => {
            const bulkSize = 50;
            const startTime = Date.now();

            await prisma.botMessageConfig.createMany({
                data: Array.from({ length: bulkSize }, (_, i) => ({
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: `perf_test_bulk_${i}`,
                    content: `Bulk Test ${i}`,
                    contentBn: `বাল্ক টেস্ট ${i}`,
                    stepNumber: i + 1,
                    isActive: true,
                    displayOrder: i + 1
                }))
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            console.log(`\n📊 Bulk Create Performance:`);
            console.log(`   Records: ${bulkSize}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time/Record: ${(totalTime / bulkSize).toFixed(2)}ms`);

            expect(totalTime).toBeLessThan(200);
        });

        it('should handle bulk state deletion efficiently', async () => {
            // Setup - create multiple states
            const bulkSize = 50;
            await Promise.all(
                Array.from({ length: bulkSize }, (_, i) =>
                    prisma.botConversationState.create({
                        data: {
                            chatType: ChatType.LIVE_CHAT,
                            conversationId: `perf-test-bulk-delete-${i}`,
                            currentStep: 0,
                            isActive: true,
                            userMessageCount: 0
                        }
                    })
                )
            );

            const startTime = Date.now();

            await prisma.botConversationState.deleteMany({
                where: {
                    conversationId: {
                        startsWith: 'perf-test-bulk-delete-'
                    }
                }
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            console.log(`\n📊 Bulk Delete Performance:`);
            console.log(`   Records: ${bulkSize}`);
            console.log(`   Total Time: ${totalTime}ms`);

            expect(totalTime).toBeLessThan(100);
        });
    });

    describe('Query Optimization Opportunities', () => {
        it('should identify slow queries', async () => {
            // Create test data
            await prisma.botMessageConfig.createMany({
                data: Array.from({ length: 10 }, (_, i) => ({
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: `perf_test_slow_${i}`,
                    content: `Test ${i}`,
                    contentBn: `টেস্ট ${i}`,
                    stepNumber: i + 1,
                    isActive: true,
                    displayOrder: i + 1
                }))
            });

            queryTimes = [];

            // Run various queries
            await prisma.botMessageConfig.findMany({
                where: { chatType: ChatType.LIVE_CHAT }
            });

            await prisma.botMessageConfig.findFirst({
                where: {
                    chatType: ChatType.LIVE_CHAT,
                    stepNumber: 1,
                    isActive: true
                }
            });

            await prisma.botConversationState.findMany({
                where: { chatType: ChatType.LIVE_CHAT }
            });

            // Analyze query times
            const slowQueries = queryTimes.filter(t => t > 10);
            const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;

            console.log(`\n📊 Query Analysis:`);
            console.log(`   Total Queries: ${queryTimes.length}`);
            console.log(`   Avg Query Time: ${avgQueryTime.toFixed(2)}ms`);
            console.log(`   Slow Queries (>10ms): ${slowQueries.length}`);
            console.log(`   Slowest Query: ${Math.max(...queryTimes).toFixed(2)}ms`);

            // Most queries should be fast
            expect(slowQueries.length).toBeLessThan(queryTimes.length * 0.2);
        });
    });
});
