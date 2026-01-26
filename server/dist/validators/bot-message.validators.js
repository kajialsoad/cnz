"use strict";
/**
 * Bot Message Validators
 *
 * Input validation for bot message endpoints using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotAnalyticsQuerySchema = exports.getBotMessagesQuerySchema = exports.chatTypeParamSchema = exports.updateTriggerRulesSchema = exports.messageIdParamSchema = exports.updateBotMessageSchema = exports.createBotMessageSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema for creating a bot message
 */
exports.createBotMessageSchema = zod_1.z.object({
    chatType: zod_1.z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }),
    messageKey: zod_1.z.string()
        .min(1, 'Message key is required')
        .max(100, 'Message key must be at most 100 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Message key can only contain letters, numbers, hyphens, and underscores'),
    content: zod_1.z.string()
        .min(1, 'Content is required')
        .max(5000, 'Content must be at most 5000 characters'),
    contentBn: zod_1.z.string()
        .min(1, 'Bangla content is required')
        .max(5000, 'Bangla content must be at most 5000 characters'),
    stepNumber: zod_1.z.number()
        .int('Step number must be an integer')
        .min(1, 'Step number must be at least 1')
        .max(100, 'Step number must be at most 100'),
    displayOrder: zod_1.z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
        .optional()
});
/**
 * Schema for updating a bot message
 */
exports.updateBotMessageSchema = zod_1.z.object({
    content: zod_1.z.string()
        .min(1, 'Content cannot be empty')
        .max(5000, 'Content must be at most 5000 characters')
        .optional(),
    contentBn: zod_1.z.string()
        .min(1, 'Bangla content cannot be empty')
        .max(5000, 'Bangla content must be at most 5000 characters')
        .optional(),
    stepNumber: zod_1.z.number()
        .int('Step number must be an integer')
        .min(1, 'Step number must be at least 1')
        .max(100, 'Step number must be at most 100')
        .optional(),
    isActive: zod_1.z.boolean({
        errorMap: () => ({ message: 'isActive must be a boolean' })
    }).optional(),
    displayOrder: zod_1.z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
        .optional()
});
/**
 * Schema for message ID parameter
 */
exports.messageIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().transform((val, ctx) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: 'Message ID must be a positive integer'
            });
            return zod_1.z.NEVER;
        }
        return num;
    })
});
/**
 * Schema for updating trigger rules
 */
exports.updateTriggerRulesSchema = zod_1.z.object({
    isEnabled: zod_1.z.boolean({
        errorMap: () => ({ message: 'isEnabled must be a boolean' })
    }).optional(),
    reactivationThreshold: zod_1.z.number()
        .int('Reactivation threshold must be an integer')
        .min(1, 'Reactivation threshold must be at least 1')
        .max(100, 'Reactivation threshold must be at most 100')
        .optional(),
    resetStepsOnReactivate: zod_1.z.boolean({
        errorMap: () => ({ message: 'resetStepsOnReactivate must be a boolean' })
    }).optional()
});
/**
 * Schema for chat type parameter
 */
exports.chatTypeParamSchema = zod_1.z.object({
    chatType: zod_1.z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    })
});
/**
 * Schema for bot messages query
 */
exports.getBotMessagesQuerySchema = zod_1.z.object({
    chatType: zod_1.z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }).optional()
});
/**
 * Schema for bot analytics query
 */
exports.getBotAnalyticsQuerySchema = zod_1.z.object({
    chatType: zod_1.z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }).optional(),
    startDate: zod_1.z.string()
        .datetime('Start date must be a valid ISO 8601 date')
        .transform(val => new Date(val))
        .optional(),
    endDate: zod_1.z.string()
        .datetime('End date must be a valid ISO 8601 date')
        .transform(val => new Date(val))
        .optional()
});
