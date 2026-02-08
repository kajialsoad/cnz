import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import validator from 'validator';

/**
 * Security Middleware Configuration
 * Implements comprehensive security measures including:
 * - XSS prevention
 * - SQL injection prevention
 * - CSRF protection
 * - Input sanitization
 * - HTTP parameter pollution prevention
 */

/**
 * Helmet configuration for security headers
 * Protects against common web vulnerabilities
 */
export const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://munna-production.up.railway.app', 'https://www.cleancaresupport.com'],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:', 'https://res.cloudinary.com', 'https://munna-production.up.railway.app', 'https://www.cleancaresupport.com'],
            connectSrc: ["'self'", 'https://munna-production.up.railway.app', 'wss://munna-production.up.railway.app', 'https://www.cleancaresupport.com', 'wss://www.cleancaresupport.com'],
            fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", 'https://res.cloudinary.com', 'blob:'],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for admin panel
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources
});

/**
 * MongoDB/NoSQL injection prevention
 * Sanitizes user input to prevent NoSQL injection attacks
 */
export const noSqlInjectionPrevention = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`[Security] NoSQL injection attempt detected: ${key} in ${req.path}`);
    },
});

/**
 * HTTP Parameter Pollution prevention
 * Prevents duplicate parameters in query strings
 */
export const parameterPollutionPrevention = hpp({
    whitelist: [
        'page',
        'limit',
        'sort',
        'sortBy',
        'sortOrder',
        'status',
        'role',
        'cityCorporationCode',
        'zoneId',
        'wardId',
        'category',
        'subcategory',
    ],
});

/**
 * XSS (Cross-Site Scripting) prevention middleware
 * Sanitizes all string inputs to prevent XSS attacks
 */
export function xssPrevention(req: Request, res: Response, next: NextFunction) {
    try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query) as any;
        }

        // Sanitize params
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        console.error('[Security] XSS prevention error:', error);
        return res.status(400).json({
            success: false,
            message: 'Invalid input detected',
        });
    }
}

/**
 * Recursively sanitize object properties
 * Removes potentially dangerous HTML/JavaScript from strings
 */
function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }

    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    return obj;
}

/**
 * Sanitize string input
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
        return input;
    }

    // Remove dangerous HTML/JavaScript patterns
    let sanitized = input
        // Remove script tags and content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove all HTML tags
        .replace(/<[^>]*>/g, '')
        // Remove javascript: protocol
        .replace(/javascript:/gi, '')
        // Remove data: protocol (can be used for XSS)
        .replace(/data:text\/html/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=/gi, '')
        // Remove eval
        .replace(/eval\s*\(/gi, '')
        // Remove CSS expressions
        .replace(/expression\s*\(/gi, '')
        // Remove vbscript: protocol
        .replace(/vbscript:/gi, '')
        // Remove file: protocol
        .replace(/file:/gi, '')
        // Trim whitespace
        .trim();

    return sanitized;
}

/**
 * SQL injection prevention for raw queries
 * Validates and escapes SQL inputs
 */
export function preventSqlInjection(input: string): string {
    if (!input || typeof input !== 'string') {
        return input;
    }

    // Remove SQL keywords and dangerous characters
    const dangerous = [
        'DROP',
        'DELETE',
        'TRUNCATE',
        'UPDATE',
        'INSERT',
        'EXEC',
        'EXECUTE',
        'SCRIPT',
        'UNION',
        'SELECT',
        'xp_',
        'sp_',
    ];

    let sanitized = input;

    // Remove SQL keywords
    dangerous.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        sanitized = sanitized.replace(regex, '');
    });

    // Remove SQL comments and special characters
    sanitized = sanitized
        .replace(/--/g, '') // SQL comments
        .replace(/;/g, '') // Statement terminator
        .replace(/\/\*/g, '') // Block comment start
        .replace(/\*\//g, ''); // Block comment end

    // Escape single quotes
    sanitized = sanitized.replace(/'/g, "''");

    return sanitized;
}

/**
 * Validate email format
 * Uses validator library for robust email validation
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return validator.isEmail(email);
}

/**
 * Validate phone number (Bangladesh format)
 * Format: 01XXXXXXXXX (11 digits starting with 01)
 */
export function validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    return /^01[3-9]\d{8}$/.test(phone);
}

/**
 * Validate URL format
 * Ensures URLs are safe and properly formatted
 */
export function validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
        return false;
    }
    return validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true,
        require_valid_protocol: true,
    });
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        return {
            isValid: false,
            errors: ['Password is required'],
        };
    }

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

    // Check for common weak passwords (case-insensitive)
    const weakPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'admin123',
    ];
    const lowerPassword = password.toLowerCase();
    if (weakPasswords.some(weak => lowerPassword.includes(weak))) {
        errors.push('Password is too common. Please choose a stronger password');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * CSRF token generation and validation
 * Simple token-based CSRF protection
 */
const csrfTokens = new Map<string, { token: string; expires: number }>();

/**
 * Generate CSRF token for a session
 */
export function generateCsrfToken(sessionId: string): string {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expires = Date.now() + 3600000; // 1 hour

    csrfTokens.set(sessionId, { token, expires });

    // Clean up expired tokens
    cleanupExpiredTokens();

    return token;
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(sessionId: string, token: string): boolean {
    const stored = csrfTokens.get(sessionId);

    if (!stored) {
        return false;
    }

    if (stored.expires < Date.now()) {
        csrfTokens.delete(sessionId);
        return false;
    }

    return stored.token === token;
}

/**
 * Clean up expired CSRF tokens
 */
function cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, data] of csrfTokens.entries()) {
        if (data.expires < now) {
            csrfTokens.delete(sessionId);
        }
    }
}

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Get session ID from cookie or header
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;

    if (!sessionId) {
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed: No session ID',
        });
    }

    // Get CSRF token from header or body
    const token = req.headers['x-csrf-token'] as string || req.body?._csrf;

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed: No token provided',
        });
    }

    // Validate token
    if (!validateCsrfToken(sessionId, token)) {
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed: Invalid token',
        });
    }

    next();
}

/**
 * Input validation helper
 * Validates common input types
 */
export function validateInput(type: string, value: any): boolean {
    switch (type) {
        case 'email':
            return validateEmail(value);
        case 'phone':
            return validatePhone(value);
        case 'url':
            return validateUrl(value);
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'string':
            return typeof value === 'string' && value.trim().length > 0;
        case 'boolean':
            return typeof value === 'boolean';
        default:
            return false;
    }
}

/**
 * Sanitize filename
 * Removes dangerous characters from filenames
 */
export function sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
        return '';
    }

    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
        .replace(/\.{2,}/g, '.') // Remove multiple dots
        .replace(/^\.+/, '') // Remove leading dots
        .substring(0, 255); // Limit length
}

/**
 * Validate file type
 * Checks if file type is allowed
 */
export function validateFileType(mimetype: string, allowedTypes: string[]): boolean {
    if (!mimetype || typeof mimetype !== 'string') {
        return false;
    }
    return allowedTypes.includes(mimetype);
}

/**
 * Validate file size
 * Checks if file size is within limits
 */
export function validateFileSize(size: number, maxSize: number): boolean {
    if (typeof size !== 'number' || typeof maxSize !== 'number') {
        return false;
    }
    return size > 0 && size <= maxSize;
}

/**
 * Security headers middleware
 * Adds additional security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
}

/**
 * Rate limiting configuration
 * Prevents brute force attacks
 */
export const rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
};

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
};
