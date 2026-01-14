import prisma from '../utils/prisma';
import { hash } from 'bcrypt';
import { users_role, UserStatus, Complaint_status, Prisma } from '@prisma/client';
import { activityLogService, ActivityActions, EntityTypes } from './activity-log.service';
import { redisCache, RedisCacheKeys, RedisCacheTTL, withRedisCache, invalidateRedisCache } from '../utils/redis-cache';
import { multiZoneService } from './multi-zone.service';

// Query interfaces
export interface GetUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    role?: users_role;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
}

// Response interfaces
export interface UserStatistics {
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
}

export interface UserWithStats {
    id: number;
    email: string | null;
    phone: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    address: string | null;
    role: users_role;
    passwordHash?: string | null;
    visiblePassword?: string | null;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    cityCorporationCode: string | null;
    cityCorporation: any | null;
    zoneId: number | null;
    zone?: {
        id: number;
        zoneNumber: number | null;
        name: string;
        officerName: string | null;
        officerDesignation: string | null;
        officerSerialNumber: string | null;
        status: string;
    } | null;
    wardId: number | null;
    ward?: {
        id: number;
        wardNumber: number | null;
        inspectorName: string | null;
        inspectorSerialNumber: string | null;
        status: string;
    } | null;
    assignedZones?: {
        zone: {
            id: number;
            name: string;
            zoneNumber: number | null;
            cityCorporation?: {
                id: number;
                name: string;
                code: string;
            };
        };
    }[];
    wardImageCount: number;
    permissions?: any;
    extraWards?: {
        id: number;
        wardNumber: number;
        inspectorName?: string | null;
        inspectorPhone?: string | null;
    }[];
    statistics: UserStatistics;
}

