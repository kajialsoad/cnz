"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserService = exports.AdminUserService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcrypt_1 = require("bcrypt");
const client_1 = require("@prisma/client");
const activity_log_service_1 = require("./activity-log.service");
const redis_cache_1 = require("../utils/redis-cache");
const multi_zone_service_1 = require("./multi-zone.service");
class AdminUserService {
    // Get users by multiple zones (for Super Admin multi-zone support)
    async getUsersByZones(zoneIds, query) {
        const modifiedQuery = {
            ...query,
            // Override with multi-zone filter - will be applied in where clause
        };
        // Create a mock requesting user with multi-zone access
        const mockUser = {
            id: 0, // Not used for filtering
            role: client_1.users_role.MASTER_ADMIN, // Bypass role filtering
            zoneId: null,
            wardId: null,
        };
        // Get users with zone filter
        const page = modifiedQuery.page || 1;
        const limit = modifiedQuery.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = modifiedQuery.sortBy || 'createdAt';
        const sortOrder = modifiedQuery.sortOrder || 'asc';
        const where = {
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
        const total = await prisma_1.default.user.count({ where });
        const users = await prisma_1.default.user.findMany({
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
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });
        const userIds = users.map(u => u.id);
        const complaintStats = await prisma_1.default.complaint.groupBy({
            by: ['userId', 'status'],
            where: {
                userId: { in: userIds },
            },
            _count: {
                id: true,
            },
        });
        const statsMap = new Map();
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
            if (!stat.userId)
                return;
            const userStat = statsMap.get(stat.userId);
            if (!userStat)
                return;
            const count = stat._count.id;
            userStat.totalComplaints += count;
            if (stat.status === client_1.ComplaintStatus.RESOLVED) {
                userStat.resolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });
        const usersWithStats = users.map(user => ({
            ...user,
            statistics: statsMap.get(user.id),
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
    async getUsers(query, requestingUser) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'asc'; // Changed to 'asc' to show oldest users first
        // Build where clause
        const where = {};
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
            if (requestingUser.role === client_1.users_role.SUPER_ADMIN && requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                // If specific zone requested, ensure it is in assigned list
                if (query.zoneId) {
                    if (!requestingUser.assignedZoneIds.includes(query.zoneId)) {
                        // Should retrieve empty result or throw forbidden. 
                        // For list filtering, usually empty result is better or let the detailed middleware handle strict forbidden.
                        // Here we return empty by forcing an impossible condition
                        where.id = -1;
                    }
                }
                else {
                    // Filter by all assigned zones
                    where.zoneId = { in: requestingUser.assignedZoneIds };
                }
            }
            else {
                await this.applyRoleBasedFiltering(where, requestingUser);
            }
        }
        // Get total count
        const total = await prisma_1.default.user.count({ where });
        // Get users with pagination
        const users = await prisma_1.default.user.findMany({
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
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });
        // Get all user IDs for batch statistics query
        const userIds = users.map(u => u.id);
        // Batch query for all complaint statistics at once
        const complaintStats = await prisma_1.default.complaint.groupBy({
            by: ['userId', 'status'],
            where: {
                userId: { in: userIds },
            },
            _count: {
                id: true,
            },
        });
        // Build statistics map for quick lookup
        const statsMap = new Map();
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
            if (!stat.userId)
                return;
            const userStat = statsMap.get(stat.userId);
            if (!userStat)
                return; // Skip if user not in our list
            const count = stat._count.id;
            userStat.totalComplaints += count;
            if (stat.status === client_1.ComplaintStatus.RESOLVED) {
                userStat.resolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });
        // Map users with their statistics
        const usersWithStats = users.map(user => ({
            ...user,
            statistics: statsMap.get(user.id),
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
    // Get single user with details
    async getUserById(userId) {
        const user = await prisma_1.default.user.findUnique({
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
        if (!user) {
            throw new Error('User not found');
        }
        // Get user statistics
        const statistics = await this.calculateUserStats(userId);
        // Get recent complaints
        const recentComplaints = await prisma_1.default.complaint.findMany({
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
            },
            recentComplaints,
        };
    }
    // Get aggregate statistics (with Redis caching)
    async getUserStatistics(cityCorporationCode, zoneId, wardId, role, requestingUser) {
        // Generate cache key
        const cacheKey = redis_cache_1.RedisCacheKeys.userStats(cityCorporationCode, zoneId, wardId, role);
        // Try to get from cache (Redis with fallback to in-memory)
        return (0, redis_cache_1.withRedisCache)(cacheKey, redis_cache_1.RedisCacheTTL.USER_STATS, async () => {
            return this.fetchUserStatistics(cityCorporationCode, zoneId, wardId, role, requestingUser);
        });
    }
    // Fetch user statistics (internal method)
    async fetchUserStatistics(cityCorporationCode, zoneId, wardId, role, requestingUser) {
        // Build base where clause with cascading filters
        const userWhere = {};
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
            if (requestingUser.role === client_1.users_role.SUPER_ADMIN && requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                if (zoneId) {
                    if (!requestingUser.assignedZoneIds.includes(zoneId)) {
                        // Forbidden effectively for stats
                        userWhere.id = -1;
                    }
                }
                else {
                    userWhere.zoneId = { in: requestingUser.assignedZoneIds };
                }
            }
            else {
                await this.applyRoleBasedFiltering(userWhere, requestingUser);
            }
        }
        // Apply role filter - default to CUSTOMER if not specified
        const targetRole = role || client_1.users_role.CUSTOMER;
        // Total citizens
        const totalCitizens = await prisma_1.default.user.count({
            where: {
                ...userWhere,
                role: targetRole,
            },
        });
        // For complaints, we need to filter by user's location
        const complaintWhere = {};
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
        const totalComplaints = await prisma_1.default.complaint.count({
            where: complaintWhere,
        });
        // Resolved complaints
        const resolvedComplaints = await prisma_1.default.complaint.count({
            where: {
                ...complaintWhere,
                status: client_1.ComplaintStatus.RESOLVED,
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
        const activeUsers = await prisma_1.default.user.count({
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
        const newUsersThisMonth = await prisma_1.default.user.count({
            where: {
                ...userWhere,
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });
        // Status breakdown (optimized with single groupBy query)
        const statusGroups = await prisma_1.default.user.groupBy({
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
            if (group.status === client_1.UserStatus.ACTIVE)
                statusBreakdown.active = count;
            else if (group.status === client_1.UserStatus.INACTIVE)
                statusBreakdown.inactive = count;
            else if (group.status === client_1.UserStatus.SUSPENDED)
                statusBreakdown.suspended = count;
            else if (group.status === client_1.UserStatus.PENDING)
                statusBreakdown.pending = count;
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
    // Create new user
    async createUser(data, createdBy, ipAddress, userAgent) {
        // Check if user exists by phone
        const existingUserByPhone = await prisma_1.default.user.findUnique({
            where: { phone: data.phone },
        });
        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }
        // Check if user exists by email (if provided)
        if (data.email) {
            const existingUserByEmail = await prisma_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (existingUserByEmail) {
                throw new Error('User already exists with this email');
            }
        }
        // Hash password
        const hashedPassword = await (0, bcrypt_1.hash)(data.password, 12);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                wardImageCount: 0, // Initialize to 0 for new users
                role: data.role || client_1.users_role.ADMIN,
                status: client_1.UserStatus.ACTIVE,
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
            await activity_log_service_1.activityLogService.logUserCreation(createdBy, user, ipAddress, userAgent);
        }
        // Invalidate cache (Redis and in-memory)
        await redis_cache_1.invalidateRedisCache.user();
        // Get statistics
        const statistics = await this.calculateUserStats(user.id);
        return {
            ...user,
            cityCorporation: user.cityCorporation || null,
            statistics,
        };
    }
    // Update user information
    async updateUser(userId, data, updatedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Check for duplicate phone (if changing)
        if (data.phone && data.phone !== existingUser.phone) {
            const duplicatePhone = await prisma_1.default.user.findUnique({
                where: { phone: data.phone },
            });
            if (duplicatePhone) {
                throw new Error('Phone number already in use');
            }
        }
        // Check for duplicate email (if changing)
        if (data.email && data.email !== existingUser.email) {
            const duplicateEmail = await prisma_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (duplicateEmail) {
                throw new Error('Email already in use');
            }
        }
        // Hash password if provided
        let hashedPassword;
        if (data.password) {
            hashedPassword = await (0, bcrypt_1.hash)(data.password, 12);
        }
        // Update user
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                role: data.role,
                status: data.status,
                ...(hashedPassword && { passwordHash: hashedPassword }),
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
            await activity_log_service_1.activityLogService.logUserUpdate(updatedBy, existingUser, user, ipAddress, userAgent);
        }
        // Invalidate cache (Redis and in-memory)
        await redis_cache_1.invalidateRedisCache.user(userId);
        // Get statistics
        const statistics = await this.calculateUserStats(user.id);
        return {
            ...user,
            statistics,
        };
    }
    // Update user status
    async updateUserStatus(userId, status, updatedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Update status
        const user = await prisma_1.default.user.update({
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
            await activity_log_service_1.activityLogService.logActivity({
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
        await redis_cache_1.invalidateRedisCache.user(userId);
        // Get statistics
        const statistics = await this.calculateUserStats(user.id);
        return {
            ...user,
            statistics,
        };
    }
    // Apply role-based automatic filtering (async for multi-zone support)
    async applyRoleBasedFiltering(where, requestingUser) {
        // MASTER_ADMIN: No filtering - can see all users
        if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
            return;
        }
        // SUPER_ADMIN: Filter by their assigned zones (multi-zone support)
        if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(requestingUser.id);
            if (assignedZoneIds.length > 0) {
                // Multi-zone filtering
                where.zoneId = { in: assignedZoneIds };
            }
            else if (requestingUser.zoneId) {
                // Fallback to single zone for backward compatibility
                where.zoneId = requestingUser.zoneId;
            }
            return;
        }
        // ADMIN: Filter by their assigned ward
        if (requestingUser.role === client_1.users_role.ADMIN) {
            if (requestingUser.wardId) {
                where.wardId = requestingUser.wardId;
            }
            return;
        }
    }
    // Build search query
    buildSearchQuery(search) {
        const searchTerm = search.toLowerCase();
        return [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
        ];
    }
    // Update user permissions
    async updateUserPermissions(userId, permissions, updatedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Update permissions
        const user = await prisma_1.default.user.update({
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
            await activity_log_service_1.activityLogService.logPermissionUpdate(updatedBy, userId, existingUser.permissions, permissions, ipAddress, userAgent);
        }
        // Invalidate cache (Redis and in-memory)
        await redis_cache_1.invalidateRedisCache.user(userId);
        // Get statistics
        const statistics = await this.calculateUserStats(user.id);
        return {
            ...user,
            cityCorporation: user.cityCorporation || null,
            statistics,
        };
    }
    // Delete user (soft delete)
    async deleteUser(userId, deletedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Soft delete by setting status to INACTIVE
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                status: client_1.UserStatus.INACTIVE,
            },
        });
        // Log activity
        await activity_log_service_1.activityLogService.logUserDeletion(deletedBy, existingUser, ipAddress, userAgent);
        // Invalidate cache (Redis and in-memory)
        await redis_cache_1.invalidateRedisCache.user(userId);
    }
    // Calculate user statistics (optimized with single query)
    async calculateUserStats(userId) {
        // Use groupBy to get all stats in a single query
        const stats = await prisma_1.default.complaint.groupBy({
            by: ['status'],
            where: { userId },
            _count: {
                id: true,
            },
        });
        // Initialize statistics
        const statistics = {
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
            if (stat.status === client_1.ComplaintStatus.RESOLVED) {
                statistics.resolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.PENDING) {
                statistics.pendingComplaints += count;
                statistics.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.IN_PROGRESS) {
                statistics.inProgressComplaints += count;
                statistics.unresolvedComplaints += count;
            }
        });
        return statistics;
    }
}
exports.AdminUserService = AdminUserService;
exports.adminUserService = new AdminUserService();
