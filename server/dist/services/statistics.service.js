"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticsService = exports.StatisticsService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const ioredis_1 = __importDefault(require("ioredis"));
// Initialize Redis client (optional - will work without Redis)
let redis = null;
try {
    if (process.env.REDIS_URL) {
        redis = new ioredis_1.default(process.env.REDIS_URL);
    }
}
catch (error) {
    console.warn('Redis not available, caching disabled:', error);
}
class StatisticsService {
    constructor() {
        this.CACHE_TTL = 5 * 60; // 5 minutes in seconds
    }
    /**
     * Get dashboard statistics with role-based filtering
     * Returns comprehensive statistics for the dashboard
     */
    async getDashboardStats(filters = {}, requestingUser) {
        // Apply role-based filtering
        const effectiveFilters = this.applyRoleBasedFiltering(filters, requestingUser);
        // Try to get from cache
        const cacheKey = this.getCacheKey('dashboard', effectiveFilters);
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        // Calculate statistics
        const [complaints, messages, users, performance] = await Promise.all([
            this.getComplaintStats(effectiveFilters),
            this.getMessageStats(effectiveFilters),
            this.getUserStats(effectiveFilters),
            this.getPerformanceStats(effectiveFilters),
        ]);
        const stats = {
            complaints,
            messages,
            users,
            performance,
        };
        // Cache the result
        if (redis) {
            await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(stats));
        }
        return stats;
    }
    /**
     * Get complaint statistics
     * Returns detailed complaint statistics with filtering
     */
    async getComplaintStats(filters = {}) {
        // Build where clause
        const where = this.buildComplaintWhere(filters);
        // Total complaints
        const total = await prisma_1.default.complaint.count({ where });
        // Complaints by status
        const statusCounts = await prisma_1.default.complaint.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true,
            },
        });
        const statusMap = new Map(statusCounts.map(s => [s.status, s._count.id]));
        const pending = statusMap.get(client_1.Complaint_status.PENDING) || 0;
        const inProgress = statusMap.get(client_1.Complaint_status.IN_PROGRESS) || 0;
        const resolved = statusMap.get(client_1.Complaint_status.RESOLVED) || 0;
        const rejected = statusMap.get(client_1.Complaint_status.REJECTED) || 0;
        // Success rate
        const successRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        // Average resolution time
        const resolvedComplaints = await prisma_1.default.complaint.findMany({
            where: {
                ...where,
                status: client_1.Complaint_status.RESOLVED,
                resolvedAt: { not: null },
            },
            select: {
                createdAt: true,
                resolvedAt: true,
            },
        });
        let averageResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalResolutionTime = resolvedComplaints.reduce((sum, complaint) => {
                const resolutionTime = complaint.resolvedAt.getTime() - complaint.createdAt.getTime();
                return sum + resolutionTime;
            }, 0);
            averageResolutionTime = totalResolutionTime / resolvedComplaints.length / (1000 * 60 * 60); // Convert to hours
        }
        // Time-based counts
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todayCount, weekCount, monthCount] = await Promise.all([
            prisma_1.default.complaint.count({ where: { ...where, createdAt: { gte: todayStart } } }),
            prisma_1.default.complaint.count({ where: { ...where, createdAt: { gte: weekStart } } }),
            prisma_1.default.complaint.count({ where: { ...where, createdAt: { gte: monthStart } } }),
        ]);
        // Complaints by category
        const byCategory = await prisma_1.default.complaint.groupBy({
            by: ['category'],
            where: {
                ...where,
                category: { not: null },
            },
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
        // Complaints by priority
        const byPriority = await prisma_1.default.complaint.groupBy({
            by: ['priority'],
            where,
            _count: {
                id: true,
            },
            orderBy: {
                priority: 'asc',
            },
        });
        return {
            total,
            pending,
            inProgress,
            resolved,
            rejected,
            successRate,
            averageResolutionTime: Math.round(averageResolutionTime * 10) / 10, // Round to 1 decimal
            todayCount,
            weekCount,
            monthCount,
            byCategory: byCategory.map(c => ({
                category: c.category || 'Uncategorized',
                count: c._count.id,
            })),
            byPriority: byPriority.map(p => ({
                priority: p.priority,
                count: p._count.id,
            })),
        };
    }
    /**
     * Get message statistics
     * Returns message statistics with filtering
     */
    async getMessageStats(filters = {}) {
        // Build where clause for messages
        const where = {};
        // Apply filters through complaint relation
        // Re-using logic similar to buildComplaintWhere but adapted for nested relation
        const complaintWhere = {};
        if (filters.wardId) {
            complaintWhere.user = { wardId: filters.wardId };
        }
        else if (filters.assignedZoneIds && filters.assignedZoneIds.length > 0) {
            if (filters.zoneId) {
                if (!filters.assignedZoneIds.includes(filters.zoneId)) {
                    complaintWhere.id = -1; // impossible
                }
                else {
                    complaintWhere.user = { zoneId: filters.zoneId };
                }
            }
            else {
                complaintWhere.user = { zoneId: { in: filters.assignedZoneIds } };
            }
        }
        else if (filters.zoneId) {
            complaintWhere.user = { zoneId: filters.zoneId };
        }
        else if (filters.cityCorporationCode) {
            complaintWhere.user = { cityCorporationCode: filters.cityCorporationCode };
        }
        if (Object.keys(complaintWhere).length > 0) {
            where.complaint = complaintWhere;
        }
        // Total messages
        const total = await prisma_1.default.complaintChatMessage.count({ where });
        // Unread messages
        const unread = await prisma_1.default.complaintChatMessage.count({
            where: {
                ...where,
                read: false,
            },
        });
        // Time-based counts
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [todayCount, weekCount] = await Promise.all([
            prisma_1.default.complaintChatMessage.count({ where: { ...where, createdAt: { gte: todayStart } } }),
            prisma_1.default.complaintChatMessage.count({ where: { ...where, createdAt: { gte: weekStart } } }),
        ]);
        // Average response time (simplified - time between citizen message and admin response)
        // This is a placeholder - actual implementation would need more complex logic
        const averageResponseTime = 0; // TODO: Implement actual response time calculation
        return {
            total,
            unread,
            todayCount,
            weekCount,
            averageResponseTime,
        };
    }
    /**
     * Get user statistics
     * Returns user statistics with filtering
     */
    async getUserStats(filters = {}) {
        // Build where clause
        const where = {};
        if (filters.cityCorporationCode) {
            where.cityCorporationCode = filters.cityCorporationCode;
        }
        if (filters.wardId) {
            where.wardId = filters.wardId;
        }
        else if (filters.assignedZoneIds && filters.assignedZoneIds.length > 0) {
            if (filters.zoneId) {
                if (!filters.assignedZoneIds.includes(filters.zoneId)) {
                    where.id = -1; // Force invalid
                }
                else {
                    where.zoneId = filters.zoneId;
                }
            }
            else {
                where.zoneId = { in: filters.assignedZoneIds };
            }
        }
        else if (filters.zoneId) {
            where.zoneId = filters.zoneId;
        }
        // Total citizens
        const totalCitizens = await prisma_1.default.user.count({
            where: {
                ...where,
                role: client_1.users_role.CUSTOMER,
            },
        });
        // Total admins
        const totalAdmins = await prisma_1.default.user.count({
            where: {
                ...where,
                role: client_1.users_role.ADMIN,
            },
        });
        // Total super admins
        const totalSuperAdmins = await prisma_1.default.user.count({
            where: {
                ...where,
                role: client_1.users_role.SUPER_ADMIN,
            },
        });
        // Active users (logged in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = await prisma_1.default.user.count({
            where: {
                ...where,
                lastLoginAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });
        // New users by time period
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [newUsersToday, newUsersWeek, newUsersMonth] = await Promise.all([
            prisma_1.default.user.count({ where: { ...where, createdAt: { gte: todayStart } } }),
            prisma_1.default.user.count({ where: { ...where, createdAt: { gte: weekStart } } }),
            prisma_1.default.user.count({ where: { ...where, createdAt: { gte: monthStart } } }),
        ]);
        return {
            totalCitizens,
            totalAdmins,
            totalSuperAdmins,
            activeUsers,
            newUsersToday,
            newUsersWeek,
            newUsersMonth,
        };
    }
    /**
     * Get performance statistics
     * Returns performance metrics for admins
     */
    async getPerformanceStats(filters = {}) {
        // Build where clause
        const where = this.buildComplaintWhere(filters);
        // Average complaint resolution time
        const resolvedComplaints = await prisma_1.default.complaint.findMany({
            where: {
                ...where,
                status: client_1.Complaint_status.RESOLVED,
                resolvedAt: { not: null },
            },
            select: {
                createdAt: true,
                resolvedAt: true,
            },
        });
        let averageComplaintResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((sum, c) => {
                return sum + (c.resolvedAt.getTime() - c.createdAt.getTime());
            }, 0);
            averageComplaintResolutionTime = totalTime / resolvedComplaints.length / (1000 * 60 * 60); // Hours
        }
        // Average response time (placeholder)
        const averageResponseTime = 0;
        // Admin performance
        const adminPerformanceData = await prisma_1.default.complaint.groupBy({
            by: ['assignedAdminId'],
            where: {
                ...where,
                assignedAdminId: { not: null },
            },
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
        // Get admin details and calculate resolution times
        const adminPerformance = [];
        for (const adminData of adminPerformanceData) {
            if (!adminData.assignedAdminId)
                continue;
            const admin = await prisma_1.default.user.findUnique({
                where: { id: adminData.assignedAdminId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            });
            if (!admin)
                continue;
            const resolvedByAdmin = await prisma_1.default.complaint.findMany({
                where: {
                    assignedAdminId: adminData.assignedAdminId,
                    status: client_1.Complaint_status.RESOLVED,
                    resolvedAt: { not: null },
                },
                select: {
                    createdAt: true,
                    resolvedAt: true,
                    assignedAt: true,
                },
            });
            let avgResolutionTime = 0;
            if (resolvedByAdmin.length > 0) {
                const totalTime = resolvedByAdmin.reduce((sum, c) => {
                    const startTime = c.assignedAt || c.createdAt;
                    return sum + (c.resolvedAt.getTime() - startTime.getTime());
                }, 0);
                avgResolutionTime = totalTime / resolvedByAdmin.length / (1000 * 60 * 60); // Hours
            }
            adminPerformance.push({
                adminId: admin.id,
                adminName: `${admin.firstName} ${admin.lastName}`,
                resolvedCount: resolvedByAdmin.length,
                averageResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            });
        }
        return {
            averageComplaintResolutionTime: Math.round(averageComplaintResolutionTime * 10) / 10,
            averageResponseTime,
            adminPerformance,
        };
    }
    /**
     * Get admin performance metrics
     * Returns detailed performance metrics for a specific admin
     */
    async getAdminPerformance(adminId) {
        const admin = await prisma_1.default.user.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
            },
        });
        if (!admin) {
            throw new Error('Admin not found');
        }
        // Get all assigned complaints
        const totalAssigned = await prisma_1.default.complaint.count({
            where: { assignedAdminId: adminId },
        });
        // Get complaints by status
        const statusCounts = await prisma_1.default.complaint.groupBy({
            by: ['status'],
            where: { assignedAdminId: adminId },
            _count: {
                id: true,
            },
        });
        const statusMap = new Map(statusCounts.map(s => [s.status, s._count.id]));
        const totalResolved = statusMap.get(client_1.Complaint_status.RESOLVED) || 0;
        const totalPending = statusMap.get(client_1.Complaint_status.PENDING) || 0;
        const totalInProgress = statusMap.get(client_1.Complaint_status.IN_PROGRESS) || 0;
        // Resolution rate
        const resolutionRate = totalAssigned > 0 ? Math.round((totalResolved / totalAssigned) * 100) : 0;
        // Average resolution time
        const resolvedComplaints = await prisma_1.default.complaint.findMany({
            where: {
                assignedAdminId: adminId,
                status: client_1.Complaint_status.RESOLVED,
                resolvedAt: { not: null },
            },
            select: {
                createdAt: true,
                resolvedAt: true,
                assignedAt: true,
            },
        });
        let averageResolutionTime = 0;
        if (resolvedComplaints.length > 0) {
            const totalTime = resolvedComplaints.reduce((sum, c) => {
                const startTime = c.assignedAt || c.createdAt;
                return sum + (c.resolvedAt.getTime() - startTime.getTime());
            }, 0);
            averageResolutionTime = totalTime / resolvedComplaints.length / (1000 * 60 * 60); // Hours
        }
        // Response time (placeholder)
        const responseTime = 0;
        return {
            adminId: admin.id,
            adminName: `${admin.firstName} ${admin.lastName}`,
            totalAssigned,
            totalResolved,
            totalPending,
            totalInProgress,
            resolutionRate,
            averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
            responseTime,
        };
    }
    /**
     * Refresh cached statistics
     * Invalidates all cached statistics
     */
    async refreshStatistics() {
        if (redis) {
            const keys = await redis.keys('stats:*');
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
    }
    /**
     * Apply role-based filtering to statistics
     * Modifies filters based on the requesting user's role
     */
    applyRoleBasedFiltering(filters, requestingUser) {
        if (!requestingUser) {
            return filters;
        }
        const effectiveFilters = { ...filters };
        // MASTER_ADMIN: No additional filtering
        if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
            return effectiveFilters;
        }
        // SUPER_ADMIN: Filter by their zone (multi-zone supported)
        if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            if (requestingUser.assignedZoneIds && requestingUser.assignedZoneIds.length > 0) {
                effectiveFilters.assignedZoneIds = requestingUser.assignedZoneIds;
                // If the request specifically asks for a zoneId, ensure it's allowed
                if (effectiveFilters.zoneId && !effectiveFilters.assignedZoneIds.includes(effectiveFilters.zoneId)) {
                    effectiveFilters.zoneId = -1; // Block access
                }
            }
            else {
                effectiveFilters.zoneId = requestingUser.zoneId || undefined;
            }
            return effectiveFilters;
        }
        // ADMIN: Filter by their ward
        if (requestingUser.role === client_1.users_role.ADMIN) {
            effectiveFilters.wardId = requestingUser.wardId || undefined;
            return effectiveFilters;
        }
        return effectiveFilters;
    }
    /**
     * Build complaint where clause from filters
     */
    buildComplaintWhere(filters) {
        const where = {};
        const userFilter = {};
        if (filters.wardId) {
            userFilter.wardId = filters.wardId;
        }
        else if (filters.assignedZoneIds && filters.assignedZoneIds.length > 0) {
            if (filters.zoneId) {
                if (!filters.assignedZoneIds.includes(filters.zoneId)) {
                    where.id = -1; // Invalid
                }
                else {
                    userFilter.zoneId = filters.zoneId;
                }
            }
            else {
                userFilter.zoneId = { in: filters.assignedZoneIds };
            }
        }
        else if (filters.zoneId) {
            userFilter.zoneId = filters.zoneId;
        }
        if (filters.cityCorporationCode) {
            userFilter.cityCorporationCode = filters.cityCorporationCode;
        }
        if (Object.keys(userFilter).length > 0) {
            where.user = userFilter;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        return where;
    }
    /**
     * Generate cache key for statistics
     */
    getCacheKey(type, filters) {
        const parts = [
            'stats',
            type,
            filters.cityCorporationCode || 'all',
            filters.zoneId?.toString() || 'all',
            filters.wardId?.toString() || 'all',
            filters.assignedZoneIds?.sort().join(',') || 'all' // Include assigned zones in cache key
        ];
        if (filters.startDate) {
            parts.push(filters.startDate.toISOString());
        }
        if (filters.endDate) {
            parts.push(filters.endDate.toISOString());
        }
        return parts.join(':');
    }
}
exports.StatisticsService = StatisticsService;
exports.statisticsService = new StatisticsService();
