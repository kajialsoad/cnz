"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigController = exports.SystemConfigController = void 0;
const system_config_service_1 = require("../services/system-config.service");
class SystemConfigController {
    // Get public/user accessible config
    async getConfig(req, res) {
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
            const defaultValues = {
                'daily_complaint_limit': '20',
                'ward_image_limit': '10'
            };
            const value = await system_config_service_1.systemConfigService.get(key, defaultValues[key]);
            res.status(200).json({
                success: true,
                data: {
                    key,
                    value
                }
            });
        }
        catch (error) {
            console.error(`Error fetching config ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch configuration'
            });
        }
    }
    // Get all user accessible configs at once
    async getPublicConfigs(req, res) {
        try {
            const allowedKeys = ['daily_complaint_limit', 'ward_image_limit'];
            const configs = {};
            // Default values
            const defaultValues = {
                'daily_complaint_limit': '20',
                'ward_image_limit': '10'
            };
            for (const key of allowedKeys) {
                configs[key] = await system_config_service_1.systemConfigService.get(key, defaultValues[key]);
            }
            res.status(200).json({
                success: true,
                data: configs
            });
        }
        catch (error) {
            console.error('Error fetching public configs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch configurations'
            });
        }
    }
}
exports.SystemConfigController = SystemConfigController;
exports.systemConfigController = new SystemConfigController();
