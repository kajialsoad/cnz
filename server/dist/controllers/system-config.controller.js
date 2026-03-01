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
            const allowedKeys = [
                'daily_complaint_limit',
                'ward_image_limit',
                'verification_sms_enabled',
                'verification_email_enabled',
                'verification_whatsapp_enabled',
                'verification_truecaller_enabled',
                'maintenance_mode',
                'forgot_password_system',
                'forgot_password_request_limit',
                'forgot_password_window_minutes',
                'forgot_password_otp_expiry_minutes'
            ];
            if (!allowedKeys.includes(key)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access to this configuration is restricted'
                });
            }
            // Default values
            const defaultValues = {
                'daily_complaint_limit': process.env.DAILY_COMPLAINT_LIMIT || '20',
                'ward_image_limit': process.env.WARD_IMAGE_LIMIT || '10',
                'verification_sms_enabled': process.env.VERIFICATION_SMS_ENABLED || 'true',
                'verification_email_enabled': process.env.VERIFICATION_EMAIL_ENABLED || 'true',
                'verification_whatsapp_enabled': process.env.VERIFICATION_WHATSAPP_ENABLED || 'true',
                'verification_truecaller_enabled': process.env.VERIFICATION_TRUECALLER_ENABLED || 'false',
                'maintenance_mode': process.env.MAINTENANCE_MODE || 'false',
                'forgot_password_system': 'true',
                'forgot_password_request_limit': '3',
                'forgot_password_window_minutes': '15',
                'forgot_password_otp_expiry_minutes': '5'
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
            const allowedKeys = [
                'daily_complaint_limit',
                'ward_image_limit',
                'verification_sms_enabled',
                'verification_email_enabled',
                'verification_whatsapp_enabled',
                'verification_truecaller_enabled',
                'forgot_password_system',
                'forgot_password_request_limit',
                'forgot_password_window_minutes',
                'forgot_password_otp_expiry_minutes'
            ];
            const configs = {};
            // Default values
            const defaultValues = {
                'daily_complaint_limit': process.env.DAILY_COMPLAINT_LIMIT || '20',
                'ward_image_limit': process.env.WARD_IMAGE_LIMIT || '10',
                'verification_sms_enabled': process.env.VERIFICATION_SMS_ENABLED || 'true',
                'verification_email_enabled': process.env.VERIFICATION_EMAIL_ENABLED || 'true',
                'verification_whatsapp_enabled': process.env.VERIFICATION_WHATSAPP_ENABLED || 'true',
                'verification_truecaller_enabled': process.env.VERIFICATION_TRUECALLER_ENABLED || 'false',
                'forgot_password_system': 'true',
                'forgot_password_request_limit': '3',
                'forgot_password_window_minutes': '15',
                'forgot_password_otp_expiry_minutes': '5'
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
