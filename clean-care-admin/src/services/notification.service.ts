import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { PaginatedNotifications, Notification } from '../types/notification.types';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const notificationService = {
    getUserNotifications: async (page = 1, limit = 20, unreadOnly = false): Promise<PaginatedNotifications> => {
        const response = await apiClient.get('/api/notifications', {
            params: { page, limit, unreadOnly }
        });
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await apiClient.get('/api/notifications/unread-count');
        return response.data.data.count;
    },

    markAsRead: async (id: number): Promise<Notification> => {
        const response = await apiClient.patch(`/api/notifications/${id}/read`);
        return response.data.data.notification;
    },

    markAllAsRead: async (): Promise<number> => {
        const response = await apiClient.patch('/api/notifications/read-all');
        return response.data.data.updatedCount;
    }
};
