"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityLogService = exports.ActivityLogService = exports.EntityTypes = exports.ActivityActions = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const json2csv_1 = require("json2csv");
// Action constants
exports.ActivityActions = {
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
};
// Entity type constants
exports.EntityTypes = {
    USER: 'USER',
    COMPLAINT: 'COMPLAINT',
    MESSAGE: 'MESSAGE',
    ZONE: 'ZONE',
    WARD: 'WARD',
    CITY_CORPORATION: 'CITY_CORPORATION',
};
class ActivityLogService {
    /**
     * Log an activity
     * Creates a new activity log entry with old and new values
     */
    async logActivity(data) {
        try {
            await prisma_1.default.activityLog.create({
                data: {
                    userId: data.userId,
                    action: data.action,
                    entityType: data.entityType,
                    entityId: data.entityId || null,
                    oldValue: data.oldValue || null,
                    newValue: data.newValue || null,
                    ipAddress: data.ipAddress || null,
                    userAgent: data.userAgent || null,
                },
            });
        }
        catch (error) {
            // Log error but don't throw - activity logging should not break the main flow
            console.error('Failed to log activity:', error);
        }
    }
    /**
     * Get activity logs with filters and pagination
     * Supports filtering by user, action, entity, date range, and city corporation
     */
    async getActivityLogs(query, requestingUser) {
        const page = query.page || 1;
        const limit = query.limit || 50;
        const skip = (page - 1) * limit;
        // Build where clause
        const where = {};
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
        const total = await prisma_1.default.activityLog.count({ where });
        // Get logs with pagination
        const logs = await prisma_1.default.activityLog.findMany({
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
    async getUserActivityLogs(userId, limit = 10) {
        const logs = await prisma_1.default.activityLog.findMany({
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
    async getEntityActivityLogs(entityType, entityId) {
        const logs = await prisma_1.default.activityLog.findMany({
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
    async exportActivityLogs(query, requestingUser) {
        // Get all logs matching the query (without pagination)
        const where = {};
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
        const logs = await prisma_1.default.activityLog.findMany({
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
        const parser = new json2csv_1.Parser({
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
    async getActivityStatistics(startDate, endDate, cityCorporationCode) {
        const where = {};
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
        const totalActivities = await prisma_1.default.activityLog.count({ where });
        // Activities by action
        const activitiesByAction = await prisma_1.default.activityLog.groupBy({
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
        const activitiesByUserRaw = await prisma_1.default.activityLog.groupBy({
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
        const users = await prisma_1.default.user.findMany({
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
        const activitiesByEntityType = await prisma_1.default.activityLog.groupBy({
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
    async deleteOldLogs(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await prisma_1.default.activityLog.deleteMany({
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
    async applyRoleBasedFiltering(where, requestingUser, cityCorporationCode) {
        // MASTER_ADMIN: Can see all logs
        if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
            // Optionally filter by city corporation
            if (cityCorporationCode) {
                where.user = {
                    cityCorporationCode,
                };
            }
            return;
        }
        // SUPER_ADMIN: Can see logs from users in their zone
        if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            where.user = {
                zoneId: requestingUser.zoneId || undefined,
            };
            return;
        }
        // ADMIN: Can see only their own logs
        if (requestingUser.role === client_1.users_role.ADMIN) {
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
    async logUserCreation(createdBy, createdUser, ipAddress, userAgent) {
        await this.logActivity({
            userId: createdBy,
            action: exports.ActivityActions.CREATE_USER,
            entityType: exports.EntityTypes.USER,
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
    async logUserUpdate(updatedBy, oldUser, newUser, ipAddress, userAgent) {
        await this.logActivity({
            userId: updatedBy,
            action: exports.ActivityActions.UPDATE_USER,
            entityType: exports.EntityTypes.USER,
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
    async logUserDeletion(deletedBy, deletedUser, ipAddress, userAgent) {
        await this.logActivity({
            userId: deletedBy,
            action: exports.ActivityActions.DELETE_USER,
            entityType: exports.EntityTypes.USER,
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
    async logPermissionUpdate(updatedBy, userId, oldPermissions, newPermissions, ipAddress, userAgent) {
        await this.logActivity({
            userId: updatedBy,
            action: exports.ActivityActions.UPDATE_USER_PERMISSIONS,
            entityType: exports.EntityTypes.USER,
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
    async logLogin(userId, ipAddress, userAgent) {
        await this.logActivity({
            userId,
            action: exports.ActivityActions.LOGIN,
            entityType: exports.EntityTypes.USER,
            entityId: userId,
            ipAddress,
            userAgent,
        });
    }
    /**
     * Log logout
     * Helper method to log user logout
     */
    async logLogout(userId, ipAddress, userAgent) {
        await this.logActivity({
            userId,
            action: exports.ActivityActions.LOGOUT,
            entityType: exports.EntityTypes.USER,
            entityId: userId,
            ipAddress,
            userAgent,
        });
    }
}
exports.ActivityLogService = ActivityLogService;
exports.activityLogService = new ActivityLogService();
