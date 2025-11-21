import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { analyticsService } from '../services/analytics.service';

/**
 * Get complaint analytics
 */
export async function getComplaintAnalytics(req: AuthRequest, res: Response) {
    try {
        const { period, startDate, endDate, cityCorporationCode } = req.query;

        const analytics = await analyticsService.getComplaintAnalytics({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        });

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
        const { period, startDate, endDate, cityCorporationCode } = req.query;

        const trends = await analyticsService.getComplaintTrends({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        });

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
        const { startDate, endDate, cityCorporationCode } = req.query;

        const statistics = await analyticsService.getCategoryStatistics({
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        });

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
        const { period, startDate, endDate, cityCorporationCode } = req.query;

        const data = await analyticsService.getCategoryTrends({
            period: period as 'day' | 'week' | 'month' | 'year',
            startDate: startDate as string,
            endDate: endDate as string,
            cityCorporationCode: cityCorporationCode as string
        });

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