export interface GetUsersResponse {
    users: UserWithStats[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ComplaintSummary {
    id: number;
    title: string;
    status: Complaint_status;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetUserResponse {
    user: UserWithStats;
    recentComplaints: ComplaintSummary[];
}

export interface UserStatisticsResponse {
    totalCitizens: number;
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    successRate: number;
    activeUsers: number;
    newUsersThisMonth: number;
    statusBreakdown: {
        active: number;
        inactive: number;
        suspended: number;
        pending: number;
    };
}

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    joiningDate?: Date;
    address?: string;
    password: string;
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    role?: users_role;
    permissions?: any;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    joiningDate?: Date;
    address?: string;
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    role?: users_role;
    status?: UserStatus;
    password?: string;
    avatar?: string;
    permissions?: any;
}

export interface UpdateStatusDto {
    status: UserStatus;
    reason?: string;
}

export class AdminUserService {
    // Get users by multiple zones (for Super Admin multi-zone support)
    async getUsersByZones(zoneIds: number[], query: GetUsersQuery): Promise<GetUsersResponse> {
        const modifiedQuery = {
            ...query,
            // Override with multi-zone filter - will be applied in where clause
        };

        // Create a mock requesting user with multi-zone access
        const mockUser = {
            id: 0, // Not used for filtering
            role: users_role.MASTER_ADMIN, // Bypass role filtering
            zoneId: null,
            wardId: null,
        };

        // Get users with zone filter
        const page = modifiedQuery.page || 1;
        const limit = modifiedQuery.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = modifiedQuery.sortBy || 'createdAt';
        const sortOrder = modifiedQuery.sortOrder || 'asc';

        const where: Prisma.UserWhereInput = {
            zoneId: { in: zoneIds },
        };

        // Apply other filters
        if (modifiedQuery.search) {
            where.OR = this.buildSearchQuery(modifiedQuery.search);
        }
        if (modifiedQuery.status) {
            where.status = modifiedQuery.status;
        }
        if (modifiedQuery.role) {
            where.role = modifiedQuery.role;
        }
        if (modifiedQuery.cityCorporationCode) {
            where.cityCorporationCode = modifiedQuery.cityCorporationCode;
        }
        if (modifiedQuery.wardId) {
            where.wardId = modifiedQuery.wardId;
        }

        const total = await prisma.user.count({ where });

        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        officerPhone: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        inspectorPhone: true,
                        status: true,
                    },
                },
                assignedZones: {
                    select: {
                        zone: {
                            select: {
                                id: true,
                                name: true,
                                zoneNumber: true,
                                cityCorporation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
                wardImageCount: true,
                permissions: true,
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });

        const userIds = users.map(u => u.id);

        const complaintStats = await prisma.complaint.groupBy({
            by: ['userId', 'status'],
            where: {
                userId: { in: userIds },
            },
            _count: {
                id: true,
            },
        });

        const statsMap = new Map<number, UserStatistics>();

        userIds.forEach(userId => {
            statsMap.set(userId, {
                totalComplaints: 0,
                resolvedComplaints: 0,
                unresolvedComplaints: 0,
                pendingComplaints: 0,
                inProgressComplaints: 0,
            });
        });

        complaintStats.forEach(stat => {
            if (!stat.userId) return;

            const userStat = statsMap.get(stat.userId);
            if (!userStat) return;

            const count = stat._count.id;

            userStat.totalComplaints += count;

            if (stat.status === Complaint_status.RESOLVED) {
                userStat.resolvedComplaints += count;
            } else if (stat.status === Complaint_status.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            } else if (stat.status === Complaint_status.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });

        const usersWithStats: UserWithStats[] = users.map(user => ({
            ...user,
            statistics: statsMap.get(user.id)!,
        }));

        return {
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get users with filters and pagination
    async getUsers(query: GetUsersQuery, requestingUser?: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null; assignedZoneIds?: number[] }): Promise<GetUsersResponse> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'asc'; // Changed to 'asc' to show oldest users first

        // Build where clause
        const where: Prisma.UserWhereInput = {};

        // Apply search filter
        if (query.search) {
            where.OR = this.buildSearchQuery(query.search);
        }

        // Apply status filter
        if (query.status) {
            where.status = query.status;
        }

        // Apply role filter
        if (query.role) {
            where.role = query.role;
        }

        // Apply city corporation filter
        if (query.cityCorporationCode) {
            where.cityCorporationCode = query.cityCorporationCode;
        }

        // Apply zone filter
        if (query.zoneId) {
            where.zoneId = query.zoneId;
        }

        // Apply ward filter
        if (query.wardId) {
            where.wardId = query.wardId;
        }

        // Apply role-based automatic filtering
        if (requestingUser) {
            // Check for multi-zone assignment (SUPER_ADMIN)
            if (requestingUser.role === users_role.SUPER_ADMIN && requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                // If specific zone requested, ensure it is in assigned list
                if (query.zoneId) {
                    if (!requestingUser.assignedZoneIds.includes(query.zoneId)) {
                        // Should retrieve empty result or throw forbidden. 
                        // For list filtering, usually empty result is better or let the detailed middleware handle strict forbidden.
                        // Here we return empty by forcing an impossible condition
                        where.id = -1;
                    }
                } else {
                    // Filter by all assigned zones
                    where.zoneId = { in: requestingUser.assignedZoneIds };
                }
            } else {
                await this.applyRoleBasedFiltering(where, requestingUser);
            }
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users with pagination
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                assignedZones: {
                    select: {
                        zone: {
                            select: {
                                id: true,
                                name: true,
                                zoneNumber: true,
                                cityCorporation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
                wardImageCount: true,
                permissions: true,
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });

        // Fetch extra wards in bulk
        let allExtraWardIds: number[] = [];
        users.forEach(user => {
            let perms = user.permissions as any;
            if (typeof perms === 'string') {
                try {
                    perms = JSON.parse(perms);
                } catch (e) {
                    console.error('Error parsing permissions:', e);
                    perms = {};
                }
            }

            if (perms && perms.wards && Array.isArray(perms.wards)) {
                allExtraWardIds.push(...perms.wards);
            }
        });
        allExtraWardIds = [...new Set(allExtraWardIds)];

        let extraWardsMap = new Map<number, any>();
        if (allExtraWardIds.length > 0) {
            const extraWards = await prisma.ward.findMany({
                where: { id: { in: allExtraWardIds } },
                select: {
                    id: true,
                    wardNumber: true,
                    inspectorName: true,
                    inspectorPhone: true,
                    zoneId: true,
                }
            });
            extraWards.forEach(w => extraWardsMap.set(w.id, w));
        }

        // Get all user IDs for batch statistics query
        const userIds = users.map(u => u.id);

        // Batch query for all complaint statistics at once
        const complaintStats = await prisma.complaint.groupBy({
            by: ['userId', 'status'],
            where: {
                userId: { in: userIds },
            },
            _count: {
                id: true,
            },
        });

        // Build statistics map for quick lookup
        const statsMap = new Map<number, UserStatistics>();

        // Initialize stats for all users
        userIds.forEach(userId => {
            statsMap.set(userId, {
                totalComplaints: 0,
                resolvedComplaints: 0,
                unresolvedComplaints: 0,
                pendingComplaints: 0,
                inProgressComplaints: 0,
            });
        });

        // Populate stats from grouped data
        complaintStats.forEach(stat => {
            // Skip if userId is null (shouldn't happen but TypeScript requires the check)
            if (!stat.userId) return;

            const userStat = statsMap.get(stat.userId);
            if (!userStat) return; // Skip if user not in our list

            const count = stat._count.id;

            userStat.totalComplaints += count;

            if (stat.status === Complaint_status.RESOLVED) {
                userStat.resolvedComplaints += count;
            } else if (stat.status === Complaint_status.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            } else if (stat.status === Complaint_status.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });

        // Map users with their statistics
        const usersWithStats: UserWithStats[] = users.map(user => {
            let perms = user.permissions as any;
            if (typeof perms === 'string') {
                try {
                    perms = JSON.parse(perms);
                } catch (e) {
                    perms = {};
                }
            }

            const userExtraWards = (perms && perms.wards && Array.isArray(perms.wards))
                ? perms.wards.map((id: number) => extraWardsMap.get(id)).filter(Boolean)
                : [];

            return {
                ...user,
                statistics: statsMap.get(user.id)!,
                extraWards: userExtraWards,
            };
        });

        return {
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get single user with details
    async getUserById(userId: number): Promise<GetUserResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        officerPhone: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        inspectorPhone: true,
                        status: true,
                    },
                },
                wardImageCount: true,
                permissions: true,
                assignedZones: {
                    select: {
                        zone: {
                            select: {
                                id: true,
                                name: true,
                                zoneNumber: true,
                                cityCorporation: {
                                    select: {
                                        id: true,
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Fetch extra wards if present in permissions
        let extraWards: any[] = [];
        let perms = user.permissions as any;

        if (typeof perms === 'string') {
            try {
                perms = JSON.parse(perms);
            } catch (e) {
                console.error('Error parsing permissions in getUserById:', e);
                perms = {};
            }
        }

        console.log('📋 getUserById - permissions:', JSON.stringify(perms));
        if (perms && perms.wards && Array.isArray(perms.wards) && perms.wards.length > 0) {
            console.log('📋 getUserById - perms.wards IDs:', perms.wards);
            extraWards = await prisma.ward.findMany({
                where: { id: { in: perms.wards } },
                select: {
                    id: true,
                    wardNumber: true,
                    inspectorName: true,
                    inspectorPhone: true,
                }
            });
            console.log('📋 getUserById - fetched extraWards:', extraWards);
        }

        // Get user statistics
        const statistics = await this.calculateUserStats(userId);

        // Get recent complaints
        const recentComplaints = await prisma.complaint.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            user: {
                ...user,
                statistics,
                extraWards,
            },
            recentComplaints,
        };
    }

    // Get aggregate statistics (with Redis caching)
    async getUserStatistics(
        cityCorporationCode?: string,
        zoneId?: number,
        wardId?: number,
        role?: users_role,
        requestingUser?: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null }
    ): Promise<UserStatisticsResponse> {
        // Generate cache key
        const cacheKey = RedisCacheKeys.userStats(cityCorporationCode, zoneId, wardId, role);

        // Try to get from cache (Redis with fallback to in-memory)
        return withRedisCache(cacheKey, RedisCacheTTL.USER_STATS, async () => {
            return this.fetchUserStatistics(cityCorporationCode, zoneId, wardId, role, requestingUser);
        });
    }

    // Bulk delete users (HARD DELETE - permanently removes from database)
    async bulkDeleteUsers(userIds: number[], deletedBy: number, ipAddress?: string, userAgent?: string): Promise<void> {
        // Filter out invalid IDs
        if (!userIds || userIds.length === 0) return;

        // Log activity for each user BEFORE deleting
        for (const userId of userIds) {
            await activityLogService.logActivity({
                userId: deletedBy,
                action: ActivityActions.DELETE_USER,
                entityType: EntityTypes.USER,
                entityId: userId,
                ipAddress,
                userAgent,
            });

            // Invalidate cache
            await invalidateRedisCache.user(userId);
        }

        // HARD DELETE - completely remove users from database
        await prisma.user.deleteMany({
            where: {
                id: { in: userIds },
            },
        });
    }

    // Fetch user statistics (internal method)
    private async fetchUserStatistics(
        cityCorporationCode?: string,
        zoneId?: number,
        wardId?: number,
        role?: users_role,
        requestingUser?: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null; assignedZoneIds?: number[] }
    ): Promise<UserStatisticsResponse> {
        // Build base where clause with cascading filters
        const userWhere: Prisma.UserWhereInput = {};

        // Apply city corporation filter
        if (cityCorporationCode) {
            userWhere.cityCorporationCode = cityCorporationCode;
        }

        // Apply zone filter
        // Note: If both zoneId and wardId are provided, wardId takes precedence
        if (zoneId && !wardId) {
            userWhere.zoneId = zoneId;
        }

        // Apply ward filter directly
        if (wardId) {
            userWhere.wardId = wardId;
        }

        // Apply role-based automatic filtering
        if (requestingUser) {
            if (requestingUser.role === users_role.SUPER_ADMIN && requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                if (zoneId) {
                    if (!requestingUser.assignedZoneIds.includes(zoneId)) {
                        // Forbidden effectively for stats
                        userWhere.id = -1;
                    }
                } else {
                    userWhere.zoneId = { in: requestingUser.assignedZoneIds };
                }
            } else {
                await this.applyRoleBasedFiltering(userWhere, requestingUser);
            }
        }

        // Apply role filter - default to CUSTOMER if not specified
        const targetRole = role || users_role.CUSTOMER;

        // Total citizens
        const totalCitizens = await prisma.user.count({
            where: {
                ...userWhere,
                role: targetRole,
            },
        });

        // For complaints, we need to filter by user's location
        const complaintWhere: Prisma.ComplaintWhereInput = {};

        if (cityCorporationCode || zoneId || wardId) {
            complaintWhere.user = {};
            if (cityCorporationCode) {
                complaintWhere.user.cityCorporationCode = cityCorporationCode;
            }
            // Filter by zone
            // Note: If both zoneId and wardId are provided, wardId takes precedence
            if (zoneId && !wardId) {
                complaintWhere.user.zoneId = zoneId;
            }
            if (wardId) {
                complaintWhere.user.wardId = wardId;
            }
        }

        // Total complaints
        const totalComplaints = await prisma.complaint.count({
            where: complaintWhere,
        });

        // Resolved complaints
        const resolvedComplaints = await prisma.complaint.count({
            where: {
                ...complaintWhere,
                status: Complaint_status.RESOLVED,
            },
        });

        // Unresolved complaints
        const unresolvedComplaints = totalComplaints - resolvedComplaints;

        // Success rate
        const successRate = totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0;

        // Active users (logged in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await prisma.user.count({
            where: {
                ...userWhere,
                lastLoginAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        // New users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsersThisMonth = await prisma.user.count({
            where: {
                ...userWhere,
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });

        // Status breakdown (optimized with single groupBy query)
        const statusGroups = await prisma.user.groupBy({
            by: ['status'],
            where: userWhere,
            _count: {
                id: true,
            },
        });

        const statusBreakdown = {
            active: 0,
            inactive: 0,
            suspended: 0,
            pending: 0,
        };

        statusGroups.forEach(group => {
            const count = group._count.id;
            if (group.status === UserStatus.ACTIVE) statusBreakdown.active = count;
            else if (group.status === UserStatus.INACTIVE) statusBreakdown.inactive = count;
            else if (group.status === UserStatus.SUSPENDED) statusBreakdown.suspended = count;
            else if (group.status === UserStatus.PENDING) statusBreakdown.pending = count;
        });

        return {
            totalCitizens,
            totalComplaints,
            resolvedComplaints,
            unresolvedComplaints,
            successRate,
            activeUsers,
            newUsersThisMonth,
            statusBreakdown,
        };
    }

    // Validate that the creator has permission to create/update user in the specified zone
    private async validateCreatorScope(data: CreateUserDto | UpdateUserDto, createdBy: number): Promise<void> {
        const creator = await prisma.user.findUnique({
            where: { id: createdBy },
            select: { role: true }
        });

        if (creator?.role === users_role.SUPER_ADMIN) {
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(createdBy);

            // Should strictly check if zone matches
            if (data.zoneId) {
                if (!assignedZoneIds.includes(data.zoneId)) {
                    throw new Error('You do not have permission to manage users in this zone');
                }
            } else if (assignedZoneIds.length > 0 && !data.cityCorporationCode) {
                // If they have assigned zones, they generally shouldn't be creating users without context?
                // But let's stick to preventing explicit unauthorized assignment.
            }
        }
    }

    // Create new user
    async createUser(data: CreateUserDto, createdBy?: number, ipAddress?: string, userAgent?: string): Promise<UserWithStats> {
        // Validate creator scope if createdBy is provided
        if (createdBy) {
            await this.validateCreatorScope(data, createdBy);
        }

        // Check if user exists by phone (exclude INACTIVE/deleted users)
        const existingUserByPhone = await prisma.user.findFirst({
            where: {
                phone: data.phone,
                status: { not: UserStatus.INACTIVE } // Exclude soft-deleted users
            },
        });

        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }

        // Check if user exists by email (if provided, exclude INACTIVE/deleted users)
        if (data.email) {
            const existingUserByEmail = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    status: { not: UserStatus.INACTIVE } // Exclude soft-deleted users
                },
            });

            if (existingUserByEmail) {
                throw new Error('User already exists with this email');
            }
        }

        // Hash password
        const hashedPassword = await hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                whatsapp: data.whatsapp,
                joiningDate: data.joiningDate,
                address: data.address,
                passwordHash: hashedPassword,
                visiblePassword: data.password, // Store plain text password
                firstName: data.firstName,
                lastName: data.lastName,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                wardImageCount: 0, // Initialize to 0 for new users
                role: data.role || users_role.ADMIN,
                status: UserStatus.ACTIVE,
                emailVerified: false,
                phoneVerified: false,
                permissions: data.permissions ? JSON.stringify(data.permissions) : undefined,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
            },
        });

        // Log activity
        if (createdBy) {
            await activityLogService.logUserCreation(createdBy, user, ipAddress, userAgent);
        }

        // Invalidate cache (Redis and in-memory)
        await invalidateRedisCache.user();

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            cityCorporation: user.cityCorporation || null,
            statistics,
        };
    }

    // Update user information
    async updateUser(userId: number, data: UpdateUserDto, updatedBy?: number, ipAddress?: string, userAgent?: string): Promise<UserWithStats> {
        // Validate creator scope if updatedBy is provided
        if (updatedBy) {
            await this.validateCreatorScope(data, updatedBy);
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Check for duplicate phone (if changing, exclude current user and INACTIVE users)
        if (data.phone && data.phone !== existingUser.phone) {
            const duplicatePhone = await prisma.user.findFirst({
                where: {
                    phone: data.phone,
                    id: { not: userId }, // Exclude current user being updated
                    status: { not: UserStatus.INACTIVE } // Exclude soft-deleted users
                },
            });

            if (duplicatePhone) {
                throw new Error('Phone number already in use');
            }
        }

        // Check for duplicate email (if changing, exclude current user and INACTIVE users)
        if (data.email && data.email !== existingUser.email) {
            const duplicateEmail = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: userId }, // Exclude current user being updated
                    status: { not: UserStatus.INACTIVE } // Exclude soft-deleted users
                },
            });

