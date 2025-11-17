"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getComplaintAnalytics = getComplaintAnalytics;
exports.getComplaintTrends = getComplaintTrends;
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
