import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import {
    Notice,
    NoticeCategory,
    CreateNoticeDTO,
    UpdateNoticeDTO,
    NoticeFilters,
    NoticeListResponse,
    NoticeAnalytics,
} from '../types/notice.types';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    withCredentials: true,
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

class NoticeService {
    // ==================== Notice APIs ====================

    // Get all notices (admin)
    async getAllNotices(
        filters: NoticeFilters = {},
        page = 1,
        limit = 20
    ): Promise<NoticeListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters.type) params.append('type', filters.type);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        if (filters.search) params.append('search', filters.search);

        const response = await apiClient.get(`/api/notices?${params.toString()}`);
        return response.data;
    }

    // Get active notices (public)
    async getActiveNotices(
        filters: Partial<NoticeFilters> = {},
        page = 1,
        limit = 20
    ): Promise<NoticeListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
        if (filters.type) params.append('type', filters.type);

        const response = await apiClient.get(`/api/notices/active?${params.toString()}`);
        return response.data;
    }

    // Get notice by ID
    async getNoticeById(id: number): Promise<Notice> {
        const response = await apiClient.get(`/api/notices/${id}`);
        return response.data;
    }

    // Create notice
    async createNotice(data: CreateNoticeDTO): Promise<Notice> {
        const response = await apiClient.post('/api/notices', data);
        return response.data;
    }

    // Update notice
    async updateNotice(id: number, data: UpdateNoticeDTO): Promise<Notice> {
        const response = await apiClient.put(`/api/notices/${id}`, data);
        return response.data;
    }

    // Toggle notice status
    async toggleNoticeStatus(id: number): Promise<Notice> {
        const response = await apiClient.patch(`/api/notices/${id}/toggle`);
        return response.data;
    }

    // Delete notice
    async deleteNotice(id: number): Promise<void> {
        await apiClient.delete(`/api/notices/${id}`);
    }

    // Get analytics
    async getAnalytics(): Promise<NoticeAnalytics> {
        const response = await apiClient.get('/api/notices/analytics/stats');
        return response.data;
    }

    // Increment view count
    async incrementViewCount(id: number): Promise<void> {
        await apiClient.post(`/api/notices/${id}/view`);
    }

    // Mark as read
    async markAsRead(id: number): Promise<void> {
        await apiClient.post(`/api/notices/${id}/read`);
    }

    // ==================== Category APIs ====================

    // Get all categories
    async getAllCategories(): Promise<NoticeCategory[]> {
        const response = await apiClient.get('/api/notice-categories');
        return response.data.data;
    }

    // Get category tree
    async getCategoryTree(): Promise<NoticeCategory[]> {
        const response = await apiClient.get('/api/notice-categories/tree');
        return response.data.data;
    }

    // Get category by ID
    async getCategoryById(id: number): Promise<NoticeCategory> {
        const response = await apiClient.get(`/api/notice-categories/${id}`);
        return response.data.data;
    }

    // Create category
    async createCategory(data: Partial<NoticeCategory>): Promise<NoticeCategory> {
        const response = await apiClient.post('/api/notice-categories', data);
        return response.data.data;
    }

    // Update category
    async updateCategory(id: number, data: Partial<NoticeCategory>): Promise<NoticeCategory> {
        const response = await apiClient.put(`/api/notice-categories/${id}`, data);
        return response.data.data;
    }

    // Delete category
    async deleteCategory(id: number): Promise<void> {
        await apiClient.delete(`/api/notice-categories/${id}`);
    }

    // Upload image to Cloudinary
    async uploadImage(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('images', file);

            const response = await apiClient.post<{
                success: boolean;
                data: {
                    fileUrls: string[];
                };
            }>('/api/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && response.data.data.fileUrls.length > 0) {
                return response.data.data.fileUrls[0];
            }

            throw new Error('Failed to upload image');
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
}

export default new NoticeService();
