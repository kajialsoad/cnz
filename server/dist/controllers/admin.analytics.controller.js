"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplaintAnalytics = getComplaintAnalytics;
exports.getComplaintTrends = getComplaintTrends;
exports.getCategoryStatistics = getCategoryStatistics;
exports.getCategoryTrendsController = getCategoryTrendsController;
const analytics_service_1 = require("../services/analytics.service");
const multi_zone_service_1 = require("../services/multi-zone.service");
const client_1 = require("@prisma/client");
/**
 * Helper to get assigned zone IDs for SUPER_ADMIN
 */
async function getAssignedZoneIds(user) {
    if (user?.role === client_1.users_role.SUPER_ADMIN) {
        return await multi_zone_service_1.multiZoneService.getAssignedZoneIds(user.id);
    }
    return undefined;
}
/**
 * Get complaint analytics
 */
async function getComplaintAnalytics(req, res) {
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
        if (req.user.role === client_1.users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
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
        const analytics = await analytics_service_1.analyticsService.getComplaintAnalytics({
            period: period,
            startDate: startDate,
            endDate: endDate,
            cityCorporationCode: cityCorporationCode
        }, assignedZoneIds);
        res.status(200).json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
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
async function getComplaintTrends(req, res) {
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
        if (req.user.role === client_1.users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: { trends: [] }
            });
        }
        const trends = await analytics_service_1.analyticsService.getComplaintTrends({
            period: period,
            startDate: startDate,
            endDate: endDate,
            cityCorporationCode: cityCorporationCode
        }, assignedZoneIds);
        res.status(200).json({
            success: true,
            data: { trends }
        });
    }
    catch (error) {
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
async function getCategoryStatistics(req, res) {
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
        if (req.user.role === client_1.users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: {
                    statistics: [],
                    totalCategories: 0,
                    totalComplaints: 0
                }
            });
        }
        const statistics = await analytics_service_1.analyticsService.getCategoryStatistics({
            startDate: startDate,
            endDate: endDate,
            cityCorporationCode: cityCorporationCode
        }, assignedZoneIds);
        res.status(200).json({
            success: true,
            data: {
                statistics,
                totalCategories: statistics.length,
                totalComplaints: statistics.reduce((sum, cat) => sum + cat.totalCount, 0)
            }
        });
    }
    catch (error) {
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
async function getCategoryTrendsController(req, res) {
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
        if (req.user.role === client_1.users_role.SUPER_ADMIN && (!assignedZoneIds || assignedZoneIds.length === 0)) {
            return res.status(200).json({
                success: true,
                data: {
                    trends: [],
                    categories: []
                }
            });
        }
        const data = await analytics_service_1.analyticsService.getCategoryTrends({
            period: period,
            startDate: startDate,
            endDate: endDate,
            cityCorporationCode: cityCorporationCode
        }, assignedZoneIds);
        res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        console.error('Error in getCategoryTrends:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch category trends'
        });
    }
}
