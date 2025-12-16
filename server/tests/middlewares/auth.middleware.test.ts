import { Response, NextFunction } from 'express';
import { authGuard, rbacGuard, AuthRequest } from '../../src/middlewares/auth.middleware';
import * as jwtUtils from '../../src/utils/jwt';
import { mockDeep } from 'jest-mock-extended';
import { users_role } from '@prisma/client';

// Mock jwt utils
jest.mock('../../src/utils/jwt', () => ({
    verifyAccessToken: jest.fn(),
    validateUserSession: jest.fn(),
}));

jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: mockDeep(),
}));

describe('Auth Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            user: undefined
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('authGuard', () => {
        it('should return 401 if no authorization header', async () => {
            mockRequest.headers = {}; // No authorization

            await authGuard(mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({ code: 'AUTH_TOKEN_MISSING' })
            }));
        });

        it('should return 401 if token is invalid', async () => {
            mockRequest.headers = { authorization: 'Bearer invalid_token' };
            (jwtUtils.verifyAccessToken as jest.Mock).mockImplementation(() => { throw new Error('Invalid token'); });

            await authGuard(mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({ code: 'AUTH_TOKEN_INVALID' })
            }));
        });

        it('should return 401 if session is invalid', async () => {
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue({ sub: 1 });
            (jwtUtils.validateUserSession as jest.Mock).mockResolvedValue(false);

            await authGuard(mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({ code: 'AUTH_USER_NOT_FOUND' })
            }));
        });

        it('should call next if token and session are valid', async () => {
            const userPayload = { id: 1, sub: 1, role: 'ADMIN' };
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(userPayload);
            (jwtUtils.validateUserSession as jest.Mock).mockResolvedValue(true);

            await authGuard(mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRequest.user).toEqual(userPayload);
        });
    });

    describe('rbacGuard', () => {
        it('should call next if user has required role', () => {
            mockRequest.user = { id: 1, role: users_role.ADMIN } as any;
            const middleware = rbacGuard(users_role.ADMIN);

            middleware(mockRequest as any, mockResponse as any, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should return 403 if user does not have required role', () => {
            mockRequest.user = { id: 1, role: users_role.CUSTOMER } as any;
            const middleware = rbacGuard(users_role.ADMIN);

            middleware(mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Forbidden: Insufficient permissions' }));
        });

        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;
            const middleware = rbacGuard(users_role.ADMIN);

            middleware(mockRequest as any, mockResponse as any, mockNext);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });
});
