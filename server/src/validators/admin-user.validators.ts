import { z } from 'zod';
import { users_role, UserStatus } from '@prisma/client';
import {
    validateEmail,
    validatePhone,
    validatePasswordStrength,
    sanitizeString,
} from '../middlewares/security.middleware';

/**
 * Admin User Validation Schemas
 * Comprehensive validation for all admin user operations
 * Implements requirements 12.5, 12.6, 12.7, 12.8, 12.9
 */

/**
 * Custom Zod refinements for security validation
 */

// Phone number validation
const phoneValidation = z.string().refine(
    (val) => validatePhone(val),
    { message: 'Invalid Bangladesh phone number format (01XXXXXXXXX)' }
);

// Email validation
const emailValidation = z.string().refine(
    (val) => validateEmail(val),
    { message: 'Invalid email format' }
);

// Password validation
const passwordValidation = z.string().refine(
    (val) => {
        const result = validatePasswordStrength(val);
        return result.isValid;
    },
    {
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
    }
);

// Sanitized string validation
const sanitizedString = (min: number = 1, max: number = 255) =>
    z.string()
        .min(min, `Must be at least ${min} characters`)
        .max(max, `Must be at most ${max} characters`)
        .transform((val) => sanitizeString(val));

/**
 * Create User Schema
 * Validates all required fields for creating a new admin user
 */
export const createAdminUserSchema = z.object({
    firstName: sanitizedString(2, 50),
    lastName: sanitizedString(2, 50),
    phone: phoneValidation,
    email: emailValidation.optional(),
    password: passwordValidation,
    cityCorporationCode: z.string().min(1, 'City Corporation is required'),
    zoneId: z.number().int().positive('Zone ID must be a positive integer').optional(),
    wardId: z.number().int().positive('Ward ID must be a positive integer').optional(),
    role: z.nativeEnum(users_role, {
        errorMap: () => ({ message: 'Invalid role. Must be ADMIN, SUPER_ADMIN, or MASTER_ADMIN' }),
    }).optional(),
    permissions: z.object({
        zones: z.array(z.number().int().positive()).optional(),
        wards: z.array(z.number().int().positive()).optional(),
        categories: z.array(z.string()).optional(),
        features: z.object({
            canViewComplaints: z.boolean().optional(),
            canEditComplaints: z.boolean().optional(),
            canDeleteComplaints: z.boolean().optional(),
            canViewUsers: z.boolean().optional(),
            canEditUsers: z.boolean().optional(),
            canDeleteUsers: z.boolean().optional(),
            canViewMessages: z.boolean().optional(),
            canSendMessages: z.boolean().optional(),
            canViewAnalytics: z.boolean().optional(),
            canExportData: z.boolean().optional(),
        }).optional(),
    }).optional(),
}).strict(); // Reject unknown fields

/**
 * Update User Schema
 * Validates fields for updating an existing admin user
 */
