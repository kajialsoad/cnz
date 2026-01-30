import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface GalleryImage {
    id: number;
    title: string;
    description: string | null;
    imageUrl: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    displayOrder: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateGalleryImageDto {
    title: string;
    description?: string;
    imageUrl: string;
    displayOrder?: number;
}

export interface UpdateGalleryImageDto {
    title?: string;
    description?: string;
    imageUrl?: string;
    displayOrder?: number;
}

class GalleryService {
    private apiClient: AxiosInstance;
    private baseUrl = '/api/gallery';

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

    private setupInterceptors() {
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

        this.apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    if (window.location.pathname !== '/login') {
                        window.location.assign('/login');
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // Admin: Get all images
    async getAllImagesForAdmin(): Promise<GalleryImage[]> {
        const response = await this.apiClient.get(`${this.baseUrl}/admin/images`);
        return response.data;
    }

    // Admin: Create new image
    async createImage(data: CreateGalleryImageDto): Promise<GalleryImage> {
        const response = await this.apiClient.post(`${this.baseUrl}/admin/images`, data);
        return response.data;
    }

    // Admin: Update image
    async updateImage(imageId: number, data: UpdateGalleryImageDto): Promise<GalleryImage> {
        const response = await this.apiClient.put(`${this.baseUrl}/admin/images/${imageId}`, data);
        return response.data;
    }

    // Admin: Toggle status
    async toggleStatus(imageId: number): Promise<GalleryImage> {
        const response = await this.apiClient.post(`${this.baseUrl}/admin/images/${imageId}/toggle-status`);
        return response.data;
    }

    // Admin: Reorder images
    async reorderImages(imageIds: number[]): Promise<void> {
        await this.apiClient.post(`${this.baseUrl}/admin/images/reorder`, { imageIds });
    }

    // Admin: Delete image
    async deleteImage(imageId: number): Promise<void> {
        await this.apiClient.delete(`${this.baseUrl}/admin/images/${imageId}`);
    }

    // Upload image to Cloudinary
    async uploadImage(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('images', file);

            const response = await this.apiClient.post<{
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

export const galleryService = new GalleryService();
