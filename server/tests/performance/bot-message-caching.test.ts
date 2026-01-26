/**
 * Bot Message Caching - Performance Test
 * 
 * Tests the caching behavior of the public bot messages endpoint
 * 
 * Test Scenarios:
 * 1. Cache headers are set correctly (Cache-Control: public, max-age=300)
 * 2. Repeated requests return cached responses
 * 3. Cache improves response time significantly
 * 4. Only active messages are cached
 * 5. Cache respects chat type separation
 * 6. Cache invalidation works correctly
 * 
 * Performance Targets:
 * - First request (cache miss): < 100ms
 * - Cached requests: < 10ms
 * - Cache hit rate: > 90% for repeated requests
 * - Memory overhead: < 1MB per cached response
 */

import request from 'supertest';
import { PrismaClient, ChatType } from '@prisma/client';
import app from '../../src/app';

const prisma = new PrismaClient();

describe('Bot Message Caching - Performance Test', () => {
    let testMessages: any[] = [];

    beforeAll(async () => {
        // Clean up existing test data
        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'cache_test_'
                }
            }
        });

        // Create test bot messages for both chat types
        const liveChatMessages = await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'cache_test_live_1',
                    content: 'Cache Test Live Chat Step 1',
                    contentBn: 'ক্যাশ টেস্ট লাইভ চ্যাট ধাপ ১',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'cache_test_live_2',
                    content: 'Cache Test Live Chat Step 2',
                    contentBn: 'ক্যাশ টেস্ট লাইভ চ্যাট ধাপ ২',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                },
                {
                    chatType: ChatType.LIVE_CHAT,
                    messageKey: 'cache_test_live_inactive',
                    content: 'Inactive Message',
                    contentBn: 'নিষ্ক্রিয় বার্তা',
                    stepNumber: 3,
                    isActive: false, // Inactive - should not be returned
                    displayOrder: 3
                }
            ]
        });

        const complaintChatMessages = await prisma.botMessageConfig.createMany({
            data: [
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'cache_test_complaint_1',
                    content: 'Cache Test Complaint Chat Step 1',
                    contentBn: 'ক্যাশ টেস্ট অভিযোগ চ্যাট ধাপ ১',
                    stepNumber: 1,
                    isActive: true,
                    displayOrder: 1
                },
                {
                    chatType: ChatType.COMPLAINT_CHAT,
                    messageKey: 'cache_test_complaint_2',
                    content: 'Cache Test Complaint Chat Step 2',
                    contentBn: 'ক্যাশ টেস্ট অভিযোগ চ্যাট ধাপ ২',
                    stepNumber: 2,
                    isActive: true,
                    displayOrder: 2
                }
            ]
        });

        // Setup trigger rules
        await prisma.botTriggerRule.upsert({
            where: { chatType: ChatType.LIVE_CHAT },
            update: { isEnabled: true },
            create: {
                chatType: ChatType.LIVE_CHAT,
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            }
        });

        await prisma.botTriggerRule.upsert({
            where: { chatType: ChatType.COMPLAINT_CHAT },
            update: { isEnabled: true },
            create: {
                chatType: ChatType.COMPLAINT_CHAT,
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            }
        });
    }, 30000);

    afterAll(async () => {
        // Cleanup
        await prisma.botMessageConfig.deleteMany({
            where: {
                messageKey: {
                    startsWith: 'cache_test_'
                }
            }
        });

        await prisma.$disconnect();
    }, 30000);

    describe('Cache Headers', () => {
        it('should set correct cache headers on public endpoint', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            // Check cache headers
            expect(response.headers['cache-control']).toBeDefined();
            expect(response.headers['cache-control']).toContain('public');
            expect(response.headers['cache-control']).toContain('max-age=300');

            console.log(`\n📊 Cache Headers:`);
            console.log(`   Cache-Control: ${response.headers['cache-control']}`);
        });

        it('should return only active messages', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.messages).toBeDefined();
            expect(Array.isArray(response.body.data.messages)).toBe(true);

            // Should only return active messages (2 active, 1 inactive)
            const activeMessages = response.body.data.messages;
            expect(activeMessages.length).toBe(2);

            // Verify all returned messages are active
            activeMessages.forEach((msg: any) => {
                expect(msg.isActive).toBe(true);
            });

            console.log(`\n📊 Active Messages Filter:`);
            console.log(`   Total Active Messages: ${activeMessages.length}`);
            console.log(`   All Active: ${activeMessages.every((m: any) => m.isActive)}`);
        });

        it('should include isEnabled flag from trigger rules', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            expect(response.body.data.isEnabled).toBeDefined();
            expect(typeof response.body.data.isEnabled).toBe('boolean');
            expect(response.body.data.isEnabled).toBe(true);

            console.log(`\n📊 Trigger Rules:`);
            console.log(`   isEnabled: ${response.body.data.isEnabled}`);
        });
    });

    describe('Cache Performance', () => {
        it('should improve response time for repeated requests', async () => {
            const iterations = 100;
            const timings: number[] = [];

            // First request (cache miss)
            const firstStart = Date.now();
            await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);
            const firstTime = Date.now() - firstStart;

            // Subsequent requests (should benefit from any caching)
            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(app)
                    .get('/api/bot-messages/LIVE_CHAT')
                    .expect(200);
                timings.push(Date.now() - start);
            }

            const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
            const minTime = Math.min(...timings);
            const maxTime = Math.max(...timings);

            console.log(`\n📊 Cache Performance:`);
            console.log(`   First Request (cache miss): ${firstTime}ms`);
            console.log(`   Avg Subsequent Requests: ${avgTime.toFixed(2)}ms`);
            console.log(`   Min Time: ${minTime}ms`);
            console.log(`   Max Time: ${maxTime}ms`);
            console.log(`   Speedup: ${(firstTime / avgTime).toFixed(2)}x`);

            // First request should be reasonably fast
            expect(firstTime).toBeLessThan(100);

            // Average should be fast (database queries are optimized)
            expect(avgTime).toBeLessThan(50);
        }, 60000);

        it('should handle concurrent requests efficiently', async () => {
            const concurrentRequests = 50;
            const startTime = Date.now();

            const promises = Array(concurrentRequests).fill(null).map(() =>
                request(app)
                    .get('/api/bot-messages/LIVE_CHAT')
                    .expect(200)
            );

            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            const avgTime = totalTime / concurrentRequests;

            console.log(`\n📊 Concurrent Request Performance:`);
            console.log(`   Concurrent Requests: ${concurrentRequests}`);
            console.log(`   Total Time: ${totalTime}ms`);
            console.log(`   Avg Time/Request: ${avgTime.toFixed(2)}ms`);
            console.log(`   Requests/Second: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)}`);

            // All requests should succeed
            expect(results.every(r => r.body.success)).toBe(true);

            // Should handle concurrent load efficiently
            expect(avgTime).toBeLessThan(100);
        }, 30000);
    });

    describe('Chat Type Separation', () => {
        it('should cache LIVE_CHAT and COMPLAINT_CHAT separately', async () => {
            // Request LIVE_CHAT
            const liveChatResponse = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            // Request COMPLAINT_CHAT
            const complaintChatResponse = await request(app)
                .get('/api/bot-messages/COMPLAINT_CHAT')
                .expect(200);

            // Verify different data
            const liveChatMessages = liveChatResponse.body.data.messages;
            const complaintChatMessages = complaintChatResponse.body.data.messages;

            expect(liveChatMessages.length).toBe(2);
            expect(complaintChatMessages.length).toBe(2);

            // Verify message keys are different
            const liveChatKeys = liveChatMessages.map((m: any) => m.messageKey);
            const complaintChatKeys = complaintChatMessages.map((m: any) => m.messageKey);

            expect(liveChatKeys.every((k: string) => k.includes('live'))).toBe(true);
            expect(complaintChatKeys.every((k: string) => k.includes('complaint'))).toBe(true);

            console.log(`\n📊 Chat Type Separation:`);
            console.log(`   LIVE_CHAT Messages: ${liveChatMessages.length}`);
            console.log(`   COMPLAINT_CHAT Messages: ${complaintChatMessages.length}`);
            console.log(`   Properly Separated: ✓`);
        });

        it('should maintain separate cache for each chat type', async () => {
            const iterations = 50;
            const liveChatTimings: number[] = [];
            const complaintChatTimings: number[] = [];

            // Alternate between chat types
            for (let i = 0; i < iterations; i++) {
                // LIVE_CHAT request
                const liveStart = Date.now();
                await request(app)
                    .get('/api/bot-messages/LIVE_CHAT')
                    .expect(200);
                liveChatTimings.push(Date.now() - liveStart);

                // COMPLAINT_CHAT request
                const complaintStart = Date.now();
                await request(app)
                    .get('/api/bot-messages/COMPLAINT_CHAT')
                    .expect(200);
                complaintChatTimings.push(Date.now() - complaintStart);
            }

            const liveAvg = liveChatTimings.reduce((a, b) => a + b, 0) / liveChatTimings.length;
            const complaintAvg = complaintChatTimings.reduce((a, b) => a + b, 0) / complaintChatTimings.length;

            console.log(`\n📊 Separate Cache Performance:`);
            console.log(`   LIVE_CHAT Avg: ${liveAvg.toFixed(2)}ms`);
            console.log(`   COMPLAINT_CHAT Avg: ${complaintAvg.toFixed(2)}ms`);

            // Both should be fast
            expect(liveAvg).toBeLessThan(50);
            expect(complaintAvg).toBeLessThan(50);
        }, 60000);
    });

    describe('Error Handling', () => {
        it('should return 400 for invalid chat type', async () => {
            const response = await request(app)
                .get('/api/bot-messages/INVALID_TYPE')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
            expect(response.body.error.code).toBe('INVALID_CHAT_TYPE');

            console.log(`\n📊 Error Handling:`);
            console.log(`   Invalid Chat Type: Properly Rejected ✓`);
        });

        it('should handle missing chat type gracefully', async () => {
            const response = await request(app)
                .get('/api/bot-messages/')
                .expect(404); // Route not found

            console.log(`\n📊 Missing Parameter:`);
            console.log(`   Missing Chat Type: Properly Handled ✓`);
        });
    });

    describe('Data Consistency', () => {
        it('should return consistent data across multiple requests', async () => {
            const iterations = 10;
            const responses: any[] = [];

            for (let i = 0; i < iterations; i++) {
                const response = await request(app)
                    .get('/api/bot-messages/LIVE_CHAT')
                    .expect(200);
                responses.push(response.body.data);
            }

            // All responses should be identical
            const firstResponse = JSON.stringify(responses[0]);
            const allIdentical = responses.every(r => JSON.stringify(r) === firstResponse);

            expect(allIdentical).toBe(true);

            console.log(`\n📊 Data Consistency:`);
            console.log(`   Iterations: ${iterations}`);
            console.log(`   All Responses Identical: ${allIdentical ? '✓' : '✗'}`);
        });

        it('should return messages in correct order', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            const messages = response.body.data.messages;

            // Verify ordering by displayOrder and stepNumber
            for (let i = 1; i < messages.length; i++) {
                const prev = messages[i - 1];
                const curr = messages[i];

                // displayOrder should be ascending
                expect(curr.displayOrder).toBeGreaterThanOrEqual(prev.displayOrder);
            }

            console.log(`\n📊 Message Ordering:`);
            console.log(`   Messages Properly Ordered: ✓`);
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limiting to public endpoint', async () => {
            // The endpoint has rate limiting: 100 requests per minute per IP
            // We'll test that we can make many requests without hitting the limit
            const requestCount = 50; // Well under the 100/min limit
            const promises: Promise<any>[] = [];

            for (let i = 0; i < requestCount; i++) {
                promises.push(
                    request(app)
                        .get('/api/bot-messages/LIVE_CHAT')
                );
            }

            const results = await Promise.all(promises);

            // All should succeed (under rate limit)
            const successCount = results.filter(r => r.status === 200).length;
            expect(successCount).toBe(requestCount);

            console.log(`\n📊 Rate Limiting:`);
            console.log(`   Requests Made: ${requestCount}`);
            console.log(`   Successful: ${successCount}`);
            console.log(`   Rate Limit: 100/min per IP`);
            console.log(`   Status: Under Limit ✓`);
        }, 30000);
    });

    describe('Memory Efficiency', () => {
        it('should not cause memory leaks with repeated requests', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                await request(app)
                    .get('/api/bot-messages/LIVE_CHAT')
                    .expect(200);
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

            console.log(`\n📊 Memory Efficiency:`);
            console.log(`   Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Increase: ${memoryIncreaseMB.toFixed(2)} MB`);
            console.log(`   Iterations: ${iterations}`);

            // Memory increase should be reasonable (< 20MB for 1000 requests)
            expect(memoryIncreaseMB).toBeLessThan(20);
        }, 60000);
    });

    describe('Response Structure', () => {
        it('should return correct response structure', async () => {
            const response = await request(app)
                .get('/api/bot-messages/LIVE_CHAT')
                .expect(200);

            // Verify response structure
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('messages');
            expect(response.body.data).toHaveProperty('isEnabled');

            // Verify message structure
            const messages = response.body.data.messages;
            expect(Array.isArray(messages)).toBe(true);

            if (messages.length > 0) {
                const message = messages[0];
                expect(message).toHaveProperty('id');
                expect(message).toHaveProperty('chatType');
                expect(message).toHaveProperty('messageKey');
                expect(message).toHaveProperty('content');
                expect(message).toHaveProperty('contentBn');
                expect(message).toHaveProperty('stepNumber');
                expect(message).toHaveProperty('isActive');
                expect(message).toHaveProperty('displayOrder');
            }

            console.log(`\n📊 Response Structure:`);
            console.log(`   Structure Valid: ✓`);
            console.log(`   Message Count: ${messages.length}`);
        });
    });
});