export const updateAdminUserSchema = z.object({
    firstName: sanitizedString(2, 50).optional(),
    lastName: sanitizedString(2, 50).optional(),
    email: emailValidation.optional(),
    phone: phoneValidation.optional(),
    cityCorporationCode: z.string().min(1).optional(),
    zoneId: z.number().int().positive().optional(),
    wardId: z.number().int().positive().optional(),
    role: z.nativeEnum(users_role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: passwordValidation.optional(),
    permissions: z.object({
        zones: z.array(z.number().int().positive()).optional(),
        wards: z.array(z.number().int().positive()).optional(),
        categories: z.array(z.string()).optional(),
        features: z.object({
            canViewComplaints: z.boolean().optional(),
            canEditComplaints: z.boolean().optional(),
            canDeleteComplaints: z.boolean().optional(),
            canViewUsers: z.boolean().optional(),
            canEditUsers: z.boolean().optional(),
            canDeleteUsers: z.boolean().optional(),
            canViewMessages: z.boolean().optional(),
            canSendMessages: z.boolean().optional(),
            canViewAnalytics: z.boolean().optional(),
            canExportData: z.boolean().optional(),
        }).optional(),
    }).optional(),
}).strict();

/**
 * Update User Status Schema
 * Validates status updates
 */
export const updateUserStatusSchema = z.object({
    status: z.nativeEnum(UserStatus, {
        errorMap: () => ({ message: 'Invalid status. Must be ACTIVE, INACTIVE, SUSPENDED, or PENDING' }),
    }),
    reason: sanitizedString(0, 500).optional(),
}).strict();

/**
 * Update User Permissions Schema
 * Validates permission updates
 */
export const updateUserPermissionsSchema = z.object({
    zones: z.array(z.number().int().positive()).optional(),
    wards: z.array(z.number().int().positive()).optional(),
    categories: z.array(z.string().min(1)).optional(),
    features: z.object({
        canViewComplaints: z.boolean().optional(),
        canEditComplaints: z.boolean().optional(),
        canDeleteComplaints: z.boolean().optional(),
        canViewUsers: z.boolean().optional(),
        canEditUsers: z.boolean().optional(),
        canDeleteUsers: z.boolean().optional(),
        canViewMessages: z.boolean().optional(),
        canSendMessages: z.boolean().optional(),
        canViewAnalytics: z.boolean().optional(),
        canExportData: z.boolean().optional(),
    }).optional(),
}).strict();

/**
 * Get Users Query Schema
 * Validates query parameters for listing users
 */
export const getUsersQuerySchema = z.object({
    page: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1))
        .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 20))
        .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    search: sanitizedString(0, 100).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(users_role).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'phone']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: z.string().optional(),
    zoneId: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'Zone ID must be positive' }),
    wardId: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'Ward ID must be positive' }),
});

/**
 * Get Activity Logs Query Schema
 * Validates query parameters for activity logs
 */
export const getActivityLogsQuerySchema = z.object({
    page: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1))
        .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 50))
        .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    userId: z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'User ID must be positive' }),
    action: sanitizedString(0, 50).optional(),
    entityType: sanitizedString(0, 50).optional(),
    startDate: z.string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val.getTime()), { message: 'Invalid start date' }),
    endDate: z.string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val.getTime()), { message: 'Invalid end date' }),
    cityCorporationCode: z.string().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.startDate <= data.endDate;
        }
        return true;
    },
    { message: 'Start date must be before or equal to end date' }
);

/**
 * ID Parameter Schema
 * Validates ID parameters in routes
 */
export const idParamSchema = z.object({
    id: z.string()
        .transform((val) => {
            const num = parseInt(val);
            if (isNaN(num) || num <= 0) {
                throw new Error('Invalid ID format. Must be a positive integer');
            }
            return num;
        }),
});

/**
 * Bulk Operation Schema
 * Validates bulk operations on users
 */
export const bulkOperationSchema = z.object({
    userIds: z.array(z.number().int().positive())
        .min(1, 'At least one user ID is required')
        .max(100, 'Cannot perform bulk operation on more than 100 users at once'),
    operation: z.enum(['activate', 'deactivate', 'delete']),
    reason: sanitizedString(0, 500).optional(),
}).strict();

/**
 * Export Data Schema
 * Validates data export requests
 */
export const exportDataSchema = z.object({
    format: z.enum(['csv', 'json', 'xlsx']),
    filters: z.object({
        role: z.nativeEnum(users_role).optional(),
        status: z.nativeEnum(UserStatus).optional(),
        cityCorporationCode: z.string().optional(),
        zoneId: z.number().int().positive().optional(),
        wardId: z.number().int().positive().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
    }).optional(),
}).strict();

/**
 * Validation helper function
 * Validates data against a schema and returns sanitized result
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            throw new Error(JSON.stringify(errors));
        }
        throw error;
    }
}

/**
 * Async validation helper
 * Validates data asynchronously
 */
export async function validateDataAsync<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: any[] }> {
    try {
        const validated = await schema.parseAsync(data);
        return { success: true, data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            return { success: false, errors };
        }
        return {
            success: false,
            errors: [{ field: 'unknown', message: 'Validation failed' }],
        };
    }
}
