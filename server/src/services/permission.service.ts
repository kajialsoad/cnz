import prisma from '../utils/prisma';
import { users_role } from '@prisma/client';

// Permission structure interfaces
export interface Permissions {
    zones: number[];
    wards: number[];
    categories: string[];
    features: {
        // Complaint Management
        canViewComplaints: boolean;
        canApproveComplaints: boolean;
        canRejectComplaints: boolean;
        canMarkComplaintsPending: boolean;
        canEditComplaints: boolean;
        canDeleteComplaints: boolean;

        // User Management
        canViewUsers: boolean;
        canEditUsers: boolean;
        canDeleteUsers: boolean;
        canAddUsers: boolean;

        // Admin Management
        canViewAdmins: boolean;
        canEditAdmins: boolean;
        canDeleteAdmins: boolean;
        canAddAdmins: boolean;

        // Messaging
        canViewMessages: boolean;
        canSendMessagesToUsers: boolean;
        canSendMessagesToAdmins: boolean;

        // Analytics & Reports
        canViewAnalytics: boolean;
        canExportData: boolean;
        canDownloadReports: boolean;

        // View Only Mode (overrides all other permissions)
        viewOnlyMode: boolean;
    };
}

export interface PermissionsDto {
    zones?: number[];
    wards?: number[];
    categories?: string[];
    features?: Partial<Permissions['features']>;
}

export class PermissionService {
    /**
     * Get user permissions
     * Returns the permissions JSON from the user record
     */
    async getPermissions(userId: number): Promise<Permissions | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                permissions: true,
                role: true,
                zoneId: true,
                wardId: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // If permissions are not set, return default permissions for the role
        if (!user.permissions) {
            return this.getDefaultPermissions(user.role, user.zoneId, user.wardId);
        }

