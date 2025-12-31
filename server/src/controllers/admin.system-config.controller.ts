import { Request, Response } from 'express';
import { systemConfigService } from '../services/system-config.service';

interface AuthenticatedRequest extends Request {
    user?: {
        sub: number;
        role: string;
    };
}

export class AdminSystemConfigController {
    // Get all configurations
    async getAll(req: AuthenticatedRequest, res: Response) {
        try {
            const configs = await systemConfigService.getAll();
            res.status(200).json({
                success: true,
                data: configs
            });
        } catch (error) {
            console.error('Error fetching system configs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch system configurations'
            });
        }
    }

    // Get specific config
    async get(req: AuthenticatedRequest, res: Response) {
        try {
            const { key } = req.params;
            const value = await systemConfigService.get(key);
            res.status(200).json({
                success: true,
                data: { key, value }
            });
        } catch (error) {
            console.error(`Error fetching config ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch configuration'
            });
        }
    }

    // Update specific config
    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;

            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Value is required'
                });
            }

            const config = await systemConfigService.set(key, value, description);

            res.status(200).json({
                success: true,
                message: 'Configuration updated successfully',
                data: config
            });
        } catch (error) {
            console.error(`Error updating config ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to update configuration'
            });
        }
    }
}

export const adminSystemConfigController = new AdminSystemConfigController();