            if (duplicateEmail) {
                throw new Error('Email already in use');
            }
        }

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (data.password) {
            hashedPassword = await hash(data.password, 12);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                whatsapp: data.whatsapp,
                joiningDate: data.joiningDate,
                address: data.address,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                role: data.role,
                status: data.status,
                avatar: data.avatar,
                ...(hashedPassword && {
                    passwordHash: hashedPassword,
                    visiblePassword: data.password // Store plain text password
                }),
                ...(data.permissions && { permissions: JSON.stringify(data.permissions) }),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
            },
        });

        // Log activity
        if (updatedBy) {
            await activityLogService.logUserUpdate(updatedBy, existingUser, user, ipAddress, userAgent);
        }

        // Invalidate cache (Redis and in-memory)
        await invalidateRedisCache.user(userId);

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            statistics,
        };
    }

    // Update user status
    async updateUserStatus(userId: number, status: UserStatus, updatedBy?: number, ipAddress?: string, userAgent?: string): Promise<UserWithStats> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Update status
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
            },
        });

        // Log activity
        if (updatedBy) {
            await activityLogService.logActivity({
                userId: updatedBy,
                action: 'UPDATE_USER_STATUS',
                entityType: 'USER',
                entityId: userId,
                oldValue: { status: existingUser.status },
                newValue: { status: user.status },
                ipAddress,
                userAgent,
            });
        }

        // Invalidate cache (Redis and in-memory)
        await invalidateRedisCache.user(userId);

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            statistics,
        };
    }

    // Apply role-based automatic filtering (async for multi-zone support)
    private async applyRoleBasedFiltering(
        where: Prisma.UserWhereInput,
        requestingUser: { id: number; role: users_role; zoneId?: number | null; wardId?: number | null }
    ): Promise<void> {
        // MASTER_ADMIN: No filtering - can see all users
        if (requestingUser.role === users_role.MASTER_ADMIN) {
            return;
        }

        // SUPER_ADMIN: Filter by their assigned zones (multi-zone support)
        if (requestingUser.role === users_role.SUPER_ADMIN) {
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(requestingUser.id);

            if (assignedZoneIds.length > 0) {
                // Multi-zone filtering
                where.zoneId = { in: assignedZoneIds };
            } else if (requestingUser.zoneId) {
                // Fallback to single zone for backward compatibility
                where.zoneId = requestingUser.zoneId;
            }
            return;
        }

        // ADMIN: Filter by their assigned wards (multiple ward support)
        // ⚠️ CRITICAL: Zone filtering is COMPLETELY IGNORED for ADMIN role
        if (requestingUser.role === users_role.ADMIN) {
            console.log('🔒 ADMIN filtering: Ward-based only, Zone IGNORED');

            // Parse ward IDs from permissions JSON
            let adminWardIds: number[] = [];

            // Fetch full user data to get permissions
            const fullUser = await prisma.user.findUnique({
                where: { id: requestingUser.id },
                select: { permissions: true }
            });

            if (fullUser && fullUser.permissions) {
                try {
                    const permissionsData = typeof fullUser.permissions === 'string'
                        ? JSON.parse(fullUser.permissions)
                        : fullUser.permissions;

                    if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                        adminWardIds = permissionsData.wards;
                    }
                } catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }

            console.log(`🔒 ADMIN assigned wards: [${adminWardIds.join(', ')}]`);

            if (adminWardIds.length > 0) {
                // Filter by assigned ward IDs (multiple ward support)
                where.wardId = { in: adminWardIds };
            } else {
                // No wards assigned = no users visible
                console.log('⚠️ ADMIN has no assigned wards - returning empty result');
                where.id = -1;
            }

            // ⚠️ CRITICAL: Zone filtering is NOT applied for ADMIN role
            // Zone is COMPLETELY IGNORED for Admin
            return;
        }
    }

    // Build search query
    private buildSearchQuery(search: string): Prisma.UserWhereInput[] {
        const searchTerm = search.toLowerCase();

        return [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
        ];
    }

    // Update user permissions
    async updateUserPermissions(userId: number, permissions: any, updatedBy?: number, ipAddress?: string, userAgent?: string): Promise<UserWithStats> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Update permissions
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                permissions: JSON.stringify(permissions)
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                passwordHash: true,
                visiblePassword: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
            },
        });

        // Log activity
        if (updatedBy) {
            await activityLogService.logPermissionUpdate(
                updatedBy,
                userId,
                existingUser.permissions,
                permissions,
                ipAddress,
                userAgent
            );
        }

        // Invalidate cache (Redis and in-memory)
        await invalidateRedisCache.user(userId);

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            cityCorporation: user.cityCorporation || null,
            statistics,
        };
    }

    // Delete user (HARD DELETE - permanently removes from database)
    async deleteUser(userId: number, deletedBy: number, ipAddress?: string, userAgent?: string): Promise<void> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Log activity BEFORE deleting (so we have the user data)
        await activityLogService.logUserDeletion(deletedBy, existingUser, ipAddress, userAgent);

        // HARD DELETE - completely remove user from database
        // This will also cascade delete related records (sessions, tokens, etc.)
        await prisma.user.delete({
            where: { id: userId },
        });

        // Invalidate cache (Redis and in-memory)
        await invalidateRedisCache.user(userId);
    }

    // Calculate user statistics (optimized with single query)
    private async calculateUserStats(userId: number): Promise<UserStatistics> {
        // Use groupBy to get all stats in a single query
        const stats = await prisma.complaint.groupBy({
            by: ['status'],
            where: { userId },
            _count: {
                id: true,
            },
        });

        // Initialize statistics
        const statistics: UserStatistics = {
            totalComplaints: 0,
            resolvedComplaints: 0,
            unresolvedComplaints: 0,
            pendingComplaints: 0,
            inProgressComplaints: 0,
        };

        // Populate statistics from grouped data
        stats.forEach(stat => {
            const count = stat._count.id;
            statistics.totalComplaints += count;

            if (stat.status === Complaint_status.RESOLVED) {
                statistics.resolvedComplaints += count;
            } else if (stat.status === Complaint_status.PENDING) {
                statistics.pendingComplaints += count;
                statistics.unresolvedComplaints += count;
            } else if (stat.status === Complaint_status.IN_PROGRESS) {
                statistics.inProgressComplaints += count;
                statistics.unresolvedComplaints += count;
            }
        });

        return statistics;
    }
}

export const adminUserService = new AdminUserService();
