"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = getActivityLogs;
exports.exportActivityLogs = exportActivityLogs;
const activity_log_service_1 = require("../services/activity-log.service");
const zod_1 = require("zod");
console.log('🔧 Loading admin.activity-log.controller.ts...');
// Validation schemas
const getActivityLogsQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 50),
    userId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
    action: zod_1.z.string().optional(),
    entityType: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: zod_1.z.string().optional().transform(val => val ? new Date(val) : undefined),
    cityCorporationCode: zod_1.z.string().optional(),
});
// Get activity logs with filters
async function getActivityLogs(req, res) {
    try {
        console.log('📋 Fetching activity logs with query:', req.query);
        // Validate query parameters
        const query = getActivityLogsQuerySchema.parse(req.query);
        // Get requesting user info for role-based filtering
        const requestingUser = req.user ? {
            id: req.user.id,
            role: req.user.role,
            zoneId: req.user.zoneId,
            wardId: req.user.wardId,
        } : undefined;
        // Fetch activity logs from service
        const result = await activity_log_service_1.activityLogService.getActivityLogs(query, requestingUser);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        console.error('❌ Error fetching activity logs:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: err.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to fetch activity logs',
        });
    }
}
// Export activity logs as CSV
async function exportActivityLogs(req, res) {
    try {
        console.log('📤 Exporting activity logs with query:', req.query);
        // Validate query parameters
        const query = getActivityLogsQuerySchema.parse(req.query);
        // Get requesting user info for role-based filtering
        const requestingUser = req.user ? {
            id: req.user.id,
            role: req.user.role,
            zoneId: req.user.zoneId,
            wardId: req.user.wardId,
        } : undefined;
        // Export activity logs as CSV
        const csv = await activity_log_service_1.activityLogService.exportActivityLogs(query, requestingUser);
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);
        return res.status(200).send(csv);
    }
    catch (err) {
        console.error('❌ Error exporting activity logs:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: err.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to export activity logs',
        });
    }
}
