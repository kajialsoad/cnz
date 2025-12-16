"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportDataSchema = exports.bulkOperationSchema = exports.idParamSchema = exports.getActivityLogsQuerySchema = exports.getUsersQuerySchema = exports.updateUserPermissionsSchema = exports.updateUserStatusSchema = exports.updateAdminUserSchema = exports.createAdminUserSchema = void 0;
exports.validateData = validateData;
exports.validateDataAsync = validateDataAsync;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const security_middleware_1 = require("../middlewares/security.middleware");
/**
 * Admin User Validation Schemas
 * Comprehensive validation for all admin user operations
 * Implements requirements 12.5, 12.6, 12.7, 12.8, 12.9
 */
/**
 * Custom Zod refinements for security validation
 */
// Phone number validation
const phoneValidation = zod_1.z.string().refine((val) => (0, security_middleware_1.validatePhone)(val), { message: 'Invalid Bangladesh phone number format (01XXXXXXXXX)' });
// Email validation
const emailValidation = zod_1.z.string().refine((val) => (0, security_middleware_1.validateEmail)(val), { message: 'Invalid email format' });
// Password validation
const passwordValidation = zod_1.z.string().refine((val) => {
    const result = (0, security_middleware_1.validatePasswordStrength)(val);
    return result.isValid;
}, {
    message: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
});
// Sanitized string validation
const sanitizedString = (min = 1, max = 255) => zod_1.z.string()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`)
    .transform((val) => (0, security_middleware_1.sanitizeString)(val));
/**
 * Create User Schema
 * Validates all required fields for creating a new admin user
 */
exports.createAdminUserSchema = zod_1.z.object({
    firstName: sanitizedString(2, 50),
    lastName: sanitizedString(2, 50),
    phone: phoneValidation,
    email: emailValidation.optional(),
    password: passwordValidation,
    cityCorporationCode: zod_1.z.string().min(1, 'City Corporation is required'),
    zoneId: zod_1.z.number().int().positive('Zone ID must be a positive integer').optional(),
    wardId: zod_1.z.number().int().positive('Ward ID must be a positive integer').optional(),
    role: zod_1.z.nativeEnum(client_1.users_role, {
        errorMap: () => ({ message: 'Invalid role. Must be ADMIN, SUPER_ADMIN, or MASTER_ADMIN' }),
    }).optional(),
    permissions: zod_1.z.object({
        zones: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        wards: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
        features: zod_1.z.object({
            canViewComplaints: zod_1.z.boolean().optional(),
            canEditComplaints: zod_1.z.boolean().optional(),
            canDeleteComplaints: zod_1.z.boolean().optional(),
            canViewUsers: zod_1.z.boolean().optional(),
            canEditUsers: zod_1.z.boolean().optional(),
            canDeleteUsers: zod_1.z.boolean().optional(),
            canViewMessages: zod_1.z.boolean().optional(),
            canSendMessages: zod_1.z.boolean().optional(),
            canViewAnalytics: zod_1.z.boolean().optional(),
            canExportData: zod_1.z.boolean().optional(),
        }).optional(),
    }).optional(),
}).strict(); // Reject unknown fields
/**
 * Update User Schema
 * Validates fields for updating an existing admin user
 */
exports.updateAdminUserSchema = zod_1.z.object({
    firstName: sanitizedString(2, 50).optional(),
    lastName: sanitizedString(2, 50).optional(),
    email: emailValidation.optional(),
    phone: phoneValidation.optional(),
    cityCorporationCode: zod_1.z.string().min(1).optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    password: passwordValidation.optional(),
    permissions: zod_1.z.object({
        zones: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        wards: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
        categories: zod_1.z.array(zod_1.z.string()).optional(),
        features: zod_1.z.object({
            canViewComplaints: zod_1.z.boolean().optional(),
            canEditComplaints: zod_1.z.boolean().optional(),
            canDeleteComplaints: zod_1.z.boolean().optional(),
            canViewUsers: zod_1.z.boolean().optional(),
            canEditUsers: zod_1.z.boolean().optional(),
            canDeleteUsers: zod_1.z.boolean().optional(),
            canViewMessages: zod_1.z.boolean().optional(),
            canSendMessages: zod_1.z.boolean().optional(),
            canViewAnalytics: zod_1.z.boolean().optional(),
            canExportData: zod_1.z.boolean().optional(),
        }).optional(),
    }).optional(),
}).strict();
/**
 * Update User Status Schema
 * Validates status updates
 */
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus, {
        errorMap: () => ({ message: 'Invalid status. Must be ACTIVE, INACTIVE, SUSPENDED, or PENDING' }),
    }),
    reason: sanitizedString(0, 500).optional(),
}).strict();
/**
 * Update User Permissions Schema
 * Validates permission updates
 */
exports.updateUserPermissionsSchema = zod_1.z.object({
    zones: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    wards: zod_1.z.array(zod_1.z.number().int().positive()).optional(),
    categories: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    features: zod_1.z.object({
        canViewComplaints: zod_1.z.boolean().optional(),
        canEditComplaints: zod_1.z.boolean().optional(),
        canDeleteComplaints: zod_1.z.boolean().optional(),
        canViewUsers: zod_1.z.boolean().optional(),
        canEditUsers: zod_1.z.boolean().optional(),
        canDeleteUsers: zod_1.z.boolean().optional(),
        canViewMessages: zod_1.z.boolean().optional(),
        canSendMessages: zod_1.z.boolean().optional(),
        canViewAnalytics: zod_1.z.boolean().optional(),
        canExportData: zod_1.z.boolean().optional(),
    }).optional(),
}).strict();
/**
 * Get Users Query Schema
 * Validates query parameters for listing users
 */
exports.getUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1))
        .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 20))
        .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    search: sanitizedString(0, 100).optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'phone']).optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: zod_1.z.string().optional(),
    zoneId: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'Zone ID must be positive' }),
    wardId: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'Ward ID must be positive' }),
});
/**
 * Get Activity Logs Query Schema
 * Validates query parameters for activity logs
 */
exports.getActivityLogsQuerySchema = zod_1.z.object({
    page: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1))
        .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 50))
        .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    userId: zod_1.z.string()
        .optional()
        .transform((val) => (val ? parseInt(val) : undefined))
        .refine((val) => val === undefined || val > 0, { message: 'User ID must be positive' }),
    action: sanitizedString(0, 50).optional(),
    entityType: sanitizedString(0, 50).optional(),
    startDate: zod_1.z.string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val.getTime()), { message: 'Invalid start date' }),
    endDate: zod_1.z.string()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined))
        .refine((val) => val === undefined || !isNaN(val.getTime()), { message: 'Invalid end date' }),
    cityCorporationCode: zod_1.z.string().optional(),
}).refine((data) => {
    if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
    }
    return true;
}, { message: 'Start date must be before or equal to end date' });
/**
 * ID Parameter Schema
 * Validates ID parameters in routes
 */
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string()
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
exports.bulkOperationSchema = zod_1.z.object({
    userIds: zod_1.z.array(zod_1.z.number().int().positive())
        .min(1, 'At least one user ID is required')
        .max(100, 'Cannot perform bulk operation on more than 100 users at once'),
    operation: zod_1.z.enum(['activate', 'deactivate', 'delete']),
    reason: sanitizedString(0, 500).optional(),
}).strict();
/**
 * Export Data Schema
 * Validates data export requests
 */
exports.exportDataSchema = zod_1.z.object({
    format: zod_1.z.enum(['csv', 'json', 'xlsx']),
    filters: zod_1.z.object({
        role: zod_1.z.nativeEnum(client_1.users_role).optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        cityCorporationCode: zod_1.z.string().optional(),
        zoneId: zod_1.z.number().int().positive().optional(),
        wardId: zod_1.z.number().int().positive().optional(),
        startDate: zod_1.z.date().optional(),
        endDate: zod_1.z.date().optional(),
    }).optional(),
}).strict();
/**
 * Validation helper function
 * Validates data against a schema and returns sanitized result
 */
function validateData(schema, data) {
    try {
        return schema.parse(data);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
async function validateDataAsync(schema, data) {
    try {
        const validated = await schema.parseAsync(data);
        return { success: true, data: validated };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
