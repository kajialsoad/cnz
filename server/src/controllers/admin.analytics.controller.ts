import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { analyticsService } from '../services/analytics.service';
import { multiZoneService } from '../services/multi-zone.service';
import { users_role } from '@prisma/client';

/**
 * Helper to get assigned zone IDs for SUPER_ADMIN
 */
async function getAssignedZoneIds(user: any): Promise<number[] | undefined> {
    if (user?.role === users_role.SUPER_ADMIN) {
        return await multiZoneService.getAssignedZoneIds(user.id);
    }
    return undefined;
}

/**
 * Get complaint analytics
 */
export async function getComplaintAnalytics(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { period, startDate, endDate, cityCorporationCode } = req.query;
        const assignedZoneIds = await getAssignedZoneIds(req.user);

        // Security Check: If Super Admin has no assigned zones, return empty data
        if (req.user.role === users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: {
                    totalComplaints: 0,
                    statusBreakdown: { pending: 0, inProgress: 0, resolved: 0, rejected: 0 },
                    categoryBreakdown: {},
                    wardBreakdown: {},
                    averageResolutionTime: 0,
                    resolutionRate: 0
                }
            });
        }

        const analytics = await analyticsService.getComplaintAnalytics({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        }, assignedZoneIds);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error in getComplaintAnalytics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch analytics'
        });
    }
}

/**
 * Get complaint trends
 */
export async function getComplaintTrends(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { period, startDate, endDate, cityCorporationCode } = req.query;
        const assignedZoneIds = await getAssignedZoneIds(req.user);

        // Security Check
        if (req.user.role === users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: { trends: [] }
            });
        }

        const trends = await analyticsService.getComplaintTrends({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        }, assignedZoneIds);

        res.status(200).json({
            success: true,
            data: { trends }
        });
    } catch (error) {
        console.error('Error in getComplaintTrends:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch trends'
        });
    }
}

/**
 * Get category statistics
 */
export async function getCategoryStatistics(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { startDate, endDate, cityCorporationCode } = req.query;
        const assignedZoneIds = await getAssignedZoneIds(req.user);

        // Security Check
        if (req.user.role === users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: {
                    statistics: [],
                    totalCategories: 0,
                    totalComplaints: 0
                }
            });
        }

        const statistics = await analyticsService.getCategoryStatistics({
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        }, assignedZoneIds);

        res.status(200).json({
            success: true,
            data: {
                statistics,
                totalCategories: statistics.length,
                totalComplaints: statistics.reduce((sum, cat) => sum + cat.totalCount, 0)
            }
        });
    } catch (error) {
        console.error('Error in getCategoryStatistics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch category statistics'
        });
    }
}

/**
 * Get category trends
 */
export async function getCategoryTrendsController(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const { period, startDate, endDate, cityCorporationCode } = req.query;
        const assignedZoneIds = await getAssignedZoneIds(req.user);

        // Security Check
        if (req.user.role === users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: {
                    trends: [],
                    categories: []
                }
            });
        }

        const data = await analyticsService.getCategoryTrends({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        }, assignedZoneIds);

        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error in getCategoryTrends:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch category trends'
        });
    }
}
