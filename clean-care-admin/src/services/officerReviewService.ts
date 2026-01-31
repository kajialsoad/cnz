import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import {
    OfficerReview,
    CreateOfficerReviewDto,
    UpdateOfficerReviewDto,
} from '../types/officer-review.types';

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

class OfficerReviewService {
    // Get all officer reviews (admin)
    async getAll(): Promise<OfficerReview[]> {
        const response = await apiClient.get('/api/officer-reviews');
        return response.data;
    }

    // Get active officer reviews (public)
    async getActive(): Promise<OfficerReview[]> {
        const response = await apiClient.get('/api/officer-reviews/active');
        return response.data;
    }

    // Get single officer review
    async getById(id: number): Promise<OfficerReview> {
        const response = await apiClient.get(`/api/officer-reviews/${id}`);
        return response.data;
    }

    // Create officer review
    async create(data: CreateOfficerReviewDto): Promise<OfficerReview> {
        const response = await apiClient.post('/api/officer-reviews', data);
        return response.data;
    }

    // Update officer review
    async update(id: number, data: UpdateOfficerReviewDto): Promise<OfficerReview> {
        const response = await apiClient.put(`/api/officer-reviews/${id}`, data);
        return response.data;
    }

    // Delete officer review
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/api/officer-reviews/${id}`);
    }

    // Toggle active status
    async toggleActive(id: number): Promise<OfficerReview> {
        const response = await apiClient.patch(`/api/officer-reviews/${id}/toggle-active`);
        return response.data;
    }

    // Reorder officer reviews
    async reorder(orders: Array<{ id: number; displayOrder: number }>): Promise<void> {
        await apiClient.post('/api/officer-reviews/reorder', { orders });
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

export default new OfficerReviewService();
