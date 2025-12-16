"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.getActivityLogsQuerySchema = exports.getUsersQuerySchema = exports.updateUserPermissionsSchema = exports.updateUserStatusSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
exports.validate = validate;
exports.validateBangladeshPhone = validateBangladeshPhone;
exports.validateEmail = validateEmail;
exports.validatePasswordStrength = validatePasswordStrength;
exports.sanitizeInput = sanitizeInput;
exports.validateAndSanitizeInputs = validateAndSanitizeInputs;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
/**
 * Validation middleware factory
 * Creates a middleware that validates request data against a Zod schema
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const validated = schema.parse(data);
            // Replace the original data with validated data
            if (source === 'body') {
                req.body = validated;
            }
            else if (source === 'query') {
                req.query = validated;
            }
            else {
                req.params = validated;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
            });
        }
    };
}
// User validation schemas
exports.createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
    phone: zod_1.z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number format (01XXXXXXXXX)'),
    email: zod_1.z.string().email('Invalid email format').optional(),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    cityCorporationCode: zod_1.z.string().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    permissions: zod_1.z.any().optional(), // JSON permissions
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).max(50).optional(),
    lastName: zod_1.z.string().min(2).max(50).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().regex(/^01[3-9]\d{8}$/).optional(),
    cityCorporationCode: zod_1.z.string().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    password: zod_1.z.string()
        .min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .optional(),
    permissions: zod_1.z.any().optional(),
});
exports.updateUserStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus),
    reason: zod_1.z.string().optional(),
});
exports.updateUserPermissionsSchema = zod_1.z.object({
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
});
// Query validation schemas
exports.getUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    sortBy: zod_1.z.string().optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: zod_1.z.string().optional(),
    zoneId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
    wardId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
});
exports.getActivityLogsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 50),
    userId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
    action: zod_1.z.string().optional(),
    entityType: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    cityCorporationCode: zod_1.z.string().optional(),
});
// ID parameter validation
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().transform(val => {
        const num = parseInt(val);
        if (isNaN(num)) {
            throw new Error('Invalid ID format');
        }
        return num;
    }),
});
/**
 * Phone number validation helper
 * Validates Bangladesh phone number format
 */
function validateBangladeshPhone(phone) {
    return /^01[3-9]\d{8}$/.test(phone);
}
/**
 * Email validation helper
 * Validates email format
 */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Password strength validation helper
 * Validates password meets security requirements
 */
function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[@$!%*?&]/.test(password)) {
        errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
/**
 * Sanitize input helper
 * Removes potentially dangerous characters from input
 * @deprecated Use sanitizeString from security.middleware.ts instead
 */
function sanitizeInput(input) {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
}
/**
 * Validate and sanitize all inputs in request
 * Applies comprehensive input validation and sanitization
 */
function validateAndSanitizeInputs(req, res, next) {
    try {
        // Import security functions
        const { sanitizeString, validateEmail, validatePhone } = require('./security.middleware');
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObjectInputs(req.body, { sanitizeString, validateEmail, validatePhone });
        }
        // Sanitize query
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObjectInputs(req.query, { sanitizeString, validateEmail, validatePhone });
        }
        // Sanitize params
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObjectInputs(req.params, { sanitizeString, validateEmail, validatePhone });
        }
        next();
    }
    catch (error) {
        console.error('[Validation] Input sanitization error:', error);
        return res.status(400).json({
            success: false,
            message: 'Invalid input format',
        });
    }
}
/**
 * Recursively sanitize object inputs
 */
function sanitizeObjectInputs(obj, helpers) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObjectInputs(item, helpers));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObjectInputs(obj[key], helpers);
            }
        }
        return sanitized;
    }
    if (typeof obj === 'string') {
        return helpers.sanitizeString(obj);
    }
    return obj;
}
