"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
            if (stat.status === client_1.Complaint_status.RESOLVED) {
                userStat.resolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.IN_PROGRESS) {
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
        let allExtraWardIds = [];
        users.forEach(user => {
            let perms = user.permissions;
            if (typeof perms === 'string') {
                try {
                    perms = JSON.parse(perms);
                }
                catch (e) {
                    console.error('Error parsing permissions:', e);
                    perms = {};
                }
            }
            if (perms && perms.wards && Array.isArray(perms.wards)) {
                allExtraWardIds.push(...perms.wards);
            }
        });
        allExtraWardIds = [...new Set(allExtraWardIds)];
        let extraWardsMap = new Map();
        if (allExtraWardIds.length > 0) {
            const extraWards = await prisma_1.default.ward.findMany({
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
            if (stat.status === client_1.Complaint_status.RESOLVED) {
                userStat.resolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });
        // Map users with their statistics
        const usersWithStats = users.map(user => {
            let perms = user.permissions;
            if (typeof perms === 'string') {
                try {
                    perms = JSON.parse(perms);
                }
                catch (e) {
                    perms = {};
                }
            }
            const userExtraWards = (perms && perms.wards && Array.isArray(perms.wards))
                ? perms.wards.map((id) => extraWardsMap.get(id)).filter(Boolean)
                : [];
            return {
                ...user,
                statistics: statsMap.get(user.id),
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
        let extraWards = [];
        let perms = user.permissions;
        if (typeof perms === 'string') {
            try {
                perms = JSON.parse(perms);
            }
            catch (e) {
                console.error('Error parsing permissions in getUserById:', e);
                perms = {};
            }
        }
        console.log('📋 getUserById - permissions:', JSON.stringify(perms));
        if (perms && perms.wards && Array.isArray(perms.wards) && perms.wards.length > 0) {
            console.log('📋 getUserById - perms.wards IDs:', perms.wards);
            extraWards = await prisma_1.default.ward.findMany({
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
                extraWards,
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
    // Bulk delete users (HARD DELETE - permanently removes from database)
    async bulkDeleteUsers(userIds, deletedBy, ipAddress, userAgent) {
        // Filter out invalid IDs
        if (!userIds || userIds.length === 0)
            return;
        // Log activity for each user BEFORE deleting
        for (const userId of userIds) {
            await activity_log_service_1.activityLogService.logActivity({
                userId: deletedBy,
                action: activity_log_service_1.ActivityActions.DELETE_USER,
                entityType: activity_log_service_1.EntityTypes.USER,
                entityId: userId,
                ipAddress,
                userAgent,
            });
            // Invalidate cache
            await redis_cache_1.invalidateRedisCache.user(userId);
        }
        // HARD DELETE - completely remove users from database
        await prisma_1.default.user.deleteMany({
            where: {
                id: { in: userIds },
            },
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
                status: client_1.Complaint_status.RESOLVED,
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
    // Validate that the creator has permission to create/update user in the specified zone
    async validateCreatorScope(data, createdBy) {
        const creator = await prisma_1.default.user.findUnique({
            where: { id: createdBy },
            select: {
                role: true,
                firstName: true,
                lastName: true
            }
        });
        if (!creator) {
            throw new Error('Creator user not found');
        }
        // MASTER_ADMIN can create users in any zone without restrictions
        if (creator.role === client_1.users_role.MASTER_ADMIN) {
            return; // No validation needed for MASTER_ADMIN
        }
        // SUPER_ADMIN has zone restrictions
        if (creator.role === client_1.users_role.SUPER_ADMIN) {
            const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(createdBy);
            // Check if zone is specified and if creator has permission
            if (data.zoneId) {
                if (assignedZoneIds.length > 0 && !assignedZoneIds.includes(data.zoneId)) {
                    // Get zone details for better error message
                    const zone = await prisma_1.default.zone.findUnique({
                        where: { id: data.zoneId },
                        select: {
                            name: true,
                            zoneNumber: true,
                            cityCorporation: {
                                select: { name: true }
                            }
                        }
                    });
                    const zoneName = zone ? `${zone.cityCorporation?.name || ''} - Zone ${zone.zoneNumber || zone.name}` : `Zone ID ${data.zoneId}`;
                    throw new Error(`You do not have permission to manage users in ${zoneName}. Please contact your administrator to get access to this zone.`);
                }
            }
        }
    }
    // Create new user
    async createUser(data, createdBy, ipAddress, userAgent) {
        // Validate creator scope if createdBy is provided
        if (createdBy) {
            await this.validateCreatorScope(data, createdBy);
        }
        // Check if user exists by phone (exclude INACTIVE/deleted users)
        const existingUserByPhone = await prisma_1.default.user.findFirst({
            where: {
                phone: data.phone,
                status: { not: client_1.UserStatus.INACTIVE } // Exclude soft-deleted users
            },
        });
        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }
        // Check if user exists by email (if provided, exclude INACTIVE/deleted users)
        if (data.email) {
            const existingUserByEmail = await prisma_1.default.user.findFirst({
                where: {
                    email: data.email,
                    status: { not: client_1.UserStatus.INACTIVE } // Exclude soft-deleted users
                },
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
        // Validate creator scope if updatedBy is provided
        if (updatedBy) {
            await this.validateCreatorScope(data, updatedBy);
        }
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Check for duplicate phone (if changing, exclude current user and INACTIVE users)
        if (data.phone && data.phone !== existingUser.phone) {
            const duplicatePhone = await prisma_1.default.user.findFirst({
                where: {
                    phone: data.phone,
                    id: { not: userId }, // Exclude current user being updated
                    status: { not: client_1.UserStatus.INACTIVE } // Exclude soft-deleted users
                },
            });
            if (duplicatePhone) {
                throw new Error('Phone number already in use');
            }
        }
        // Check for duplicate email (if changing, exclude current user and INACTIVE users)
        if (data.email && data.email !== existingUser.email) {
            const duplicateEmail = await prisma_1.default.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: userId }, // Exclude current user being updated
                    status: { not: client_1.UserStatus.INACTIVE } // Exclude soft-deleted users
                },
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
        // ADMIN: Filter by their assigned wards (multiple ward support)
        // ⚠️ CRITICAL: Zone filtering is COMPLETELY IGNORED for ADMIN role
        if (requestingUser.role === client_1.users_role.ADMIN) {
            console.log('🔒 ADMIN filtering: Ward-based only, Zone IGNORED');
            // Parse ward IDs from permissions JSON
            let adminWardIds = [];
            // Fetch full user data to get permissions
            const fullUser = await prisma_1.default.user.findUnique({
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
                }
                catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }
            console.log(`🔒 ADMIN assigned wards: [${adminWardIds.join(', ')}]`);
            if (adminWardIds.length > 0) {
                // Filter by assigned ward IDs (multiple ward support)
                where.wardId = { in: adminWardIds };
            }
            else {
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
    // Delete user (HARD DELETE - permanently removes from database)
    async deleteUser(userId, deletedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Log activity BEFORE deleting (so we have the user data)
        await activity_log_service_1.activityLogService.logUserDeletion(deletedBy, existingUser, ipAddress, userAgent);
        // HARD DELETE - completely remove user from database
        // This will also cascade delete related records (sessions, tokens, etc.)
        await prisma_1.default.user.delete({
            where: { id: userId },
        });
        // Invalidate cache (Redis and in-memory)
        await redis_cache_1.invalidateRedisCache.user(userId);
    }
    // Change user password
    async changePassword(userId, newPassword, changedBy, ipAddress, userAgent) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Hash the new password
        const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 10);
        // Update password
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                visiblePassword: newPassword, // Store plain password for MASTER_ADMIN viewing
                updatedAt: new Date(),
            },
        });
        // Log activity
        await activity_log_service_1.activityLogService.logActivity({
            userId: changedBy,
            action: activity_log_service_1.ActivityActions.UPDATE_USER,
            entityType: activity_log_service_1.EntityTypes.USER,
            entityId: userId,
            newValue: { passwordChanged: true, changedAt: new Date() },
            ipAddress,
            userAgent,
        });
        // Send notification to Master Admins about password change
        try {
            const notificationService = (await Promise.resolve().then(() => __importStar(require('./notification.service')))).default;
            // Get user details for notification
            const userDetails = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    wardId: true,
                    zoneId: true,
                    ward: {
                        select: {
                            wardNumber: true,
                            number: true,
                        }
                    },
                    zone: {
                        select: {
                            name: true,
                            zoneNumber: true,
                        }
                    },
                    assignedZones: {
                        select: {
                            zone: {
                                select: {
                                    name: true,
                                    zoneNumber: true,
                                }
                            }
                        }
                    },
                    permissions: true,
                }
            });
            if (userDetails && (userDetails.role === 'ADMIN' || userDetails.role === 'SUPER_ADMIN')) {
                // Build notification message with user details
                const userName = `${userDetails.firstName} ${userDetails.lastName}`;
                const wardInfo = userDetails.ward
                    ? `Ward ${userDetails.ward.wardNumber || userDetails.ward.number}`
                    : 'No Ward';
                const zoneInfo = userDetails.assignedZones && userDetails.assignedZones.length > 0
                    ? userDetails.assignedZones.map(az => az.zone.name).join(', ')
                    : userDetails.zone
                        ? userDetails.zone.name
                        : 'No Zone';
                // Parse permissions for assigned wards
                let assignedWardsInfo = '';
                if (userDetails.permissions) {
                    try {
                        const permissionsData = JSON.parse(userDetails.permissions);
                        if (permissionsData.wards && Array.isArray(permissionsData.wards) && permissionsData.wards.length > 0) {
                            const assignedWards = await prisma_1.default.ward.findMany({
                                where: { id: { in: permissionsData.wards } },
                                select: { wardNumber: true, number: true }
                            });
                            assignedWardsInfo = ` | Assigned Wards: ${assignedWards.map(w => `Ward ${w.wardNumber || w.number}`).join(', ')}`;
                        }
                    }
                    catch (e) {
                        console.error('Error parsing permissions:', e);
                    }
                }
                const notificationMessage = `Password Changed - ${userDetails.role}: ${userName} (ID: ${userDetails.id}) | Zone: ${zoneInfo} | Ward: ${wardInfo}${assignedWardsInfo}`;
                // Send notification only to Master Admins
                await notificationService.notifyMasterAdmins('Admin Password Changed', notificationMessage, 'INFO');
            }
        }
        catch (notifError) {
            console.error('Failed to send password change notification:', notifError);
            // Don't fail the password change if notification fails
        }
        // Invalidate cache
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
            if (stat.status === client_1.Complaint_status.RESOLVED) {
                statistics.resolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.PENDING) {
                statistics.pendingComplaints += count;
                statistics.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.Complaint_status.IN_PROGRESS) {
                statistics.inProgressComplaints += count;
                statistics.unresolvedComplaints += count;
            }
        });
        return statistics;
    }
}
exports.AdminUserService = AdminUserService;
exports.adminUserService = new AdminUserService();
