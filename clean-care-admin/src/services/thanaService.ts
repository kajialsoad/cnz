import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// Thana types
export interface Thana {
    id: number;
    name: string;
    cityCorporationId: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    totalUsers?: number;
    totalComplaints?: number;
}

export interface CreateThanaDto {
    name: string;
    cityCorporationCode: string;
}

export interface UpdateThanaDto {
    name?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface ThanaStats {
    totalUsers: number;
    totalComplaints: number;
}

class ThanaService {
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

    // Get thanas by city corporation
    async getThanasByCityCorporation(
        cityCorporationCode: string,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ): Promise<Thana[]> {
        try {
            const params: any = { cityCorporationCode };
            if (status && status !== 'ALL') {
                params.status = status;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: { thanas: Thana[] };
            }>('/api/admin/thanas', { params });

            return response.data.data.thanas;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch thanas'
                );
            }
            throw error;
        }
    }

    // Create new thana
    async createThana(data: CreateThanaDto): Promise<Thana> {
        try {
            const response = await this.apiClient.post<{
                success: boolean;
                data: { thana: Thana };
            }>('/api/admin/thanas', data);

            return response.data.data.thana;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to create thana'
                );
            }
            throw error;
        }
    }

    // Update thana
    async updateThana(id: number, data: UpdateThanaDto): Promise<Thana> {
        try {
            const response = await this.apiClient.put<{
                success: boolean;
                data: { thana: Thana };
            }>(`/api/admin/thanas/${id}`, data);

            return response.data.data.thana;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to update thana'
                );
            }
            throw error;
        }
    }

    // Get thana statistics
    async getThanaStats(id: number): Promise<ThanaStats> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: ThanaStats;
            }>(`/api/admin/thanas/${id}/statistics`);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch thana statistics'
                );
            }
            throw error;
        }
    }
}

export const thanaService = new ThanaService();
