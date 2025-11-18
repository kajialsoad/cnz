"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = authGuard;
exports.rbacGuard = rbacGuard;
exports.optionalAuth = optionalAuth;
exports.createRateLimiter = createRateLimiter;
exports.createEmailRateLimiter = createEmailRateLimiter;
exports.createCodeRateLimiter = createCodeRateLimiter;
const jwt_1 = require("../utils/jwt");
function authGuard(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: No token provided'
        });
    }
    const token = auth.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(401).json({
                success: false,
                message: `Unauthorized: ${error.message}`
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Unauthorized: Invalid token'
        });
    }
}
function rbacGuard(...roles) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No role found'
            });
        }
        if (!roles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions',
                required: roles,
                current: role
            });
        }
        next();
    };
}
function optionalAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return next();
    }
    const token = auth.slice(7);
    try {
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = payload;
    }
    catch (error) {
        // Ignore invalid tokens for optional auth
    }
    next();
}
// Rate limiting middleware
function createRateLimiter(windowMs, max, message) {
    const requests = new Map();
    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const current = requests.get(key);
        if (!current || now > current.resetTime) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (current.count >= max) {
            return res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            });
        }
        current.count++;
        next();
    };
}
// Email-based rate limiting middleware for verification code requests
function createEmailRateLimiter(windowMs, max, message) {
    const requests = new Map();
    return (req, res, next) => {
        const email = req.body?.email || req.query?.email;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        const key = String(email).toLowerCase();
        const now = Date.now();
        const current = requests.get(key);
        if (!current || now > current.resetTime) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (current.count >= max) {
            return res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            });
        }
        current.count++;
        next();
    };
}
// Code-based rate limiting middleware for verification attempts
function createCodeRateLimiter(windowMs, max, message) {
    const requests = new Map();
    return (req, res, next) => {
        const email = req.body?.email;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        const key = String(email).toLowerCase();
        const now = Date.now();
        const current = requests.get(key);
        if (!current || now > current.resetTime) {
            requests.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (current.count >= max) {
            return res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil((current.resetTime - now) / 1000)
            });
        }
        current.count++;
        next();
    };
}
