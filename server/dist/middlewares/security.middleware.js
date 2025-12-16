"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimitConfig = exports.rateLimitConfig = exports.parameterPollutionPrevention = exports.noSqlInjectionPrevention = exports.helmetConfig = void 0;
exports.xssPrevention = xssPrevention;
exports.sanitizeString = sanitizeString;
exports.preventSqlInjection = preventSqlInjection;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.validateUrl = validateUrl;
exports.validatePasswordStrength = validatePasswordStrength;
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrfToken = validateCsrfToken;
exports.csrfProtection = csrfProtection;
exports.validateInput = validateInput;
exports.sanitizeFilename = sanitizeFilename;
exports.validateFileType = validateFileType;
exports.validateFileSize = validateFileSize;
exports.securityHeaders = securityHeaders;
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const validator_1 = __importDefault(require("validator"));
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
exports.helmetConfig = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
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
exports.noSqlInjectionPrevention = (0, express_mongo_sanitize_1.default)({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`[Security] NoSQL injection attempt detected: ${key} in ${req.path}`);
    },
});
/**
 * HTTP Parameter Pollution prevention
 * Prevents duplicate parameters in query strings
 */
exports.parameterPollutionPrevention = (0, hpp_1.default)({
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
function xssPrevention(req, res, next) {
    try {
        // Sanitize body
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        // Sanitize params
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
        next();
    }
    catch (error) {
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
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (typeof obj === 'object') {
        const sanitized = {};
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
function sanitizeString(input) {
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
function preventSqlInjection(input) {
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
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return validator_1.default.isEmail(email);
}
/**
 * Validate phone number (Bangladesh format)
 * Format: 01XXXXXXXXX (11 digits starting with 01)
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    return /^01[3-9]\d{8}$/.test(phone);
}
/**
 * Validate URL format
 * Ensures URLs are safe and properly formatted
 */
function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    return validator_1.default.isURL(url, {
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
function validatePasswordStrength(password) {
    const errors = [];
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
const csrfTokens = new Map();
/**
 * Generate CSRF token for a session
 */
function generateCsrfToken(sessionId) {
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
function validateCsrfToken(sessionId, token) {
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
function csrfProtection(req, res, next) {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Get session ID from cookie or header
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    if (!sessionId) {
        return res.status(403).json({
            success: false,
            message: 'CSRF validation failed: No session ID',
        });
    }
    // Get CSRF token from header or body
    const token = req.headers['x-csrf-token'] || req.body?._csrf;
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
function validateInput(type, value) {
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
function sanitizeFilename(filename) {
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
function validateFileType(mimetype, allowedTypes) {
    if (!mimetype || typeof mimetype !== 'string') {
        return false;
    }
    return allowedTypes.includes(mimetype);
}
/**
 * Validate file size
 * Checks if file size is within limits
 */
function validateFileSize(size, maxSize) {
    if (typeof size !== 'number' || typeof maxSize !== 'number') {
        return false;
    }
    return size > 0 && size <= maxSize;
}
/**
 * Security headers middleware
 * Adds additional security headers
 */
function securityHeaders(req, res, next) {
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
exports.rateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
};
/**
 * Strict rate limiting for authentication endpoints
 */
exports.authRateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
};
