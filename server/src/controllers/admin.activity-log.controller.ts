import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { activityLogService } from '../services/activity-log.service';
import { z } from 'zod';

console.log('🔧 Loading admin.activity-log.controller.ts...');

// Validation schemas
const getActivityLogsQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    action: z.string().optional(),
    entityType: z.string().optional(),
    startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    cityCorporationCode: z.string().optional(),
});

// Get activity logs with filters
export async function getActivityLogs(req: AuthRequest, res: Response) {
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
        const result = await activityLogService.getActivityLogs(query, requestingUser);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        console.error('❌ Error fetching activity logs:', err);

        if (err instanceof z.ZodError) {
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
export async function exportActivityLogs(req: AuthRequest, res: Response) {
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
        const csv = await activityLogService.exportActivityLogs(query, requestingUser);

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=activity-logs-${Date.now()}.csv`);

        return res.status(200).send(csv);
    } catch (err: any) {
        console.error('❌ Error exporting activity logs:', err);

        if (err instanceof z.ZodError) {
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