        return user.permissions as unknown as Permissions;
    }

    /**
     * Update user permissions
     * Validates and updates the permissions JSON field
     */
    async updatePermissions(userId: number, permissions: PermissionsDto): Promise<Permissions> {
        // Get current user to check role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                permissions: true,
                zoneId: true,
                wardId: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get current permissions or defaults
        const currentPermissions = user.permissions
            ? (user.permissions as unknown as Permissions)
            : this.getDefaultPermissions(user.role, user.zoneId, user.wardId);

        // Merge with new permissions
        const updatedPermissions: Permissions = {
            zones: permissions.zones !== undefined ? permissions.zones : currentPermissions.zones,
            wards: permissions.wards !== undefined ? permissions.wards : currentPermissions.wards,
            categories: permissions.categories !== undefined ? permissions.categories : currentPermissions.categories,
            features: {
                ...currentPermissions.features,
                ...permissions.features,
            },
        };

        // Validate permissions structure
        if (!this.validatePermissions(updatedPermissions)) {
            throw new Error('Invalid permissions structure');
        }

        // Update user permissions
        await prisma.user.update({
            where: { id: userId },
            data: {
                permissions: updatedPermissions as any,
            },
        });

        return updatedPermissions;
    }

    /**
     * Check if user has a specific permission
     * Returns true if the user has the specified permission
     */
    async hasPermission(userId: number, permission: keyof Permissions['features']): Promise<boolean> {
        const permissions = await this.getPermissions(userId);

        if (!permissions) {
            return false;
        }

        return permissions.features[permission] === true;
    }

    /**
     * Check if user has access to a specific zone
     */
    async hasZoneAccess(userId: number, zoneId: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                zoneId: true,
                permissions: true,
            },
        });

        if (!user) {
            return false;
        }

        // MASTER_ADMIN has access to all zones
        if (user.role === users_role.MASTER_ADMIN) {
            return true;
        }

        // SUPER_ADMIN has access to their assigned zone
        if (user.role === users_role.SUPER_ADMIN) {
            return user.zoneId === zoneId;
        }

        // Check permissions for other roles
        const permissions = user.permissions as Permissions | null;
        if (!permissions) {
            return false;
        }

        return permissions.zones.includes(zoneId);
    }

    /**
     * Check if user has access to a specific ward
     */
    async hasWardAccess(userId: number, wardId: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                zoneId: true,
                wardId: true,
                permissions: true,
            },
        });

        if (!user) {
            return false;
        }

        // MASTER_ADMIN has access to all wards
        if (user.role === users_role.MASTER_ADMIN) {
            return true;
        }

        // SUPER_ADMIN has access to all wards in their zone
        if (user.role === users_role.SUPER_ADMIN && user.zoneId) {
            const ward = await prisma.ward.findUnique({
                where: { id: wardId },
                select: { zoneId: true },
            });
            return ward?.zoneId === user.zoneId;
        }

        // ADMIN has access to their assigned ward
        if (user.role === users_role.ADMIN) {
            return user.wardId === wardId;
        }

        // Check permissions for other roles
        const permissions = user.permissions as Permissions | null;
        if (!permissions) {
            return false;
        }

        return permissions.wards.includes(wardId);
    }

    /**
     * Check if user has access to a specific category
     */
    async hasCategoryAccess(userId: number, category: string): Promise<boolean> {
        const permissions = await this.getPermissions(userId);

        if (!permissions) {
            return false;
        }

        // If categories array is empty, allow all categories
        if (permissions.categories.length === 0) {
            return true;
        }

        return permissions.categories.includes(category);
    }

    /**
     * Get default permissions for a role
     * Returns appropriate default permissions based on user role and assignments
     */
    getDefaultPermissions(role: users_role, zoneId?: number | null, wardId?: number | null): Permissions {
        switch (role) {
            case users_role.MASTER_ADMIN:
                return {
                    zones: [], // Empty means all zones
                    wards: [], // Empty means all wards
                    categories: [], // Empty means all categories
                    features: {
                        // Complaint Management
                        canViewComplaints: true,
                        canApproveComplaints: true,
                        canRejectComplaints: true,
                        canMarkComplaintsPending: true,
                        canEditComplaints: true,
                        canDeleteComplaints: true,

                        // User Management
                        canViewUsers: true,
                        canEditUsers: true,
                        canDeleteUsers: true,
                        canAddUsers: true,

                        // Admin Management
                        canViewAdmins: true,
                        canEditAdmins: true,
                        canDeleteAdmins: true,
                        canAddAdmins: true,

                        // Messaging
                        canViewMessages: true,
                        canSendMessagesToUsers: true,
                        canSendMessagesToAdmins: true,

                        // Analytics & Reports
                        canViewAnalytics: true,
                        canExportData: true,
                        canDownloadReports: true,

                        // View Only Mode
                        viewOnlyMode: false,
                    },
                };

            case users_role.SUPER_ADMIN:
                return {
                    zones: zoneId ? [zoneId] : [],
                    wards: [], // Empty means all wards in their zone
                    categories: [], // Empty means all categories
                    features: {
                        // Complaint Management
                        canViewComplaints: true,
                        canApproveComplaints: true,
                        canRejectComplaints: true,
                        canMarkComplaintsPending: true,
                        canEditComplaints: true,
                        canDeleteComplaints: false,

                        // User Management
                        canViewUsers: true,
                        canEditUsers: true,
                        canDeleteUsers: false,
                        canAddUsers: true,

                        // Admin Management
                        canViewAdmins: true,
                        canEditAdmins: true,
                        canDeleteAdmins: false,
                        canAddAdmins: true,

                        // Messaging
                        canViewMessages: true,
                        canSendMessagesToUsers: true,
                        canSendMessagesToAdmins: true,

                        // Analytics & Reports
                        canViewAnalytics: true,
                        canExportData: true,
                        canDownloadReports: true,

                        // View Only Mode
                        viewOnlyMode: false,
                    },
                };

            case users_role.ADMIN:
                return {
                    zones: zoneId ? [zoneId] : [],
                    wards: wardId ? [wardId] : [],
                    categories: [], // Empty means all categories
                    features: {
                        // Complaint Management
                        canViewComplaints: true,
                        canApproveComplaints: true,
                        canRejectComplaints: true,
                        canMarkComplaintsPending: true,
                        canEditComplaints: true,
                        canDeleteComplaints: false,

                        // User Management
                        canViewUsers: true,
                        canEditUsers: false,
                        canDeleteUsers: false,
                        canAddUsers: false,

                        // Admin Management
                        canViewAdmins: false,
                        canEditAdmins: false,
                        canDeleteAdmins: false,
                        canAddAdmins: false,

                        // Messaging
                        canViewMessages: true,
                        canSendMessagesToUsers: true,
                        canSendMessagesToAdmins: false,

                        // Analytics & Reports
                        canViewAnalytics: false,
                        canExportData: false,
                        canDownloadReports: false,

                        // View Only Mode
                        viewOnlyMode: false,
                    },
                };

            case users_role.CUSTOMER:
            case users_role.SERVICE_PROVIDER:
            default:
                return {
                    zones: [],
                    wards: [],
                    categories: [],
                    features: {
                        // Complaint Management
                        canViewComplaints: false,
                        canApproveComplaints: false,
                        canRejectComplaints: false,
                        canMarkComplaintsPending: false,
                        canEditComplaints: false,
                        canDeleteComplaints: false,

                        // User Management
                        canViewUsers: false,
                        canEditUsers: false,
                        canDeleteUsers: false,
                        canAddUsers: false,

                        // Admin Management
                        canViewAdmins: false,
                        canEditAdmins: false,
                        canDeleteAdmins: false,
                        canAddAdmins: false,

                        // Messaging
                        canViewMessages: false,
                        canSendMessagesToUsers: false,
                        canSendMessagesToAdmins: false,

                        // Analytics & Reports
                        canViewAnalytics: false,
                        canExportData: false,
                        canDownloadReports: false,

                        // View Only Mode
                        viewOnlyMode: true,
                    },
                };
        }
    }

    /**
     * Validate permissions structure
     * Ensures the permissions object has the correct structure
     */
    validatePermissions(permissions: any): permissions is Permissions {
        if (!permissions || typeof permissions !== 'object') {
            return false;
        }

        // Check zones array
        if (!Array.isArray(permissions.zones)) {
            return false;
        }

        // Check wards array
        if (!Array.isArray(permissions.wards)) {
            return false;
        }

        // Check categories array
        if (!Array.isArray(permissions.categories)) {
            return false;
        }

        // Check features object
        if (!permissions.features || typeof permissions.features !== 'object') {
            return false;
        }

        // Check all required feature flags
        const requiredFeatures = [
            // Complaint Management
            'canViewComplaints',
            'canApproveComplaints',
            'canRejectComplaints',
            'canMarkComplaintsPending',
            'canEditComplaints',
            'canDeleteComplaints',

            // User Management
            'canViewUsers',
            'canEditUsers',
            'canDeleteUsers',
            'canAddUsers',

            // Admin Management
            'canViewAdmins',
            'canEditAdmins',
            'canDeleteAdmins',
            'canAddAdmins',

            // Messaging
            'canViewMessages',
            'canSendMessagesToUsers',
            'canSendMessagesToAdmins',

            // Analytics & Reports
            'canViewAnalytics',
            'canExportData',
            'canDownloadReports',

            // View Only Mode
            'viewOnlyMode',
        ];

        for (const feature of requiredFeatures) {
            if (typeof permissions.features[feature] !== 'boolean') {
                return false;
            }
        }

        return true;
    }

    /**
     * Initialize permissions for a new user
     * Sets default permissions based on role
     */
    async initializePermissions(userId: number): Promise<Permissions> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
                zoneId: true,
                wardId: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const defaultPermissions = this.getDefaultPermissions(user.role, user.zoneId, user.wardId);

        await prisma.user.update({
            where: { id: userId },
            data: {
                permissions: defaultPermissions as any,
            },
        });

        return defaultPermissions;
    }

    /**
     * Get all users with specific permission
     * Useful for finding users who can perform certain actions
     */
    async getUsersWithPermission(permission: keyof Permissions['features']): Promise<number[]> {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: [users_role.MASTER_ADMIN, users_role.SUPER_ADMIN, users_role.ADMIN],
                },
            },
            select: {
                id: true,
                role: true,
                permissions: true,
                zoneId: true,
                wardId: true,
            },
        });

        const userIds: number[] = [];

        for (const user of users) {
            const permissions = user.permissions
                ? (user.permissions as unknown as Permissions)
                : this.getDefaultPermissions(user.role, user.zoneId, user.wardId);

            if (permissions.features[permission]) {
                userIds.push(user.id);
            }
        }

        return userIds;
    }
}

export const permissionService = new PermissionService();
