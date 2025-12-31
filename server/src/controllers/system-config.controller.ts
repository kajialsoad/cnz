import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { systemConfigService } from '../services/system-config.service';

export class SystemConfigController {
    // Get public/user accessible config
    async getConfig(req: AuthRequest, res: Response) {
        try {
            const { key } = req.params;

            // Whitelist allowed keys for public/user access
            const allowedKeys = ['daily_complaint_limit', 'ward_image_limit'];

            if (!allowedKeys.includes(key)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access to this configuration is restricted'
                });
            }

            // Default values
            const defaultValues: Record<string, string> = {
                'daily_complaint_limit': '20',
                'ward_image_limit': '10'
            };

            const value = await systemConfigService.get(key, defaultValues[key]);

            res.status(200).json({
                success: true,
                data: {
                    key,
                    value
                }
            });
        } catch (error) {
            console.error(`Error fetching config ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch configuration'
            });
        }
    }

    // Get all user accessible configs at once
    async getPublicConfigs(req: AuthRequest, res: Response) {
        try {
            const allowedKeys = ['daily_complaint_limit', 'ward_image_limit'];
            const configs: Record<string, string> = {};

            // Default values
            const defaultValues: Record<string, string> = {
                'daily_complaint_limit': '20',
                'ward_image_limit': '10'
            };

            for (const key of allowedKeys) {
                configs[key] = await systemConfigService.get(key, defaultValues[key]);
            }

            res.status(200).json({
                success: true,
                data: configs
            });
        } catch (error) {
            console.error('Error fetching public configs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch configurations'
            });
        }
    }
}

export const systemConfigController = new SystemConfigController();
