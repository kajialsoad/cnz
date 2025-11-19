"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplaintAnalytics = getComplaintAnalytics;
exports.getComplaintTrends = getComplaintTrends;
exports.getCategoryStatistics = getCategoryStatistics;
exports.getCategoryTrendsController = getCategoryTrendsController;
const analytics_service_1 = require("../services/analytics.service");
/**
 * Get complaint analytics
 */
async function getComplaintAnalytics(req, res) {
    try {
        const { period, startDate, endDate } = req.query;
        const analytics = await analytics_service_1.analyticsService.getComplaintAnalytics({
            period: period,
            startDate: startDate,
            endDate: endDate
        });
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
        const { period, startDate, endDate } = req.query;
        const trends = await analytics_service_1.analyticsService.getComplaintTrends({
            period: period,
            startDate: startDate,
            endDate: endDate
        });
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
        const { startDate, endDate } = req.query;
        const statistics = await analytics_service_1.analyticsService.getCategoryStatistics({
            startDate: startDate,
            endDate: endDate
        });
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
        const { period, startDate, endDate } = req.query;
        const data = await analytics_service_1.analyticsService.getCategoryTrends({
            period: period,
            startDate: startDate,
            endDate: endDate
        });
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
