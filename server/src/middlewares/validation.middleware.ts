import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { users_role, UserStatus } from '@prisma/client';

/**
 * Validation middleware factory
 * Creates a middleware that validates request data against a Zod schema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
            const validated = schema.parse(data);

            // Replace the original data with validated data
            if (source === 'body') {
                req.body = validated;
            } else if (source === 'query') {
                req.query = validated as any;
            } else {
                req.params = validated as any;
            }

            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
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
export const createUserSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be at most 50 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be at most 50 characters'),
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladesh phone number format (01XXXXXXXXX)'),
    email: z.string().email('Invalid email format').optional(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    cityCorporationCode: z.string().optional(),
    zoneId: z.number().int().positive().optional(),
    wardId: z.number().int().positive().optional(),
    role: z.nativeEnum(users_role).optional(),
    permissions: z.any().optional(), // JSON permissions
});

export const updateUserSchema = z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^01[3-9]\d{8}$/).optional(),
    cityCorporationCode: z.string().optional(),
    zoneId: z.number().int().positive().optional(),
    wardId: z.number().int().positive().optional(),
    role: z.nativeEnum(users_role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: z.string()
        .min(8)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .optional(),
    permissions: z.any().optional(),
});

export const updateUserStatusSchema = z.object({
    status: z.nativeEnum(UserStatus),
    reason: z.string().optional(),
});

export const updateUserPermissionsSchema = z.object({
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
});

// Query validation schemas
export const getUsersQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(users_role).optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: z.string().optional(),
    zoneId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    wardId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

export const getActivityLogsQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    action: z.string().optional(),
    entityType: z.string().optional(),
    startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    cityCorporationCode: z.string().optional(),
});

// ID parameter validation
export const idParamSchema = z.object({
    id: z.string().transform(val => {
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
export function validateBangladeshPhone(phone: string): boolean {
    return /^01[3-9]\d{8}$/.test(phone);
}

/**
 * Email validation helper
 * Validates email format
 */
export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength validation helper
 * Validates password meets security requirements
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

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
export function sanitizeInput(input: string): string {
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
export function validateAndSanitizeInputs(req: any, res: any, next: any) {
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
    } catch (error) {
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
function sanitizeObjectInputs(obj: any, helpers: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObjectInputs(item, helpers));
    }

    if (typeof obj === 'object') {
        const sanitized: any = {};
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
