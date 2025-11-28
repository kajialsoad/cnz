"use strict";
/**
 * Monitoring Controller
 *
 * This controller provides endpoints for accessing upload monitoring statistics.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitoringController = exports.MonitoringController = void 0;
const upload_monitoring_service_1 = require("../services/upload-monitoring.service");
class MonitoringController {
    /**
     * Get current upload statistics
     */
    async getStatistics(req, res) {
        try {
            const since = req.query.since ? new Date(req.query.since) : undefined;
            const stats = upload_monitoring_service_1.uploadMonitoringService.getStatistics(since);
            res.status(200).json({
                success: true,
                data: {
                    statistics: stats,
                    period: since ? `Since ${since.toISOString()}` : 'All time'
                }
            });
        }
        catch (error) {
            console.error('Error in getStatistics:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch statistics'
            });
        }
    }
    /**
     * Get daily summary
     */
    async getDailySummary(req, res) {
        try {
            const date = req.query.date ? new Date(req.query.date) : undefined;
            const summary = upload_monitoring_service_1.uploadMonitoringService.generateDailySummary(date);
            res.status(200).json({
                success: true,
                data: { summary }
            });
        }
        catch (error) {
            console.error('Error in getDailySummary:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to generate daily summary'
            });
        }
    }
    /**
     * Get Cloudinary usage
     */
    async getCloudinaryUsage(req, res) {
        try {
            const since = req.query.since ? new Date(req.query.since) : undefined;
            const usage = upload_monitoring_service_1.uploadMonitoringService.getCloudinaryUsage(since);
            res.status(200).json({
                success: true,
                data: {
                    usage,
                    period: since ? `Since ${since.toISOString()}` : 'All time'
                }
            });
        }
        catch (error) {
            console.error('Error in getCloudinaryUsage:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch Cloudinary usage'
            });
        }
    }
    /**
     * Get recent errors
     */
    async getRecentErrors(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const errors = upload_monitoring_service_1.uploadMonitoringService.getRecentErrors(limit);
            res.status(200).json({
                success: true,
                data: { errors }
            });
        }
        catch (error) {
            console.error('Error in getRecentErrors:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch recent errors'
            });
        }
    }
    /**
     * Export statistics
     */
    async exportStatistics(req, res) {
        try {
            const since = req.query.since ? new Date(req.query.since) : undefined;
            const json = upload_monitoring_service_1.uploadMonitoringService.exportStatistics(since);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=upload-statistics.json');
            res.status(200).send(json);
        }
        catch (error) {
            console.error('Error in exportStatistics:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to export statistics'
            });
        }
    }
}
exports.MonitoringController = MonitoringController;
exports.monitoringController = new MonitoringController();
