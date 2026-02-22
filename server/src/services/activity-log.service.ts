import prisma from '../utils/prisma';
import { Prisma, users_role } from '@prisma/client';
import { Parser } from 'json2csv';

// Activity log interfaces
export interface ActivityLog {
    id: number;
    userId: number;
    action: string;
    entityType: string;
    entityId: number | null;
    oldValue: any;
    newValue: any;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: Date;
    user?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string | null;
        role: users_role;
    };
}

export interface CreateActivityLogDto {
    userId: number;
    action: string;
    entityType: string;
    entityId?: number;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
}

export interface ActivityLogQuery {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    entityType?: string;
    entityId?: number;
    startDate?: Date;
    endDate?: Date;
    cityCorporationCode?: string;
}

export interface ActivityLogResponse {
    logs: ActivityLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Action constants
export const ActivityActions = {
    // User actions
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    UPDATE_USER_STATUS: 'UPDATE_USER_STATUS',
    UPDATE_USER_PERMISSIONS: 'UPDATE_USER_PERMISSIONS',

    // Complaint actions
    CREATE_COMPLAINT: 'CREATE_COMPLAINT',
    UPDATE_COMPLAINT: 'UPDATE_COMPLAINT',
    DELETE_COMPLAINT: 'DELETE_COMPLAINT',
    ASSIGN_COMPLAINT: 'ASSIGN_COMPLAINT',
    UPDATE_COMPLAINT_STATUS: 'UPDATE_COMPLAINT_STATUS',

    // Message actions
    SEND_MESSAGE: 'SEND_MESSAGE',
    DELETE_MESSAGE: 'DELETE_MESSAGE',

    // Auth actions
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    FAILED_LOGIN: 'FAILED_LOGIN',

    // Zone/Ward actions
    CREATE_ZONE: 'CREATE_ZONE',
    UPDATE_ZONE: 'UPDATE_ZONE',
    DELETE_ZONE: 'DELETE_ZONE',
    CREATE_WARD: 'CREATE_WARD',
    UPDATE_WARD: 'UPDATE_WARD',
    DELETE_WARD: 'DELETE_WARD',

    // Export actions
    EXPORT_DATA: 'EXPORT_DATA',
} as const;

// Entity type constants
export const EntityTypes = {
    USER: 'USER',
    COMPLAINT: 'COMPLAINT',
    MESSAGE: 'MESSAGE',
    ZONE: 'ZONE',
    WARD: 'WARD',
    CITY_CORPORATION: 'CITY_CORPORATION',
} as const;

export class ActivityLogService {
    /**
     * Log an activity
     * Creates a new activity log entry with old and new values
     */
    async logActivity(data: CreateActivityLogDto): Promise<void> {
        try {
            await prisma.activityLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId || null,
                    oldValue: data.oldValue ? (typeof data.oldValue === 'object' ? JSON.stringify(data.oldValue) : String(data.oldValue)) : null,
                    newValue: data.newValue ? (typeof data.newValue === 'object' ? JSON.stringify(data.newValue) : String(data.newValue)) : null,
                    ipAddress: data.ipAddress || null,
                    userAgent: data.userAgent || null,
                },
            });
        } catch (error) {
            // Log error but don't throw - activity logging should not break the main flow
            console.error('Failed to log activity:', error);
        }
    }

    /**
     * Get activity logs with filters and pagination
     * Supports filtering by user, action, entity, date range, and city corporation
     */
    async getActivityLogs(
        query: ActivityLogQuery,
        requestingUser?: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null }
    ): Promise<ActivityLogResponse> {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ActivityLogWhereInput = {};

        // Apply user filter
        if (query.userId) {
            where.userId = query.userId;
        }

        // Apply action filter
        if (query.action) {
            where.action = query.action;
        }

        // Apply entity type filter
        if (query.entityType) {
            where.entityType = query.entityType;
        }

        // Apply entity ID filter
        if (query.entityId) {
            where.entityId = query.entityId;
        }

        // Apply date range filter
        if (query.startDate || query.endDate) {
            where.timestamp = {};
            if (query.startDate) {
                where.timestamp.gte = query.startDate;
            }
            if (query.endDate) {
                where.timestamp.lte = query.endDate;
            }
        }

        // Apply role-based filtering
        if (requestingUser) {
            await this.applyRoleBasedFiltering(where, requestingUser, query.cityCorporationCode);
        }

        // Get total count
        const total = await prisma.activityLog.count({ where });

        // Get logs with pagination
        const logs = await prisma.activityLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get activity logs for a specific user
     * Returns recent activity logs for the specified user
     */
    async getUserActivityLogs(userId: number, limit: number = 10): Promise<ActivityLog[]> {
        const logs = await prisma.activityLog.findMany({
            where: { userId },
            take: limit,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return logs;
    }

    /**
     * Get activity logs for a specific entity
     * Returns all activity logs related to a specific entity
     */
    async getEntityActivityLogs(entityType: string, entityId: number): Promise<ActivityLog[]> {
        const logs = await prisma.activityLog.findMany({
            where: {
                entityType,
                entityId,
            },
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        return logs;
    }

    /**
     * Export activity logs to CSV
     * Generates a CSV file with filtered activity logs
     */
    async exportActivityLogs(
        query: ActivityLogQuery,
        requestingUser?: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null }
    ): Promise<Buffer> {
        // Get all logs matching the query (without pagination)
        const where: Prisma.ActivityLogWhereInput = {};

        if (query.userId) {
            where.userId = query.userId;
        }

        if (query.action) {
            where.action = query.action;
        }

        if (query.entityType) {
            where.entityType = query.entityType;
        }

        if (query.entityId) {
            where.entityId = query.entityId;
        }

        if (query.startDate || query.endDate) {
            where.timestamp = {};
            if (query.startDate) {
                where.timestamp.gte = query.startDate;
            }
            if (query.endDate) {
                where.timestamp.lte = query.endDate;
            }
        }

        // Apply role-based filtering
        if (requestingUser) {
            await this.applyRoleBasedFiltering(where, requestingUser, query.cityCorporationCode);
        }

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // Transform logs for CSV export
        const csvData = logs.map(log => ({
            id: log.id,
            timestamp: log.timestamp.toISOString(),
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId || '',
            userId: log.userId,
            userName: `${log.user.firstName} ${log.user.lastName}`,
            userEmail: log.user.email || '',
            userRole: log.user.role,
            oldValue: log.oldValue ? JSON.stringify(log.oldValue) : '',
            newValue: log.newValue ? JSON.stringify(log.newValue) : '',
            ipAddress: log.ipAddress || '',
            userAgent: log.userAgent || '',
        }));

        // Convert to CSV
        const parser = new Parser({
            fields: [
                'id',
                'timestamp',
                'action',
                'entityType',
                'entityId',
                'userId',
                'userName',
                'userEmail',
                'userRole',
                'oldValue',
                'newValue',
                'ipAddress',
                'userAgent',
            ],
        });

        const csv = parser.parse(csvData);
        return Buffer.from(csv, 'utf-8');
    }

    /**
     * Get activity statistics
     * Returns statistics about activity logs
     */
    async getActivityStatistics(
        startDate?: Date,
        endDate?: Date,
        cityCorporationCode?: string
    ): Promise<{
        totalActivities: number;
        activitiesByAction: { action: string; count: number }[];
        activitiesByUser: { userId: number; userName: string; count: number }[];
        activitiesByEntityType: { entityType: string; count: number }[];
    }> {
        const where: Prisma.ActivityLogWhereInput = {};

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = startDate;
            }
            if (endDate) {
                where.timestamp.lte = endDate;
            }
        }

        // Total activities
        const totalActivities = await prisma.activityLog.count({ where });

        // Activities by action
        const activitiesByAction = await prisma.activityLog.groupBy({
            by: ['action'],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        // Activities by user
        const activitiesByUserRaw = await prisma.activityLog.groupBy({
            by: ['userId'],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
            take: 10,
        });

        // Get user details
        const userIds = activitiesByUserRaw.map(a => a.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });

        const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

        const activitiesByUser = activitiesByUserRaw.map(a => ({
            userId: a.userId,
            userName: userMap.get(a.userId) || 'Unknown',
            count: a._count.id,
        }));

        // Activities by entity type
        const activitiesByEntityType = await prisma.activityLog.groupBy({
            by: ['entityType'],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                _count: {
                    id: 'desc',
                },
            },
        });

        return {
            totalActivities,
            activitiesByAction: activitiesByAction.map(a => ({
                action: a.action,
                count: a._count.id,
            })),
            activitiesByUser,
            activitiesByEntityType: activitiesByEntityType.map(a => ({
                entityType: a.entityType,
                count: a._count.id,
            })),
        };
    }

    /**
     * Delete old activity logs
     * Removes activity logs older than the specified number of days
     */
    async deleteOldLogs(daysToKeep: number = 365): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await prisma.activityLog.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    }

    /**
     * Apply role-based filtering to activity logs
     * Filters logs based on the requesting user's role and assignments
     */
    private async applyRoleBasedFiltering(
        where: Prisma.ActivityLogWhereInput,
        requestingUser: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null },
        cityCorporationCode?: string
    ): Promise<void> {
        // MASTER_ADMIN: Can see all logs
        if (requestingUser.role === users_role.MASTER_ADMIN) {
            // Optionally filter by city corporation
            if (cityCorporationCode) {
                where.user = {
                    cityCorporationCode,
                };
            }
            return;
        }

        // SUPER_ADMIN: Can see logs from users in their zone
        if (requestingUser.role === users_role.SUPER_ADMIN) {
            where.user = {
                zoneId: requestingUser.zoneId || undefined,
            };
            return;
        }

        // ADMIN: Can see only their own logs
        if (requestingUser.role === users_role.ADMIN) {
            where.userId = requestingUser.id;
            return;
        }

        // Other roles: No access to activity logs
        where.userId = -1; // This will return no results
    }

    /**
     * Log user creation
     * Helper method to log user creation with proper formatting
     */
    async logUserCreation(
        createdBy: number,
        createdUser: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId: createdBy,
            action: ActivityActions.CREATE_USER,
            entityType: EntityTypes.USER,
            entityId: createdUser.id,
            newValue: {
                id: createdUser.id,
                name: `${createdUser.firstName} ${createdUser.lastName}`,
                email: createdUser.email,
                phone: createdUser.phone,
                role: createdUser.role,
                cityCorporationCode: createdUser.cityCorporationCode,
                zoneId: createdUser.zoneId,
                wardId: createdUser.wardId,
            },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log user update
     * Helper method to log user updates with old and new values
     */
    async logUserUpdate(
        updatedBy: number,
        oldUser: any,
        newUser: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId: updatedBy,
            action: ActivityActions.UPDATE_USER,
            entityType: EntityTypes.USER,
            entityId: newUser.id,
            oldValue: {
                name: `${oldUser.firstName} ${oldUser.lastName}`,
                email: oldUser.email,
                phone: oldUser.phone,
                role: oldUser.role,
                status: oldUser.status,
                cityCorporationCode: oldUser.cityCorporationCode,
                zoneId: oldUser.zoneId,
                wardId: oldUser.wardId,
            },
            newValue: {
                name: `${newUser.firstName} ${newUser.lastName}`,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                status: newUser.status,
                cityCorporationCode: newUser.cityCorporationCode,
                zoneId: newUser.zoneId,
                wardId: newUser.wardId,
            },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log user deletion
     * Helper method to log user deletion
     */
    async logUserDeletion(
        deletedBy: number,
        deletedUser: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId: deletedBy,
            action: ActivityActions.DELETE_USER,
            entityType: EntityTypes.USER,
            entityId: deletedUser.id,
            oldValue: {
                id: deletedUser.id,
                name: `${deletedUser.firstName} ${deletedUser.lastName}`,
                email: deletedUser.email,
                phone: deletedUser.phone,
                role: deletedUser.role,
            },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log permission update
     * Helper method to log permission changes
     */
    async logPermissionUpdate(
        updatedBy: number,
        userId: number,
        oldPermissions: any,
        newPermissions: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId: updatedBy,
            action: ActivityActions.UPDATE_USER_PERMISSIONS,
            entityType: EntityTypes.USER,
            entityId: userId,
            oldValue: oldPermissions,
            newValue: newPermissions,
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log login
     * Helper method to log user login
     */
    async logLogin(
        userId: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId,
            action: ActivityActions.LOGIN,
            entityType: EntityTypes.USER,
            entityId: userId,
            ipAddress,
            userAgent,
        });
    }

    /**
     * Log logout
     * Helper method to log user logout
     */
    async logLogout(
        userId: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.logActivity({
            userId,
            action: ActivityActions.LOGOUT,
            entityType: EntityTypes.USER,
            entityId: userId,
            ipAddress,
            userAgent,
        });
    }
}

export const activityLogService = new ActivityLogService();
