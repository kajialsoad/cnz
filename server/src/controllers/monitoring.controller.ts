/**
 * Monitoring Controller
 * 
 * This controller provides endpoints for accessing upload monitoring statistics.
 */

import { Request, Response } from 'express';
import { uploadMonitoringService } from '../services/upload-monitoring.service';

export class MonitoringController {
    /**
     * Get current upload statistics
     */
    async getStatistics(req: Request, res: Response) {
        try {
            const since = req.query.since ? new Date(req.query.since as string) : undefined;
            const stats = uploadMonitoringService.getStatistics(since);

            res.status(200).json({
                success: true,
                data: {
                    statistics: stats,
                    period: since ? `Since ${since.toISOString()}` : 'All time'
                }
            });
        } catch (error) {
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
    async getDailySummary(req: Request, res: Response) {
        try {
            const date = req.query.date ? new Date(req.query.date as string) : undefined;
            const summary = uploadMonitoringService.generateDailySummary(date);

            res.status(200).json({
                success: true,
                data: { summary }
            });
        } catch (error) {
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
    async getCloudinaryUsage(req: Request, res: Response) {
        try {
            const since = req.query.since ? new Date(req.query.since as string) : undefined;
            const usage = uploadMonitoringService.getCloudinaryUsage(since);

            res.status(200).json({
                success: true,
                data: {
                    usage,
                    period: since ? `Since ${since.toISOString()}` : 'All time'
                }
            });
        } catch (error) {
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
    async getRecentErrors(req: Request, res: Response) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
            const errors = uploadMonitoringService.getRecentErrors(limit);

            res.status(200).json({
                success: true,
                data: { errors }
            });
        } catch (error) {
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
    async exportStatistics(req: Request, res: Response) {
        try {
            const since = req.query.since ? new Date(req.query.since as string) : undefined;
            const json = uploadMonitoringService.exportStatistics(since);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=upload-statistics.json');
            res.status(200).send(json);
        } catch (error) {
            console.error('Error in exportStatistics:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to export statistics'
            });
        }
    }
}

export const monitoringController = new MonitoringController();
