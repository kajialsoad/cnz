/**
 * Bot Message Validators
 * 
 * Input validation for bot message endpoints using Zod
 */

import { z } from 'zod';

/**
 * Schema for creating a bot message
 */
export const createBotMessageSchema = z.object({
    chatType: z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }),
    messageKey: z.string()
        .min(1, 'Message key is required')
        .max(100, 'Message key must be at most 100 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Message key can only contain letters, numbers, hyphens, and underscores'),
    content: z.string()
        .min(1, 'Content is required')
        .max(5000, 'Content must be at most 5000 characters'),
    contentBn: z.string()
        .min(1, 'Bangla content is required')
        .max(5000, 'Bangla content must be at most 5000 characters'),
    stepNumber: z.number()
        .int('Step number must be an integer')
        .min(1, 'Step number must be at least 1')
        .max(100, 'Step number must be at most 100'),
    displayOrder: z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
        .optional()
});

/**
 * Schema for updating a bot message
 */
export const updateBotMessageSchema = z.object({
    content: z.string()
        .min(1, 'Content cannot be empty')
        .max(5000, 'Content must be at most 5000 characters')
        .optional(),
    contentBn: z.string()
        .min(1, 'Bangla content cannot be empty')
        .max(5000, 'Bangla content must be at most 5000 characters')
        .optional(),
    stepNumber: z.number()
        .int('Step number must be an integer')
        .min(1, 'Step number must be at least 1')
        .max(100, 'Step number must be at most 100')
        .optional(),
    isActive: z.boolean({
        errorMap: () => ({ message: 'isActive must be a boolean' })
    }).optional(),
    displayOrder: z.number()
        .int('Display order must be an integer')
        .min(0, 'Display order must be non-negative')
        .optional()
});

/**
 * Schema for message ID parameter
 */
export const messageIdParamSchema = z.object({
    id: z.string().transform((val, ctx) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Message ID must be a positive integer'
            });
            return z.NEVER;
        }
        return num;
    })
});

/**
 * Schema for updating trigger rules
 */
export const updateTriggerRulesSchema = z.object({
    isEnabled: z.boolean({
        errorMap: () => ({ message: 'isEnabled must be a boolean' })
    }).optional(),
    reactivationThreshold: z.number()
        .int('Reactivation threshold must be an integer')
        .min(1, 'Reactivation threshold must be at least 1')
        .max(100, 'Reactivation threshold must be at most 100')
        .optional(),
    resetStepsOnReactivate: z.boolean({
        errorMap: () => ({ message: 'resetStepsOnReactivate must be a boolean' })
    }).optional()
});

/**
 * Schema for chat type parameter
 */
export const chatTypeParamSchema = z.object({
    chatType: z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    })
});

/**
 * Schema for bot messages query
 */
export const getBotMessagesQuerySchema = z.object({
    chatType: z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }).optional()
});

/**
 * Schema for bot analytics query
 */
export const getBotAnalyticsQuerySchema = z.object({
    chatType: z.enum(['LIVE_CHAT', 'COMPLAINT_CHAT'], {
        errorMap: () => ({ message: 'Chat type must be either LIVE_CHAT or COMPLAINT_CHAT' })
    }).optional(),
    startDate: z.string()
        .refine((val) => !isNaN(Date.parse(val)), 'Start date must be a valid date')
        .transform(val => new Date(val))
        .optional(),
    endDate: z.string()
        .refine((val) => !isNaN(Date.parse(val)), 'End date must be a valid date')
        .transform(val => new Date(val))
        .optional()
});
