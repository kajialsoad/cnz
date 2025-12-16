"use strict";
/**
 * Rate Limiting Middleware
 * Prevents spam and abuse for viral app with 500K+ users
 * Requirements: 12.13, 12.18
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRateLimit = messageRateLimit;
exports.apiRateLimit = apiRateLimit;
exports.strictRateLimit = strictRateLimit;
exports.ipRateLimit = ipRateLimit;
exports.trackLoginAttempt = trackLoginAttempt;
exports.checkAccountLockout = checkAccountLockout;
exports.getRemainingLoginAttempts = getRemainingLoginAttempts;
exports.loginRateLimit = loginRateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
const prisma_1 = __importDefault(require("../utils/prisma"));
// In-memory store (use Redis in production for distributed systems)
const messageRateLimitStore = {};
const apiRateLimitStore = {};
const loginAttemptStore = {};
const ipRateLimitStore = {};
// Configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window for attempts
/**
 * Clean up expired entries every 5 minutes
 */
setInterval(() => {
    const now = Date.now();
    // Clean message rate limit store
    Object.keys(messageRateLimitStore).forEach(key => {
        if (messageRateLimitStore[key].resetTime < now) {
            delete messageRateLimitStore[key];
        }
    });
    // Clean API rate limit store
    Object.keys(apiRateLimitStore).forEach(key => {
        if (apiRateLimitStore[key].resetTime < now) {
            delete apiRateLimitStore[key];
        }
    });
    // Clean IP rate limit store
    Object.keys(ipRateLimitStore).forEach(key => {
        if (ipRateLimitStore[key].resetTime < now) {
            delete ipRateLimitStore[key];
        }
    });
    // Clean login attempt store
    Object.keys(loginAttemptStore).forEach(key => {
        const attempt = loginAttemptStore[key];
        if (attempt.lockoutUntil && attempt.lockoutUntil < now) {
            delete loginAttemptStore[key];
        }
        else if (!attempt.lockoutUntil && attempt.firstAttempt + ATTEMPT_WINDOW < now) {
            delete loginAttemptStore[key];
        }
    });
}, 5 * 60 * 1000); // 5 minutes
/**
 * Rate limit for chat messages
 * Prevents spam: Max 10 messages per minute, 100 per hour
 */
function messageRateLimit(req, res, next) {
    const userId = req.user?.sub;
    if (!userId) {
        return next();
    }
    const now = Date.now();
    const minuteKey = `msg_min_${userId}`;
    const hourKey = `msg_hour_${userId}`;
    // Check per-minute limit (10 messages)
    const minuteLimit = messageRateLimitStore[minuteKey];
    if (minuteLimit && minuteLimit.resetTime > now) {
        if (minuteLimit.count >= 10) {
            return res.status(429).json({
                success: false,
                message: 'Too many messages. Please wait a moment before sending more.',
                retryAfter: Math.ceil((minuteLimit.resetTime - now) / 1000)
            });
        }
        minuteLimit.count++;
    }
    else {
        messageRateLimitStore[minuteKey] = {
            count: 1,
            resetTime: now + 60 * 1000 // 1 minute
        };
    }
    // Check per-hour limit (100 messages)
    const hourLimit = messageRateLimitStore[hourKey];
    if (hourLimit && hourLimit.resetTime > now) {
        if (hourLimit.count >= 100) {
            return res.status(429).json({
                success: false,
                message: 'Message limit reached. Please try again later.',
                retryAfter: Math.ceil((hourLimit.resetTime - now) / 1000)
            });
        }
        hourLimit.count++;
    }
    else {
        messageRateLimitStore[hourKey] = {
            count: 1,
            resetTime: now + 60 * 60 * 1000 // 1 hour
        };
    }
    next();
}
/**
 * General API rate limit
 * Max 100 requests per minute per user
 */
function apiRateLimit(req, res, next) {
    const userId = req.user?.sub || req.ip;
    const key = `api_${userId}`;
    const now = Date.now();
    const limit = apiRateLimitStore[key];
    if (limit && limit.resetTime > now) {
        if (limit.count >= 100) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please slow down.',
                retryAfter: Math.ceil((limit.resetTime - now) / 1000)
            });
        }
        limit.count++;
    }
    else {
        apiRateLimitStore[key] = {
            count: 1,
            resetTime: now + 60 * 1000 // 1 minute
        };
    }
    next();
}
/**
 * Strict rate limit for sensitive operations
 * Max 10 requests per minute
 */
function strictRateLimit(req, res, next) {
    const userId = req.user?.sub || req.ip;
    const key = `strict_${userId}`;
    const now = Date.now();
    const limit = apiRateLimitStore[key];
    if (limit && limit.resetTime > now) {
        if (limit.count >= 10) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please wait before trying again.',
                retryAfter: Math.ceil((limit.resetTime - now) / 1000)
            });
        }
        limit.count++;
    }
    else {
        apiRateLimitStore[key] = {
            count: 1,
            resetTime: now + 60 * 1000 // 1 minute
        };
    }
    next();
}
/**
 * IP-based rate limiting
 * Requirements: 12.18
 * Limits requests per IP address to prevent abuse
 */
