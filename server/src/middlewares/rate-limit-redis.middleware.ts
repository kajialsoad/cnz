/**
 * Redis-Based Rate Limiting Middleware
 * Works across multiple server instances (production-ready)
 */

import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis-cache-production';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
    message?: string;
    skipSuccessfulRequests?: boolean;
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
    const {
        windowMs,
        maxRequests,
        message = 'Too many requests, please try again later',
        skipSuccessfulRequests = false,
    } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Generate key based on IP and endpoint
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `rate_limit:${req.path}:${identifier}`;

            // Get current count
            const current = await redis.incr(key);

            // Set expiry on first request
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }

            // Check if limit exceeded
            if (current > maxRequests) {
                const ttl = await redis.pttl(key);
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
                res.send = function (data: any) {
                    if (res.statusCode < 400) {
                        redis.decr(key).catch(console.error);
                    }
                    return originalSend.call(this, data);
                };
            }

            next();
        } catch (error) {
            console.error('Rate limit error:', error);
            // Fail open - allow request if Redis is down
            next();
        }
    };
}

/**
 * API rate limiter (100 requests per minute)
 */
export const apiRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests, please try again later',
});

/**
 * Login rate limiter (5 attempts per 15 minutes)
 */
export const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true,
});

/**
 * Message rate limiter (10 messages per minute)
 */
export const messageRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many messages, please slow down',
});

/**
 * Upload rate limiter (5 uploads per minute)
 */
export const uploadRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many uploads, please try again later',
});

/**
 * Advanced rate limiter with sliding window
 */
export function createSlidingWindowRateLimiter(config: RateLimitConfig) {
    const { windowMs, maxRequests, message = 'Too many requests' } = config;

    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `rate_limit:sliding:${req.path}:${identifier}`;
            const now = Date.now();
            const windowStart = now - windowMs;

            // Remove old entries
            await redis.zremrangebyscore(key, 0, windowStart);

            // Count requests in current window
            const count = await redis.zcard(key);

            if (count >= maxRequests) {
                return res.status(429).json({
                    success: false,
                    message,
                });
            }

            // Add current request
            await redis.zadd(key, now, `${now}-${Math.random()}`);
            await redis.pexpire(key, windowMs);

            // Add headers
            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count - 1));

            next();
        } catch (error) {
            console.error('Sliding window rate limit error:', error);
            next();
        }
    };
}

/**
 * IP-based rate limiter for DDoS protection
 */
export const ddosProtection = createRateLimiter({
    windowMs: 1000, // 1 second
    maxRequests: 10, // 10 requests per second
    message: 'Too many requests from this IP',
});

export default {
    createRateLimiter,
    createSlidingWindowRateLimiter,
    apiRateLimiter,
    loginRateLimiter,
    messageRateLimiter,
    uploadRateLimiter,
    ddosProtection,
};
