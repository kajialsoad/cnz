"use strict";
/**
 * Optimized Dashboard Analytics Service
 * Uses single queries with groupBy instead of multiple count queries
 * Implements Redis caching for frequently accessed data
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getComplaintTrends = getComplaintTrends;
exports.invalidateDashboardCache = invalidateDashboardCache;
const client_1 = require("@prisma/client");
const redis_cache_production_1 = require("../config/redis-cache-production");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get dashboard statistics with optimized queries and caching
 */
async function getDashboardStats(filters) {
    // Generate cache key based on filters
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.DASHBOARD, 'stats', filters.cityCorporationCode || 'all', filters.zoneId || 'all', filters.wardId || 'all', filters.userId || 'all');
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.DASHBOARD_STATS, async () => {
        // Build user filter
        const userWhere = {};
        if (filters.cityCorporationCode) {
            userWhere.cityCorporationCode = filters.cityCorporationCode;
        }
        if (filters.assignedZoneIds && filters.assignedZoneIds.length > 0) {
            userWhere.zoneId = { in: filters.assignedZoneIds };
        }
        else if (filters.zoneId) {
            userWhere.zoneId = filters.zoneId;
        }
        if (filters.wardId) {
            userWhere.wardId = filters.wardId;
        }
        // Build complaint filter
        const complaintWhere = {};
        if (Object.keys(userWhere).length > 0) {
            complaintWhere.user = userWhere;
        }
        // OPTIMIZED: Single query with groupBy instead of 5 separate count queries
        const [userCount, complaintStats, resolutionData] = await Promise.all([
            // User count
            prisma_1.default.user.count({ where: userWhere }),
            // Complaint counts grouped by status (1 query instead of 5)
            prisma_1.default.complaint.groupBy({
                by: ['status'],
                where: complaintWhere,
                _count: { id: true },
            }),
            // Resolution time calculation (optimized with database aggregation)
            prisma_1.default.complaint.aggregate({
                where: {
                    ...complaintWhere,
                    status: client_1.Complaint_status.RESOLVED,
                    resolvedAt: { not: null },
                },
                _avg: {
                // Calculate average resolution time in database
                // Note: This requires a computed column or we calculate in application
                },
                _count: { id: true },
            }),
        ]);
        // Parse complaint stats
        const statusCounts = complaintStats.reduce((acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
        }, {});
        const totalComplaints = complaintStats.reduce((sum, stat) => sum + stat._count.id, 0);
        const resolvedComplaints = statusCounts[client_1.Complaint_status.RESOLVED] || 0;
        const pendingComplaints = statusCounts[client_1.Complaint_status.PENDING] || 0;
        const inProgressComplaints = statusCounts[client_1.Complaint_status.IN_PROGRESS] || 0;
        const rejectedComplaints = statusCounts[client_1.Complaint_status.REJECTED] || 0;
        // Calculate resolution rate
        const resolutionRate = totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0;
        // Calculate average resolution time
        // For now, we'll fetch resolved complaints to calculate time
        // In production, consider adding a computed column in database
        let averageResolutionTime = 0;
        if (resolvedComplaints > 0) {
            const resolvedComplaintsData = await prisma_1.default.complaint.findMany({
                where: {
                    ...complaintWhere,
                    status: client_1.Complaint_status.RESOLVED,
                    resolvedAt: { not: null },
                },
                select: {
                    createdAt: true,
                    resolvedAt: true,
                },
                take: 1000, // Limit to recent 1000 for performance
            });
            const totalTime = resolvedComplaintsData.reduce((sum, complaint) => {
                if (complaint.resolvedAt) {
                    const time = complaint.resolvedAt.getTime() - complaint.createdAt.getTime();
                    return sum + time;
                }
                return sum;
            }, 0);
            averageResolutionTime = Math.round(totalTime / resolvedComplaintsData.length / (1000 * 60 * 60)); // Convert to hours
        }
        return {
            totalUsers: userCount,
            totalComplaints,
            resolvedComplaints,
            pendingComplaints,
            inProgressComplaints,
            rejectedComplaints,
            resolutionRate,
            averageResolutionTime,
        };
    });
}
/**
 * Get complaint trends with optimized queries
 */
async function getComplaintTrends(filters, period = 'week') {
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.ANALYTICS, 'trends', period, filters.cityCorporationCode || 'all', filters.zoneId || 'all');
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.ANALYTICS, async () => {
        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 7); // Last 7 days
                break;
            case 'week':
                startDate.setDate(now.getDate() - 30); // Last 30 days
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 6); // Last 6 months
                break;
        }
        // Build filters
        const userWhere = {};
        if (filters.cityCorporationCode) {
            userWhere.cityCorporationCode = filters.cityCorporationCode;
        }
        if (filters.zoneId) {
            userWhere.zoneId = filters.zoneId;
        }
        const complaintWhere = {
            createdAt: {
                gte: startDate,
                lte: now,
            },
        };
        if (Object.keys(userWhere).length > 0) {
            complaintWhere.user = userWhere;
        }
        // Fetch complaints
        const complaints = await prisma_1.default.complaint.findMany({
            where: complaintWhere,
            select: {
                createdAt: true,
            },
        });
        // Group by date
        const trendMap = new Map();
        complaints.forEach(complaint => {
            const dateKey = complaint.createdAt.toISOString().split('T')[0];
            trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
        });
        // Convert to array and sort
        return Array.from(trendMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    });
}
/**
 * Invalidate dashboard cache when data changes
 */
async function invalidateDashboardCache(filters) {
    if (filters?.userId) {
        await redis_cache_production_1.invalidateCacheHelpers.dashboard(filters.userId);
    }
    else {
        await redis_cache_production_1.invalidateCacheHelpers.dashboard();
    }
    await redis_cache_production_1.invalidateCacheHelpers.analytics();
}
exports.default = {
    getDashboardStats,
    getComplaintTrends,
    invalidateDashboardCache,
};
