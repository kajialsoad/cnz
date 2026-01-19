"use strict";
/**
 * Redis-Based Rate Limiting Middleware
 * Works across multiple server instances (production-ready)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ddosProtection = exports.uploadRateLimiter = exports.messageRateLimiter = exports.loginRateLimiter = exports.apiRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
exports.createSlidingWindowRateLimiter = createSlidingWindowRateLimiter;
const redis_cache_production_1 = __importDefault(require("../config/redis-cache-production"));
/**
 * Create rate limiter middleware
 */
function createRateLimiter(config) {
    const { windowMs, maxRequests, message = 'Too many requests, please try again later', skipSuccessfulRequests = false, } = config;
    return async (req, res, next) => {
        try {
            // Generate key based on IP and endpoint
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `rate_limit:${req.path}:${identifier}`;
            // Get current count
            const current = await redis_cache_production_1.default.incr(key);
            // Set expiry on first request
            if (current === 1) {
                await redis_cache_production_1.default.pexpire(key, windowMs);
            }
            // Check if limit exceeded
            if (current > maxRequests) {
                const ttl = await redis_cache_production_1.default.pttl(key);
                const retryAfter = Math.ceil(ttl / 1000);
                return res.status(429).json({
                    success: false,
                    message,
                    retryAfter,
                });
            }
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
            res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);
            // If skipSuccessfulRequests, decrement on successful response
            if (skipSuccessfulRequests) {
                const originalSend = res.send;
                res.send = function (data) {
                    if (res.statusCode < 400) {
                        redis_cache_production_1.default.decr(key).catch(console.error);
                    }
                    return originalSend.call(this, data);
                };
            }
            next();
        }
        catch (error) {
            console.error('Rate limit error:', error);
            // Fail open - allow request if Redis is down
            next();
        }
    };
}
/**
 * API rate limiter (100 requests per minute)
 */
exports.apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests, please try again later',
});
/**
 * Login rate limiter (5 attempts per 15 minutes)
 */
exports.loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
});
/**
 * Message rate limiter (10 messages per minute)
 */
exports.messageRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many messages, please slow down',
});
/**
 * Upload rate limiter (5 uploads per minute)
 */
exports.uploadRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many uploads, please try again later',
});
/**
 * Advanced rate limiter with sliding window
 */
function createSlidingWindowRateLimiter(config) {
    const { windowMs, maxRequests, message = 'Too many requests' } = config;
    return async (req, res, next) => {
        try {
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `rate_limit:sliding:${req.path}:${identifier}`;
            const now = Date.now();
            const windowStart = now - windowMs;
            // Remove old entries
            await redis_cache_production_1.default.zremrangebyscore(key, 0, windowStart);
            // Count requests in current window
            const count = await redis_cache_production_1.default.zcard(key);
            if (count >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message,
                });
            }
            // Add current request
            await redis_cache_production_1.default.zadd(key, now, `${now}-${Math.random()}`);
            await redis_cache_production_1.default.pexpire(key, windowMs);
            // Add headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count - 1));
            next();
        }
        catch (error) {
            console.error('Sliding window rate limit error:', error);
            next();
        }
    };
}
/**
 * IP-based rate limiter for DDoS protection
 */
exports.ddosProtection = createRateLimiter({
    windowMs: 1000, // 1 second
    maxRequests: 10, // 10 requests per second
    message: 'Too many requests from this IP',
});
exports.default = {
    createRateLimiter,
    createSlidingWindowRateLimiter,
    apiRateLimiter: exports.apiRateLimiter,
    loginRateLimiter: exports.loginRateLimiter,
    messageRateLimiter: exports.messageRateLimiter,
    uploadRateLimiter: exports.uploadRateLimiter,
    ddosProtection: exports.ddosProtection,
};
