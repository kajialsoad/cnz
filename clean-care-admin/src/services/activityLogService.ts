import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { ActivityLogQuery, ActivityLogResponse } from '../types/activityLog.types';

// Create axios instance with correct config
const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor to include the token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

class ActivityLogService {
    /**
     * Get activity logs with filters and pagination
     */
    async getActivityLogs(query: ActivityLogQuery): Promise<ActivityLogResponse> {
        // Corrected path to include /api prefix
        const response = await apiClient.get('/api/admin/activity-logs', {
            params: query,
        });
        return response.data.data;
    }

    /**
     * Export activity logs as CSV
     */
    async exportActivityLogs(query: ActivityLogQuery): Promise<Blob> {
        const response = await apiClient.get('/api/admin/activity-logs/export', {
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
