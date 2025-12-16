import { permissionService, Permissions } from '../../src/services/permission.service';
import { users_role } from '@prisma/client';
import prisma from '../../src/utils/prisma';

// Mock Prisma
jest.mock('../../src/utils/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
        },
        ward: {
            findUnique: jest.fn(),
        },
    },
}));

describe('PermissionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getDefaultPermissions', () => {
        it('should return full permissions for MASTER_ADMIN', () => {
            const permissions = permissionService.getDefaultPermissions(users_role.MASTER_ADMIN);

            expect(permissions.features.canViewComplaints).toBe(true);
            expect(permissions.features.canEditComplaints).toBe(true);
            expect(permissions.features.canDeleteComplaints).toBe(true);
            expect(permissions.features.canViewUsers).toBe(true);
            expect(permissions.features.canEditUsers).toBe(true);
            expect(permissions.features.canDeleteUsers).toBe(true);
            expect(permissions.features.canViewMessages).toBe(true);
            expect(permissions.features.canSendMessages).toBe(true);
            expect(permissions.features.canViewAnalytics).toBe(true);
            expect(permissions.features.canExportData).toBe(true);
        });

        it('should return limited permissions for SUPER_ADMIN', () => {
            const permissions = permissionService.getDefaultPermissions(users_role.SUPER_ADMIN, 1);

            expect(permissions.zones).toEqual([1]);
            expect(permissions.features.canViewComplaints).toBe(true);
            expect(permissions.features.canDeleteComplaints).toBe(false);
            expect(permissions.features.canDeleteUsers).toBe(false);
        });

        it('should return restricted permissions for ADMIN', () => {
            const permissions = permissionService.getDefaultPermissions(users_role.ADMIN, 1, 5);

            expect(permissions.zones).toEqual([1]);
            expect(permissions.wards).toEqual([5]);
            expect(permissions.features.canViewComplaints).toBe(true);
            expect(permissions.features.canEditUsers).toBe(false);
            expect(permissions.features.canViewAnalytics).toBe(false);
            expect(permissions.features.canExportData).toBe(false);
        });

        it('should return no permissions for CUSTOMER', () => {
            const permissions = permissionService.getDefaultPermissions(users_role.CUSTOMER);

            expect(permissions.features.canViewComplaints).toBe(false);
            expect(permissions.features.canEditComplaints).toBe(false);
            expect(permissions.features.canViewUsers).toBe(false);
        });
    });

    describe('validatePermissions', () => {
        it('should validate correct permissions structure', () => {
            const validPermissions: Permissions = {
                zones: [1, 2],
                wards: [5, 6],
                categories: ['waste', 'water'],
                features: {
                    canViewComplaints: true,
                    canEditComplaints: true,
                    canDeleteComplaints: false,
                    canViewUsers: true,
                    canEditUsers: false,
                    canDeleteUsers: false,
                    canViewMessages: true,
                    canSendMessages: true,
                    canViewAnalytics: false,
                    canExportData: false,
                },
            };

            expect(permissionService.validatePermissions(validPermissions)).toBe(true);
        });

        it('should reject invalid permissions structure - missing zones', () => {
            const invalidPermissions = {
                wards: [5, 6],
                categories: ['waste'],
                features: {
                    canViewComplaints: true,
                    canEditComplaints: true,
                    canDeleteComplaints: false,
                    canViewUsers: true,
                    canEditUsers: false,
                    canDeleteUsers: false,
                    canViewMessages: true,
                    canSendMessages: true,
                    canViewAnalytics: false,
                    canExportData: false,
                },
            };

            expect(permissionService.validatePermissions(invalidPermissions)).toBe(false);
        });

        it('should reject invalid permissions structure - missing features', () => {
            const invalidPermissions = {
                zones: [1],
                wards: [5],
                categories: ['waste'],
                features: {
                    canViewComplaints: true,
                    // Missing other features
                },
            };

            expect(permissionService.validatePermissions(invalidPermissions)).toBe(false);
        });

        it('should reject invalid permissions structure - non-boolean feature', () => {
            const invalidPermissions = {
                zones: [1],
                wards: [5],
                categories: ['waste'],
                features: {
                    canViewComplaints: 'yes', // Should be boolean
                    canEditComplaints: true,
                    canDeleteComplaints: false,
                    canViewUsers: true,
                    canEditUsers: false,
                    canDeleteUsers: false,
                    canViewMessages: true,
                    canSendMessages: true,
                    canViewAnalytics: false,
                    canExportData: false,
                },
            };

            expect(permissionService.validatePermissions(invalidPermissions)).toBe(false);
        });
    });

    describe('hasZoneAccess', () => {
        it('should allow MASTER_ADMIN access to any zone', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.MASTER_ADMIN,
                zoneId: null,
                permissions: null,
            });

            const hasAccess = await permissionService.hasZoneAccess(1, 5);
            expect(hasAccess).toBe(true);
        });

        it('should allow SUPER_ADMIN access to their assigned zone', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                permissions: null,
            });

            const hasAccess = await permissionService.hasZoneAccess(1, 5);
            expect(hasAccess).toBe(true);
        });

        it('should deny SUPER_ADMIN access to other zones', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                permissions: null,
            });

            const hasAccess = await permissionService.hasZoneAccess(1, 10);
            expect(hasAccess).toBe(false);
        });
    });

    describe('hasWardAccess', () => {
        it('should allow MASTER_ADMIN access to any ward', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.MASTER_ADMIN,
                zoneId: null,
                wardId: null,
                permissions: null,
            });

            const hasAccess = await permissionService.hasWardAccess(1, 10);
            expect(hasAccess).toBe(true);
        });

        it('should allow ADMIN access to their assigned ward', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.ADMIN,
                zoneId: 5,
                wardId: 10,
                permissions: null,
            });

            const hasAccess = await permissionService.hasWardAccess(1, 10);
            expect(hasAccess).toBe(true);
        });

        it('should deny ADMIN access to other wards', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.ADMIN,
                zoneId: 5,
                wardId: 10,
                permissions: null,
            });

            const hasAccess = await permissionService.hasWardAccess(1, 15);
            expect(hasAccess).toBe(false);
        });

        it('should allow SUPER_ADMIN access to wards in their zone', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.SUPER_ADMIN,
                zoneId: 5,
                wardId: null,
                permissions: null,
            });

            (prisma.ward.findUnique as jest.Mock).mockResolvedValue({
                zoneId: 5,
            });

            const hasAccess = await permissionService.hasWardAccess(1, 10);
            expect(hasAccess).toBe(true);
        });
    });

    describe('hasCategoryAccess', () => {
        it('should allow access to all categories when categories array is empty', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.ADMIN,
                zoneId: 1,
                wardId: 5,
                permissions: {
                    zones: [1],
                    wards: [5],
                    categories: [], // Empty means all categories
                    features: {
                        canViewComplaints: true,
                        canEditComplaints: true,
                        canDeleteComplaints: false,
                        canViewUsers: true,
                        canEditUsers: false,
                        canDeleteUsers: false,
                        canViewMessages: true,
                        canSendMessages: true,
                        canViewAnalytics: false,
                        canExportData: false,
                    },
                },
            });

            const hasAccess = await permissionService.hasCategoryAccess(1, 'waste');
            expect(hasAccess).toBe(true);
        });

        it('should allow access to specified categories only', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({
                role: users_role.ADMIN,
                zoneId: 1,
                wardId: 5,
                permissions: {
                    zones: [1],
                    wards: [5],
                    categories: ['waste', 'water'],
                    features: {
                        canViewComplaints: true,
                        canEditComplaints: true,
                        canDeleteComplaints: false,
                        canViewUsers: true,
                        canEditUsers: false,
                        canDeleteUsers: false,
                        canViewMessages: true,
                        canSendMessages: true,
                        canViewAnalytics: false,
                        canExportData: false,
                    },
                },
            });

            const hasAccessWaste = await permissionService.hasCategoryAccess(1, 'waste');
            expect(hasAccessWaste).toBe(true);

            const hasAccessRoad = await permissionService.hasCategoryAccess(1, 'road');
            expect(hasAccessRoad).toBe(false);
        });
    });
});
