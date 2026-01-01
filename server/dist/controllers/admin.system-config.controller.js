"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSystemConfigController = exports.AdminSystemConfigController = void 0;
const system_config_service_1 = require("../services/system-config.service");
class AdminSystemConfigController {
    // Get all configurations
    async getAll(req, res) {
        try {
            const configs = await system_config_service_1.systemConfigService.getAll();
            res.status(200).json({
                success: true,
                data: configs
            });
        }
        catch (error) {
            console.error('Error fetching system configs:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch system configurations'
            });
        }
    }
    // Get specific config
    async get(req, res) {
        try {
            const { key } = req.params;
            const value = await system_config_service_1.systemConfigService.get(key);
            res.status(200).json({
                success: true,
                data: { key, value }
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
    // Update specific config
    async update(req, res) {
        try {
            const { key } = req.params;
            const { value, description } = req.body;
            if (value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Value is required'
                });
            }
            const config = await system_config_service_1.systemConfigService.set(key, value, description);
            res.status(200).json({
                success: true,
                message: 'Configuration updated successfully',
                data: config
            });
        }
        catch (error) {
            console.error(`Error updating config ${req.params.key}:`, error);
            res.status(500).json({
                success: false,
                message: 'Failed to update configuration'
            });
        }
    }
}
exports.AdminSystemConfigController = AdminSystemConfigController;
exports.adminSystemConfigController = new AdminSystemConfigController();
