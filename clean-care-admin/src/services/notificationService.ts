import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Notification Service
 * Handles all notification-related API calls
 */

// ==================== Types ====================

export interface Notification {
    id: number;
    userId: number;
    complaintId: number | null;
    title: string;
    message: string;
    type: string;
    statusChange: string | null;
    metadata: NotificationMetadata | null;
    isRead: boolean;
    createdAt: string;
    complaint?: {
        id: number;
        title: string;
        status: string;
    } | null;
}

export interface NotificationMetadata {
    resolutionImages?: string[];
    resolutionNote?: string;
    othersCategory?: string;
    othersSubcategory?: string;
    adminName?: string;
}

export interface GetNotificationsResponse {
    notifications: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    unreadCount: number;
}

export interface GetNotificationsParams {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
}

export interface UnreadCountResponse {
    count: number;
}

export interface MarkAsReadResponse {
    id: number;
    isRead: boolean;
}

export interface MarkAllAsReadResponse {
    updatedCount: number;
}

export interface ApiError {
    name: string;
    statusCode: number;
    message: string;
    errors?: any[];
}

// ==================== Service Class ====================

class NotificationService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors() {
        // Request interceptor - Add auth token
        this.apiClient.interceptors.request.use(
            (config) => {
                try {
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                } catch (error) {
                    console.error('Error getting token:', error);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - Handle errors
        this.apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid - redirect to login
                    if (window.location.pathname !== '/login') {
                        window.location.assign('/login');
                    }
                }
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Handle API errors and convert to ApiError
     */
    private handleError(error: any): ApiError {
        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status || 500;
            const message = error.response?.data?.message || 'An error occurred';
            const errors = error.response?.data?.errors;

            return {
                name: 'ApiError',
                statusCode,
                message,
                errors,
            } as ApiError;
        }

        return {
            name: 'ApiError',
            statusCode: 500,
            message: error.message || 'An unexpected error occurred',
        } as ApiError;
    }

    /**
     * Parse metadata from JSON string
     */
    private parseMetadata(metadata: string | null): NotificationMetadata | null {
        if (!metadata) return null;

        try {
            return JSON.parse(metadata);
        } catch (error) {
            console.error('Error parsing notification metadata:', error);
            return null;
        }
    }

    /**
     * Get user notifications with pagination
     * @param params - Query parameters (page, limit, unreadOnly)
     * @returns Paginated notifications with unread count
     */
    async getNotifications(
        params: GetNotificationsParams = {}
    ): Promise<GetNotificationsResponse> {
        try {
            const queryParams: any = {
                page: params.page || 1,
                limit: params.limit || 20,
            };

            if (params.unreadOnly !== undefined) {
                queryParams.unreadOnly = params.unreadOnly;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: GetNotificationsResponse;
            }>('/api/notifications', { params: queryParams });

            // Parse metadata for each notification
            const notifications = response.data.data.notifications.map((notification) => ({
                ...notification,
                metadata: this.parseMetadata(notification.metadata as any),
            }));

            return {
                ...response.data.data,
                notifications,
            };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     * @returns Count of unread notifications
     */
    async getUnreadCount(): Promise<number> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: UnreadCountResponse;
            }>('/api/notifications/count-unread');

            return response.data.data.count;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            throw error;
        }
    }

    /**
     * Mark a single notification as read
     * @param notificationId - ID of the notification to mark as read
     * @returns Updated notification
     */
    async markAsRead(notificationId: number): Promise<MarkAsReadResponse> {
        try {
            const response = await this.apiClient.patch<{
                success: boolean;
                data: MarkAsReadResponse;
            }>(`/api/notifications/${notificationId}/read`);

            return response.data.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     * @returns Count of updated notifications
     */
    async markAllAsRead(): Promise<number> {
        try {
            const response = await this.apiClient.patch<{
                success: boolean;
                data: MarkAllAsReadResponse;
            }>('/api/notifications/read-all');

            return response.data.data.updatedCount;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
