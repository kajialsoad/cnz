/**
 * Bot Message Validators Tests
 * 
 * Comprehensive tests for bot message input validation
 * Tests all validation schemas and edge cases
 */

import { z } from 'zod';
import {
    createBotMessageSchema,
    updateBotMessageSchema,
    messageIdParamSchema,
    updateTriggerRulesSchema,
    chatTypeParamSchema,
    getBotMessagesQuerySchema,
    getBotAnalyticsQuerySchema
} from '../../src/validators/bot-message.validators';

describe('Bot Message Validators', () => {
    describe('createBotMessageSchema', () => {
        it('should validate valid bot message creation data', () => {
            const validData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'welcome-message',
                content: 'Welcome to Clean Care!',
                contentBn: 'ক্লিন কেয়ারে স্বাগতম!',
                stepNumber: 1,
                displayOrder: 0
            };

            const result = createBotMessageSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(validData);
            }
        });

        it('should validate without optional displayOrder', () => {
            const validData = {
                chatType: 'COMPLAINT_CHAT',
                messageKey: 'complaint-received',
                content: 'Your complaint has been received',
                contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid chatType', () => {
            const invalidData = {
                chatType: 'INVALID_TYPE',
                messageKey: 'test',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('LIVE_CHAT or COMPLAINT_CHAT');
            }
        });

        it('should reject empty messageKey', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: '',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('required');
            }
        });

        it('should reject messageKey longer than 100 characters', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'a'.repeat(101),
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('100 characters');
            }
        });

        it('should reject messageKey with invalid characters', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'invalid key!@#',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('letters, numbers, hyphens');
            }
        });

        it('should accept messageKey with valid characters', () => {
            const validKeys = ['test-key', 'test_key', 'testKey123', 'TEST-KEY_123'];

            validKeys.forEach(key => {
                const data = {
                    chatType: 'LIVE_CHAT',
                    messageKey: key,
                    content: 'Test',
                    contentBn: 'টেস্ট',
                    stepNumber: 1
                };

                const result = createBotMessageSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });

        it('should reject empty content', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: '',
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('required');
            }
        });

        it('should reject content longer than 5000 characters', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'a'.repeat(5001),
                contentBn: 'টেস্ট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('5000 characters');
            }
        });

        it('should reject empty contentBn', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'Test',
                contentBn: '',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('required');
            }
        });

        it('should reject non-integer stepNumber', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1.5
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('integer');
            }
        });

        it('should reject stepNumber less than 1', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 0
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at least 1');
            }
        });

        it('should reject stepNumber greater than 100', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 101
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at most 100');
            }
        });

        it('should reject negative displayOrder', () => {
            const invalidData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 1,
                displayOrder: -1
            };

            const result = createBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('non-negative');
            }
        });
    });

    describe('updateBotMessageSchema', () => {
        it('should validate valid update data', () => {
            const validData = {
                content: 'Updated content',
                contentBn: 'আপডেট করা বিষয়বস্তু',
                stepNumber: 2,
                isActive: true,
                displayOrder: 1
            };

            const result = updateBotMessageSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate partial update data', () => {
            const validData = {
                content: 'Updated content'
            };

            const result = updateBotMessageSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate empty object (all fields optional)', () => {
            const result = updateBotMessageSchema.safeParse({});
            expect(result.success).toBe(true);
        });

        it('should reject empty content string', () => {
            const invalidData = {
                content: ''
            };

            const result = updateBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('cannot be empty');
            }
        });

        it('should reject invalid isActive type', () => {
            const invalidData = {
                isActive: 'true' // Should be boolean
            };

            const result = updateBotMessageSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('boolean');
            }
        });
    });

    describe('messageIdParamSchema', () => {
        it('should validate valid message ID', () => {
            const validData = { id: '123' };

            const result = messageIdParamSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe(123);
            }
        });

        it('should reject non-numeric ID', () => {
            const invalidData = { id: 'abc' };

            const result = messageIdParamSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('positive integer');
            }
        });

        it('should reject negative ID', () => {
            const invalidData = { id: '-5' };

            const result = messageIdParamSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('positive integer');
            }
        });

        it('should reject zero ID', () => {
            const invalidData = { id: '0' };

            const result = messageIdParamSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('positive integer');
            }
        });
    });

    describe('updateTriggerRulesSchema', () => {
        it('should validate valid trigger rules', () => {
            const validData = {
                isEnabled: true,
                reactivationThreshold: 5,
                resetStepsOnReactivate: false
            };

            const result = updateTriggerRulesSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate partial trigger rules', () => {
            const validData = {
                isEnabled: false
            };

            const result = updateTriggerRulesSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject non-boolean isEnabled', () => {
            const invalidData = {
                isEnabled: 'true'
            };

            const result = updateTriggerRulesSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('boolean');
            }
        });

        it('should reject reactivationThreshold less than 1', () => {
            const invalidData = {
                reactivationThreshold: 0
            };

            const result = updateTriggerRulesSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at least 1');
            }
        });

        it('should reject reactivationThreshold greater than 100', () => {
            const invalidData = {
                reactivationThreshold: 101
            };

            const result = updateTriggerRulesSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('at most 100');
            }
        });

        it('should reject non-integer reactivationThreshold', () => {
            const invalidData = {
                reactivationThreshold: 5.5
            };

            const result = updateTriggerRulesSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('integer');
            }
        });
    });

    describe('chatTypeParamSchema', () => {
        it('should validate LIVE_CHAT', () => {
            const validData = { chatType: 'LIVE_CHAT' };

            const result = chatTypeParamSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate COMPLAINT_CHAT', () => {
            const validData = { chatType: 'COMPLAINT_CHAT' };

            const result = chatTypeParamSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid chat type', () => {
            const invalidData = { chatType: 'INVALID_CHAT' };

            const result = chatTypeParamSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('LIVE_CHAT or COMPLAINT_CHAT');
            }
        });
    });

    describe('getBotMessagesQuerySchema', () => {
        it('should validate with chatType', () => {
            const validData = { chatType: 'LIVE_CHAT' };

            const result = getBotMessagesQuerySchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should validate without chatType', () => {
            const validData = {};

            const result = getBotMessagesQuerySchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid chatType', () => {
            const invalidData = { chatType: 'INVALID' };

            const result = getBotMessagesQuerySchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('getBotAnalyticsQuerySchema', () => {
        it('should validate with all parameters', () => {
            const validData = {
                chatType: 'LIVE_CHAT',
                startDate: '2024-01-01',
                endDate: '2024-12-31'
            };

            const result = getBotAnalyticsQuerySchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.startDate).toBeInstanceOf(Date);
                expect(result.data.endDate).toBeInstanceOf(Date);
            }
        });

        it('should validate without optional parameters', () => {
            const validData = {};

            const result = getBotAnalyticsQuerySchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should reject invalid date format', () => {
            const invalidData = {
                startDate: 'invalid-date'
            };

            const result = getBotAnalyticsQuerySchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.errors[0].message).toContain('valid date');
            }
        });

        it('should transform valid date strings to Date objects', () => {
            const validData = {
                startDate: '2024-06-15T12:00:00Z',
                endDate: '2024-06-20T12:00:00Z'
            };

            const result = getBotAnalyticsQuerySchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.startDate).toBeInstanceOf(Date);
                expect(result.data.endDate).toBeInstanceOf(Date);
                // Verify dates are parsed correctly (use UTC to avoid timezone issues)
                expect(result.data.startDate?.toISOString()).toContain('2024-06-15');
                expect(result.data.endDate?.toISOString()).toContain('2024-06-20');
            }
        });
    });

    describe('XSS and SQL Injection Prevention', () => {
        it('should accept content with special characters but not execute scripts', () => {
            const dataWithSpecialChars = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test-message',
                content: 'Test <b>bold</b> text',
                contentBn: 'টেস্ট <b>বোল্ড</b> টেক্সট',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(dataWithSpecialChars);
            expect(result.success).toBe(true);
            // Note: Actual XSS sanitization should happen in the controller/service layer
        });

        it('should accept content with SQL-like syntax', () => {
            const dataWithSQL = {
                chatType: 'LIVE_CHAT',
                messageKey: 'test-message',
                content: "Test ' OR '1'='1",
                contentBn: "টেস্ট ' OR '1'='1",
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(dataWithSQL);
            expect(result.success).toBe(true);
            // Note: SQL injection prevention is handled by Prisma ORM
        });
    });

    describe('Edge Cases', () => {
        it('should handle Unicode characters in content', () => {
            const unicodeData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'unicode-test',
                content: 'Test 🎉 emoji and special chars: ñ, ü, ö',
                contentBn: 'বাংলা ইউনিকোড: আ, ই, উ, ঋ',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(unicodeData);
            expect(result.success).toBe(true);
        });

        it('should handle maximum valid stepNumber', () => {
            const maxStepData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'max-step',
                content: 'Test',
                contentBn: 'টেস্ট',
                stepNumber: 100
            };

            const result = createBotMessageSchema.safeParse(maxStepData);
            expect(result.success).toBe(true);
        });

        it('should handle maximum valid content length', () => {
            const maxContentData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'max-content',
                content: 'a'.repeat(5000),
                contentBn: 'ব'.repeat(5000),
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(maxContentData);
            expect(result.success).toBe(true);
        });

        it('should handle whitespace in content', () => {
            const whitespaceData = {
                chatType: 'LIVE_CHAT',
                messageKey: 'whitespace-test',
                content: '   Test with spaces   ',
                contentBn: '   স্পেস সহ টেস্ট   ',
                stepNumber: 1
            };

            const result = createBotMessageSchema.safeParse(whitespaceData);
            expect(result.success).toBe(true);
        });
    });
});
