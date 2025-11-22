"use strict";
/**
 * Rate Limiting Middleware
 * Prevents spam and abuse for viral app with 500K+ users
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRateLimit = messageRateLimit;
exports.apiRateLimit = apiRateLimit;
exports.strictRateLimit = strictRateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
// In-memory store (use Redis in production for distributed systems)
const messageRateLimitStore = {};
const apiRateLimitStore = {};
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
