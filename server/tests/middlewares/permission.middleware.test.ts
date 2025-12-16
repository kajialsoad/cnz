import { Request, Response, NextFunction } from 'express';
import {
    requirePermission,
    requireZoneAccess,
    requireWardAccess,
    blockIfViewOnly,
    requireAdminManagementPermission,
} from '../../src/middlewares/permission.middleware';
import { permissionService } from '../../src/services/permission.service';
import { users_role } from '@prisma/client';

// Mock the permission service
jest.mock('../../src/services/permission.service');

describe('Permission Middleware', () => {
    let mockRequest: any;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            user: {
                id: 1,
                role: users_role.ADMIN,
            },
            params: {},
            body: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        nextFunction = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('requirePermission', () => {
        it('should allow access if user has permission', async () => {
            (permissionService.hasPermission as jest.Mock).mockResolvedValue(true);

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(permissionService.hasPermission).toHaveBeenCalledWith(1, 'canViewComplaints');
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny access if user does not have permission', async () => {
            (permissionService.hasPermission as jest.Mock).mockResolvedValue(false);

            const middleware = requirePermission('canDeleteComplaints');
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(permissionService.hasPermission).toHaveBeenCalledWith(1, 'canDeleteComplaints');
            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'You do not have permission to canDeleteComplaints',
                },
            });
        });

        it('should return 401 if user is not authenticated', async () => {
            mockRequest.user = undefined;

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });
    });

    describe('requireZoneAccess', () => {
        it('should allow access if user has zone access', async () => {
            mockRequest.params = { zoneId: '5' };
            (permissionService.hasZoneAccess as jest.Mock).mockResolvedValue(true);

            const middleware = requireZoneAccess();
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(permissionService.hasZoneAccess).toHaveBeenCalledWith(1, 5);
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should deny access if user does not have zone access', async () => {
            mockRequest.params = { zoneId: '5' };
            (permissionService.hasZoneAccess as jest.Mock).mockResolvedValue(false);

            const middleware = requireZoneAccess();
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTH_ZONE_MISMATCH',
                    message: 'You do not have access to this zone',
                },
            });
        });

        it('should return 400 if zone ID is invalid', async () => {
            mockRequest.params = { zoneId: 'invalid' };

            const middleware = requireZoneAccess();
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });

    describe('requireWardAccess', () => {
        it('should allow access if user has ward access', async () => {
            mockRequest.params = { wardId: '10' };
            (permissionService.hasWardAccess as jest.Mock).mockResolvedValue(true);

            const middleware = requireWardAccess();
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(permissionService.hasWardAccess).toHaveBeenCalledWith(1, 10);
            expect(nextFunction).toHaveBeenCalled();
        });

        it('should deny access if user does not have ward access', async () => {
            mockRequest.params = { wardId: '10' };
            (permissionService.hasWardAccess as jest.Mock).mockResolvedValue(false);

            const middleware = requireWardAccess();
            await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });

    describe('blockIfViewOnly', () => {
        it('should allow access if user is not in view-only mode', async () => {
            (permissionService.getPermissions as jest.Mock).mockResolvedValue({
                features: {
                    viewOnlyMode: false,
                },
            });

            await blockIfViewOnly(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should block access if user is in view-only mode', async () => {
            (permissionService.getPermissions as jest.Mock).mockResolvedValue({
                features: {
                    viewOnlyMode: true,
                },
            });

            await blockIfViewOnly(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTH_VIEW_ONLY_MODE',
                    message: 'This action is not allowed in view-only mode',
                },
            });
        });
    });

    describe('requireAdminManagementPermission', () => {
        it('should allow Master Admin to manage admins', async () => {
            mockRequest.user = {
                id: 1,
                role: users_role.MASTER_ADMIN,
            };
            (permissionService.hasPermission as jest.Mock).mockResolvedValue(true);

            await requireAdminManagementPermission(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should allow Super Admin to manage admins', async () => {
            mockRequest.user = {
                id: 1,
                role: users_role.SUPER_ADMIN,
            };
            (permissionService.hasPermission as jest.Mock).mockResolvedValue(true);

            await requireAdminManagementPermission(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalled();
        });

        it('should deny Admin from managing other admins', async () => {
            mockRequest.user = {
                id: 1,
                role: users_role.ADMIN,
            };

            await requireAdminManagementPermission(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    message: 'Admins cannot manage other admins',
                },
            });
        });
    });
});
