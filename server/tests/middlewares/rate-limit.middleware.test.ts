/**
 * Rate Limiting Middleware Tests
 * Requirements: 12.13, 12.18
 * Tests for rate limiting, account lockout, and IP-based rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import {
    messageRateLimit,
    apiRateLimit,
    strictRateLimit,
    ipRateLimit,
    loginRateLimit,
    trackLoginAttempt,
    checkAccountLockout,
    getRemainingLoginAttempts,
} from '../../src/middlewares/rate-limit.middleware';

// Mock request, response, and next function
const mockRequest = (overrides: any = {}): any => ({
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    body: {},
    user: undefined,
    ...overrides,
});

const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn().mockReturnThis(),
        locals: {},
    };
    return res;
};

const mockNext: NextFunction = jest.fn();

describe('Rate Limiting Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('apiRateLimit', () => {
        it('should allow requests within rate limit', () => {
            const req = mockRequest({ user: { sub: 1 } });
            const res = mockResponse();

            apiRateLimit(req as Request, res as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block requests exceeding rate limit', () => {
            const req = mockRequest({ user: { sub: 1 } });
            const res = mockResponse();

            // Make 100 requests (the limit)
            for (let i = 0; i < 100; i++) {
                apiRateLimit(req as Request, res as Response, mockNext);
            }

            // 101st request should be blocked
            apiRateLimit(req as Request, res as Response, mockNext);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Too many requests'),
                })
            );
        });
    });

    describe('strictRateLimit', () => {
        it('should allow requests within strict rate limit', () => {
            const req = mockRequest({ user: { sub: 1 } });
            const res = mockResponse();

            strictRateLimit(req as Request, res as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block requests exceeding strict rate limit', () => {
            const req = mockRequest({ user: { sub: 2 } });
            const res = mockResponse();

            // Make 10 requests (the limit)
            for (let i = 0; i < 10; i++) {
                strictRateLimit(req as Request, res as Response, mockNext);
            }

            // 11th request should be blocked
            strictRateLimit(req as Request, res as Response, mockNext);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Too many requests'),
                })
            );
        });
    });

    describe('ipRateLimit', () => {
        it('should allow requests within IP rate limit', () => {
            const middleware = ipRateLimit(10, 60000);
            const req = mockRequest({ ip: '192.168.1.1' });
            const res = mockResponse();

            middleware(req as Request, res as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block requests exceeding IP rate limit', () => {
            const middleware = ipRateLimit(5, 60000);
            const req = mockRequest({ ip: '192.168.1.2' });
            const res = mockResponse();

            // Make 5 requests (the limit)
            for (let i = 0; i < 5; i++) {
                middleware(req as Request, res as Response, mockNext);
            }

            // 6th request should be blocked
            middleware(req as Request, res as Response, mockNext);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: expect.stringContaining('Too many requests from this IP'),
                    }),
                })
            );
        });

        it('should set rate limit headers', () => {
            const middleware = ipRateLimit(10, 60000);
            const req = mockRequest({ ip: '192.168.1.3' });
            const res = mockResponse();

            middleware(req as Request, res as Response, mockNext);

            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
        });
    });

    describe('Login Attempt Tracking and Account Lockout', () => {
        const testEmail = 'test@example.com';
        const testIp = '192.168.1.100';

        beforeEach(async () => {
            // Clear any existing login attempts
            await trackLoginAttempt(testEmail, true, testIp);
        });

        it('should track failed login attempts', async () => {
            await trackLoginAttempt(testEmail, false, testIp);

            const remaining = getRemainingLoginAttempts(testEmail);
            expect(remaining).toBe(4); // 5 max - 1 failed = 4 remaining
        });

        it('should clear failed attempts on successful login', async () => {
            // Make some failed attempts
            await trackLoginAttempt(testEmail, false, testIp);
            await trackLoginAttempt(testEmail, false, testIp);

            // Successful login should clear attempts
            await trackLoginAttempt(testEmail, true, testIp);

            const remaining = getRemainingLoginAttempts(testEmail);
            expect(remaining).toBe(5); // Reset to max
        });

        it('should lock account after max failed attempts', async () => {
            // Make 5 failed attempts
            for (let i = 0; i < 5; i++) {
                await trackLoginAttempt(testEmail, false, testIp);
            }

            const lockout = checkAccountLockout(testEmail);
            expect(lockout.locked).toBe(true);
            expect(lockout.retryAfter).toBeGreaterThan(0);
        });

        it('should return remaining attempts correctly', async () => {
            await trackLoginAttempt(testEmail, false, testIp);
            expect(getRemainingLoginAttempts(testEmail)).toBe(4);

            await trackLoginAttempt(testEmail, false, testIp);
            expect(getRemainingLoginAttempts(testEmail)).toBe(3);

            await trackLoginAttempt(testEmail, false, testIp);
            expect(getRemainingLoginAttempts(testEmail)).toBe(2);
        });

        it('should return 0 remaining attempts when locked', async () => {
            // Lock the account
            for (let i = 0; i < 5; i++) {
                await trackLoginAttempt(testEmail, false, testIp);
            }

            expect(getRemainingLoginAttempts(testEmail)).toBe(0);
        });
    });

    describe('loginRateLimit middleware', () => {
        it('should allow login when account is not locked', () => {
            const req = mockRequest({
                body: { email: 'unlocked@example.com', password: 'test123' },
            });
            const res = mockResponse();

            loginRateLimit(req as Request, res as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block login when account is locked', async () => {
            const lockedEmail = 'locked@example.com';

            // Lock the account
            for (let i = 0; i < 5; i++) {
                await trackLoginAttempt(lockedEmail, false, '192.168.1.1');
            }

            const req = mockRequest({
                body: { email: lockedEmail, password: 'test123' },
            });
            const res = mockResponse();

            loginRateLimit(req as Request, res as Response, mockNext);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'ACCOUNT_LOCKED',
                        message: expect.stringContaining('Account temporarily locked'),
                        remainingAttempts: 0,
                    }),
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should set remaining attempts in response locals', () => {
            const req = mockRequest({
                body: { email: 'newuser@example.com', password: 'test123' },
            });
            const res = mockResponse();

            loginRateLimit(req as Request, res as Response, mockNext);

            expect(res.locals!.remainingLoginAttempts).toBeDefined();
            expect(res.locals!.remainingLoginAttempts).toBe(5);
            expect(res.locals!.loginIdentifier).toBe('newuser@example.com');
        });
    });

    describe('messageRateLimit', () => {
        it('should allow messages within rate limit', () => {
            const req = mockRequest({ user: { sub: 100 } });
            const res = mockResponse();

            messageRateLimit(req as Request, res as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should block messages exceeding per-minute limit', () => {
            const req = mockRequest({ user: { sub: 101 } });
            const res = mockResponse();

            // Send 10 messages (the per-minute limit)
            for (let i = 0; i < 10; i++) {
                messageRateLimit(req as Request, res as Response, mockNext);
            }

            // 11th message should be blocked
            messageRateLimit(req as Request, res as Response, mockNext);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: expect.stringContaining('Too many messages'),
                })
            );
        });
    });
});
