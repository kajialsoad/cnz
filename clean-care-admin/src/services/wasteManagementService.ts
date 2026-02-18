import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface WastePost {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
    category: 'CURRENT_WASTE' | 'FUTURE_WASTE';
    status: 'DRAFT' | 'PUBLISHED';
    displayOrder: number;
    createdBy: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    likeCount: number;
    loveCount: number;
    userReaction?: 'LIKE' | 'LOVE' | null;
}

export interface CreateWastePostDto {
    title: string;
    content: string;
    imageUrl?: string;
    category: 'CURRENT_WASTE' | 'FUTURE_WASTE';
}

export interface UpdateWastePostDto {
    title?: string;
    content?: string;
    imageUrl?: string;
    category?: 'CURRENT_WASTE' | 'FUTURE_WASTE';
}

class WasteManagementService {
    private apiClient: AxiosInstance;
    private baseUrl = '/api/waste-management';

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
                return Promise.reject(error);
            }
        );
    }

    // Admin: Get all posts (including drafts)
    async getAllPostsForAdmin(): Promise<WastePost[]> {
        const response = await this.apiClient.get(`${this.baseUrl}/admin/posts`);
        return response.data;
    }

    // Admin: Create new post
    async createPost(data: CreateWastePostDto): Promise<WastePost> {
        const response = await this.apiClient.post(`${this.baseUrl}/admin/posts`, data);
        return response.data;
    }

    // Admin: Update post
    async updatePost(postId: number, data: UpdateWastePostDto): Promise<WastePost> {
        const response = await this.apiClient.put(`${this.baseUrl}/admin/posts/${postId}`, data);
        return response.data;
    }

    // Admin: Publish post
    async publishPost(postId: number): Promise<WastePost> {
        const response = await this.apiClient.post(`${this.baseUrl}/admin/posts/${postId}/publish`);
        return response.data;
    }

    // Admin: Unpublish post
    async unpublishPost(postId: number): Promise<WastePost> {
        const response = await this.apiClient.post(`${this.baseUrl}/admin/posts/${postId}/unpublish`);
        return response.data;
    }

    // Admin: Delete post
    async deletePost(postId: number): Promise<void> {
        await this.apiClient.delete(`${this.baseUrl}/admin/posts/${postId}`);
    }

    // Admin: Reorder posts
    async reorder(orders: Array<{ id: number; displayOrder: number }>): Promise<void> {
        await this.apiClient.post(`${this.baseUrl}/admin/posts/reorder`, { orders });
    }

    // User: Get published posts
    async getPublishedPosts(): Promise<WastePost[]> {
        const response = await this.apiClient.get(`${this.baseUrl}/posts`);
        return response.data;
    }

    // User: Get post by ID
    async getPostById(postId: number): Promise<WastePost> {
        const response = await this.apiClient.get(`${this.baseUrl}/posts/${postId}`);
        return response.data;
    }

    // User: Get posts by category
    async getPostsByCategory(category: 'CURRENT_WASTE' | 'FUTURE_WASTE'): Promise<WastePost[]> {
        const response = await this.apiClient.get(`${this.baseUrl}/posts/category/${category}`);
        return response.data;
    }

    // User: Toggle reaction (like/love)
    async toggleReaction(postId: number, reactionType: 'LIKE' | 'LOVE'): Promise<any> {
        const response = await this.apiClient.post(`${this.baseUrl}/posts/${postId}/reaction`, {
            reactionType,
        });
        return response.data;
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

export const wasteManagementService = new WasteManagementService();

