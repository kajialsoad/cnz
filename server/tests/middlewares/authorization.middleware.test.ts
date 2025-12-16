import { Request, Response, NextFunction } from 'express';
import { users_role } from '@prisma/client';
import {
    requireRole,
    validateCityCorporationAccess,
    validateZoneAccess,
    validateWardAccess,
    requirePermission,
    authorize,
    requireMasterAdmin,
    requireMasterOrSuperAdmin,
    requireAnyAdmin,
    requireAdminManagementAccess,
    requireSuperAdminManagementAccess,
} from '../../src/middlewares/authorization.middleware';
import { AuthRequest } from '../../src/middlewares/auth.middleware';
import { permissionService } from '../../src/services/permission.service';

// Mock permission service
jest.mock('../../src/services/permission.service');

describe('Authorization Middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockRequest = {
            user: undefined,
            params: {},
            query: {},
            body: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    describe('requireRole', () => {
        it('should allow access for users with required role', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
            };

            const middleware = requireRole(users_role.MASTER_ADMIN);
            middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny access for users without required role', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
            };

            const middleware = requireRole(users_role.MASTER_ADMIN);
            middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_ROLE_NOT_AUTHORIZED',
                    }),
                })
            );
        });

        it('should allow access for users with any of multiple required roles', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            const middleware = requireRole(users_role.MASTER_ADMIN, users_role.SUPER_ADMIN);
            middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;

            const middleware = requireRole(users_role.MASTER_ADMIN);
            middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_TOKEN_MISSING',
                    }),
                })
            );
        });
    });

    describe('validateCityCorporationAccess', () => {
        it('should allow MASTER_ADMIN to access any City Corporation', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
                cityCorporationCode: 'DSCC',
            };
            mockRequest.params = { cityCorporationCode: 'DNCC' };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow SUPER_ADMIN to access their assigned City Corporation', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'DSCC',
            };
            mockRequest.params = { cityCorporationCode: 'DSCC' };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny SUPER_ADMIN access to different City Corporation', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'DSCC',
            };
            mockRequest.params = { cityCorporationCode: 'DNCC' };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_CITY_CORPORATION_MISMATCH',
                    }),
                })
            );
        });

        it('should allow access when no City Corporation is requested', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'DSCC',
            };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should check City Corporation from query parameters', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'DSCC',
            };
            mockRequest.query = { cityCorporationCode: 'DSCC' };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
        });

        it('should check City Corporation from body', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                cityCorporationCode: 'DSCC',
            };
            mockRequest.body = { cityCorporationCode: 'DSCC' };

            validateCityCorporationAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('validateZoneAccess', () => {
        it('should allow MASTER_ADMIN to access any zone', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
                zoneId: 1,
            };
            mockRequest.params = { zoneId: '2' };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow SUPER_ADMIN to access their assigned zone', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                zoneId: 1,
            };
            mockRequest.params = { zoneId: '1' };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny SUPER_ADMIN access to different zone', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                zoneId: 1,
            };
            mockRequest.params = { zoneId: '2' };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_ZONE_MISMATCH',
                    }),
                })
            );
        });

        it('should deny ADMIN access to zone-level data', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
                wardId: 1,
            };
            mockRequest.params = { zoneId: '1' };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    }),
                })
            );
        });

        it('should return 400 for invalid zone ID format', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                zoneId: 1,
            };
            mockRequest.params = { zoneId: 'invalid' };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'VALIDATION_FAILED',
                    }),
                })
            );
        });

        it('should allow access when no zone is requested', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                zoneId: 1,
            };

            validateZoneAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('validateWardAccess', () => {
        it('should allow MASTER_ADMIN to access any ward', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
                wardId: 1,
            };
            mockRequest.params = { wardId: '2' };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow SUPER_ADMIN to access wards in their zone', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
                zoneId: 1,
            };
            mockRequest.params = { wardId: '1' };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow ADMIN to access their assigned ward', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
                wardId: 1,
            };
            mockRequest.params = { wardId: '1' };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny ADMIN access to different ward', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
                wardId: 1,
            };
            mockRequest.params = { wardId: '2' };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_WARD_MISMATCH',
                    }),
                })
            );
        });

        it('should return 400 for invalid ward ID format', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
                wardId: 1,
            };
            mockRequest.params = { wardId: 'invalid' };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });

        it('should allow access when no ward is requested', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
                wardId: 1,
            };

            validateWardAccess(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });

    describe('requirePermission', () => {
        it('should allow MASTER_ADMIN without checking permissions', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
            };

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(permissionService.hasPermission).not.toHaveBeenCalled();
        });

        it('should allow users with required permission', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            (permissionService.hasPermission as jest.Mock).mockResolvedValue(true);

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(permissionService.hasPermission).toHaveBeenCalledWith(1, 'canViewComplaints');
        });

        it('should deny users without required permission', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            (permissionService.hasPermission as jest.Mock).mockResolvedValue(false);

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                    }),
                })
            );
        });

        it('should return 401 if user is not authenticated', async () => {
            mockRequest.user = undefined;

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
        });

        it('should handle permission check errors', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            (permissionService.hasPermission as jest.Mock).mockRejectedValue(
                new Error('Database error')
            );

            const middleware = requirePermission('canViewComplaints');
            await middleware(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('requireAdminManagementAccess', () => {
        it('should allow MASTER_ADMIN to manage admins', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
            };

            await requireAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should allow SUPER_ADMIN with permission to manage admins', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            (permissionService.hasPermission as jest.Mock).mockResolvedValue(true);

            await requireAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(permissionService.hasPermission).toHaveBeenCalledWith(1, 'canViewAdmins');
        });

        it('should deny SUPER_ADMIN without permission', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            (permissionService.hasPermission as jest.Mock).mockResolvedValue(false);

            await requireAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });

        it('should deny ADMIN from managing admins', async () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
            };

            await requireAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        message: 'Admins cannot manage other admins',
                    }),
                })
            );
        });
    });

    describe('requireSuperAdminManagementAccess', () => {
        it('should allow MASTER_ADMIN to manage super admins', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
            };

            requireSuperAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });

        it('should deny SUPER_ADMIN from managing super admins', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            requireSuperAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        message: 'Only Master Admins can manage Super Admins',
                    }),
                })
            );
        });

        it('should deny ADMIN from managing super admins', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
            };

            requireSuperAdminManagementAccess(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(403);
        });
    });

    describe('Shorthand middleware', () => {
        it('requireMasterAdmin should only allow MASTER_ADMIN', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.MASTER_ADMIN,
            };

            requireMasterAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('requireMasterOrSuperAdmin should allow MASTER_ADMIN and SUPER_ADMIN', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.SUPER_ADMIN,
            };

            requireMasterOrSuperAdmin(
                mockRequest as AuthRequest,
                mockResponse as Response,
                mockNext
            );

            expect(mockNext).toHaveBeenCalled();
        });

        it('requireAnyAdmin should allow all admin roles', () => {
            mockRequest.user = {
                id: 1,
                sub: 1,
                role: users_role.ADMIN,
            };

            requireAnyAdmin(mockRequest as AuthRequest, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });
});
