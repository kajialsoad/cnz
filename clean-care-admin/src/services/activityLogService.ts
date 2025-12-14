import apiClient from '../config/apiConfig';
import { ActivityLogQuery, ActivityLogResponse } from '../types/activityLog.types';

class ActivityLogService {
    /**
     * Get activity logs with filters and pagination
     */
    async getActivityLogs(query: ActivityLogQuery): Promise<ActivityLogResponse> {
        const response = await apiClient.get('/admin/activity-logs', {
            params: query,
        });
        return response.data.data;
    }

    /**
     * Export activity logs as CSV
     */
    async exportActivityLogs(query: ActivityLogQuery): Promise<Blob> {
        const response = await apiClient.get('/admin/activity-logs/export', {
            params: query,
            responseType: 'blob',
        });
        return response.data;
    }

    /**
     * Download exported activity logs
     */
    downloadActivityLogs(blob: Blob, filename: string = `activity-logs-${Date.now()}.csv`): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

export const activityLogService = new ActivityLogService();
export default activityLogService;