function ipRateLimit(maxRequests = 1000, windowMs = 60 * 1000) {
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `ip_${ip}`;
        const now = Date.now();
        const limit = ipRateLimitStore[key];
        if (limit && limit.resetTime > now) {
            if (limit.count >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests from this IP address. Please try again later.',
                        retryAfter: Math.ceil((limit.resetTime - now) / 1000)
                    }
                });
            }
            limit.count++;
        }
        else {
            ipRateLimitStore[key] = {
                count: 1,
                resetTime: now + windowMs
            };
        }
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (maxRequests - (limit?.count || 1)).toString());
        res.setHeader('X-RateLimit-Reset', new Date(ipRateLimitStore[key].resetTime).toISOString());
        next();
    };
}
/**
 * Login attempt tracking and account lockout
 * Requirements: 12.13, 12.18
 * Locks account after MAX_LOGIN_ATTEMPTS failed attempts
 */
async function trackLoginAttempt(identifier, success, ip) {
    const key = `login_${identifier}`;
    const now = Date.now();
    if (success) {
        // Clear failed attempts on successful login
        delete loginAttemptStore[key];
        return;
    }
    // Track failed attempt
    const attempt = loginAttemptStore[key];
    if (!attempt) {
        loginAttemptStore[key] = {
            attempts: 1,
            firstAttempt: now
        };
    }
    else {
        // Check if we're still in the attempt window
        if (attempt.firstAttempt + ATTEMPT_WINDOW < now) {
            // Reset if window expired
            loginAttemptStore[key] = {
                attempts: 1,
                firstAttempt: now
            };
        }
        else {
            attempt.attempts++;
            // Lock account if max attempts reached
            if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
                attempt.lockoutUntil = now + LOCKOUT_DURATION;
                // Log the lockout event
                try {
                    // Find user to log activity
                    const user = await prisma_1.default.user.findFirst({
                        where: {
                            OR: [
                                { email: identifier },
                                { phone: identifier }
                            ]
                        }
                    });
                    if (user) {
                        await prisma_1.default.activityLog.create({
                            data: {
                                userId: user.id,
                                action: 'ACCOUNT_LOCKED',
                                entityType: 'USER',
                                entityId: user.id,
                                oldValue: JSON.stringify({ status: 'ACTIVE' }),
                                newValue: JSON.stringify({
                                    status: 'LOCKED',
                                    reason: 'Too many failed login attempts',
                                    lockoutUntil: new Date(attempt.lockoutUntil)
                                }),
                                ipAddress: ip,
                                timestamp: new Date()
                            }
                        });
                    }
                }
                catch (error) {
                    console.error('Failed to log account lockout:', error);
                }
            }
        }
    }
}
/**
 * Check if account is locked
 * Requirements: 12.13, 12.18
 */
function checkAccountLockout(identifier) {
    const key = `login_${identifier}`;
    const attempt = loginAttemptStore[key];
    const now = Date.now();
    if (!attempt || !attempt.lockoutUntil) {
        return { locked: false };
    }
    if (attempt.lockoutUntil > now) {
        return {
            locked: true,
            retryAfter: Math.ceil((attempt.lockoutUntil - now) / 1000)
        };
    }
    // Lockout expired, clear it
    delete loginAttemptStore[key];
    return { locked: false };
}
/**
 * Get remaining login attempts
 */
function getRemainingLoginAttempts(identifier) {
    const key = `login_${identifier}`;
    const attempt = loginAttemptStore[key];
    const now = Date.now();
    if (!attempt) {
        return MAX_LOGIN_ATTEMPTS;
    }
    // Check if window expired
    if (attempt.firstAttempt + ATTEMPT_WINDOW < now) {
        delete loginAttemptStore[key];
        return MAX_LOGIN_ATTEMPTS;
    }
    // Check if locked
    if (attempt.lockoutUntil && attempt.lockoutUntil > now) {
        return 0;
    }
    return Math.max(0, MAX_LOGIN_ATTEMPTS - attempt.attempts);
}
/**
 * Login rate limiting middleware
 * Requirements: 12.13, 12.18
 * Prevents brute force attacks on login endpoints
 */
function loginRateLimit(req, res, next) {
    const identifier = req.body.email || req.body.phone;
    const ip = req.ip || req.socket.remoteAddress;
    if (!identifier) {
        return next();
    }
    // Check account lockout
    const lockout = checkAccountLockout(identifier);
    if (lockout.locked) {
        return res.status(429).json({
            success: false,
            error: {
                code: 'ACCOUNT_LOCKED',
                message: `Account temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.`,
                retryAfter: lockout.retryAfter,
                remainingAttempts: 0
            }
        });
    }
    // Add remaining attempts to response
    const remaining = getRemainingLoginAttempts(identifier);
    res.locals.remainingLoginAttempts = remaining;
    res.locals.loginIdentifier = identifier;
    res.locals.loginIp = ip;
    next();
}
/**
 * Get rate limit status for a user
 */
function getRateLimitStatus(userId) {
    const now = Date.now();
    const minuteKey = `msg_min_${userId}`;
    const hourKey = `msg_hour_${userId}`;
    const minuteLimit = messageRateLimitStore[minuteKey];
    const hourLimit = messageRateLimitStore[hourKey];
    return {
        perMinute: {
            used: minuteLimit && minuteLimit.resetTime > now ? minuteLimit.count : 0,
            limit: 10,
            remaining: minuteLimit && minuteLimit.resetTime > now ? 10 - minuteLimit.count : 10,
            resetIn: minuteLimit && minuteLimit.resetTime > now ? Math.ceil((minuteLimit.resetTime - now) / 1000) : 0
        },
        perHour: {
            used: hourLimit && hourLimit.resetTime > now ? hourLimit.count : 0,
            limit: 100,
            remaining: hourLimit && hourLimit.resetTime > now ? 100 - hourLimit.count : 100,
            resetIn: hourLimit && hourLimit.resetTime > now ? Math.ceil((hourLimit.resetTime - now) / 1000) : 0
        }
    };
}
