/**
 * Optimized Dashboard Analytics Service
 * Uses single queries with groupBy instead of multiple count queries
 * Implements Redis caching for frequently accessed data
 */

import { Complaint_status } from '@prisma/client';
import redis, {
    getOrSetCache,
    getCacheKey,
    CACHE_PREFIX,
    CACHE_TTL,
    invalidateCacheHelpers
} from '../config/redis-cache-production';

import prisma from '../utils/prisma';

interface DashboardStatsInput {
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    assignedZoneIds?: number[];
    userId?: number;
}

interface DashboardStats {
    totalUsers: number;
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
    rejectedComplaints: number;
    resolutionRate: number;
    averageResolutionTime: number;
}

/**
 * Get dashboard statistics with optimized queries and caching
 */
export async function getDashboardStats(filters: DashboardStatsInput): Promise<DashboardStats> {
    // Generate cache key based on filters
    const cacheKey = getCacheKey(
        CACHE_PREFIX.DASHBOARD,
        'stats',
        filters.cityCorporationCode || 'all',
        filters.zoneId || 'all',
        filters.wardId || 'all',
        filters.userId || 'all'
    );

    return getOrSetCache(cacheKey, CACHE_TTL.DASHBOARD_STATS, async () => {
        // Build user filter
        const userWhere: any = {};
        if (filters.cityCorporationCode) {
            userWhere.cityCorporationCode = filters.cityCorporationCode;
        }
        if (filters.assignedZoneIds && filters.assignedZoneIds.length > 0) {
            userWhere.zoneId = { in: filters.assignedZoneIds };
        } else if (filters.zoneId) {
            userWhere.zoneId = filters.zoneId;
        }
        if (filters.wardId) {
            userWhere.wardId = filters.wardId;
        }

        // Build complaint filter
        const complaintWhere: any = {};
        if (Object.keys(userWhere).length > 0) {
            complaintWhere.user = userWhere;
        }

        // OPTIMIZED: Single query with groupBy instead of 5 separate count queries
        const [userCount, complaintStats, resolutionData] = await Promise.all([
            // User count
            prisma.user.count({ where: userWhere }),

            // Complaint counts grouped by status (1 query instead of 5)
            prisma.complaint.groupBy({
                by: ['status'],
                where: complaintWhere,
                _count: { id: true },
            }),

            // Resolution time calculation (optimized with database aggregation)
            prisma.complaint.aggregate({
                where: {
                    ...complaintWhere,
                    status: Complaint_status.RESOLVED,
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
        }, {} as Record<string, number>);

        const totalComplaints = complaintStats.reduce((sum, stat) => sum + stat._count.id, 0);
        const resolvedComplaints = statusCounts[Complaint_status.RESOLVED] || 0;
        const pendingComplaints = statusCounts[Complaint_status.PENDING] || 0;
        const inProgressComplaints = statusCounts[Complaint_status.IN_PROGRESS] || 0;
        const rejectedComplaints = statusCounts[Complaint_status.REJECTED] || 0;

        // Calculate resolution rate
        const resolutionRate = totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0;

        // Calculate average resolution time
        // For now, we'll fetch resolved complaints to calculate time
        // In production, consider adding a computed column in database
        let averageResolutionTime = 0;
        if (resolvedComplaints > 0) {
            const resolvedComplaintsData = await prisma.complaint.findMany({
                where: {
                    ...complaintWhere,
                    status: Complaint_status.RESOLVED,
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
export async function getComplaintTrends(
    filters: DashboardStatsInput,
    period: 'day' | 'week' | 'month' = 'week'
): Promise<Array<{ date: string; count: number }>> {
    const cacheKey = getCacheKey(
        CACHE_PREFIX.ANALYTICS,
        'trends',
        period,
        filters.cityCorporationCode || 'all',
        filters.zoneId || 'all'
    );

    return getOrSetCache(cacheKey, CACHE_TTL.ANALYTICS, async () => {
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
        const userWhere: any = {};
        if (filters.cityCorporationCode) {
            userWhere.cityCorporationCode = filters.cityCorporationCode;
        }
        if (filters.zoneId) {
            userWhere.zoneId = filters.zoneId;
        }

        const complaintWhere: any = {
            createdAt: {
                gte: startDate,
                lte: now,
            },
        };
        if (Object.keys(userWhere).length > 0) {
            complaintWhere.user = userWhere;
        }

        // Fetch complaints
        const complaints = await prisma.complaint.findMany({
            where: complaintWhere,
            select: {
                createdAt: true,
            },
        });

        // Group by date
        const trendMap = new Map<string, number>();
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
export async function invalidateDashboardCache(filters?: DashboardStatsInput): Promise<void> {
    if (filters?.userId) {
        await invalidateCacheHelpers.dashboard(filters.userId);
    } else {
        await invalidateCacheHelpers.dashboard();
    }
    await invalidateCacheHelpers.analytics();
}

export default {
    getDashboardStats,
    getComplaintTrends,
    invalidateDashboardCache,
};
