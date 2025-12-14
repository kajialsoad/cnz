import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// City Corporation types
export interface CityCorporation {
    id: number;
    code: string;
    name: string;
    minWard: number;
    maxWard: number;
    minZone: number;
    maxZone: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    totalUsers?: number;
    totalComplaints?: number;
    activeThanas?: number;
    totalZones?: number;
    totalWards?: number;
    actualMaxZone?: number | null;
    actualMaxWard?: number | null;
}

export interface CreateCityCorporationDto {
    code: string;
    name: string;
    minWard: number;
    maxWard: number;
    minZone: number;
    maxZone: number;
}

export interface UpdateCityCorporationDto {
    name?: string;
    minWard?: number;
    maxWard?: number;
    minZone?: number;
    maxZone?: number;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface CityCorporationStats {
    totalUsers: number;
    totalComplaints: number;
    resolvedComplaints: number;
    activeThanas: number;
}

class CityCorporationService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: 60000, // 60 seconds for city corporation stats
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

    // Get all city corporations
    async getCityCorporations(status?: 'ACTIVE' | 'INACTIVE' | 'ALL'): Promise<{ cityCorporations: CityCorporation[] }> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                cityCorporations: CityCorporation[];
            }>('/api/admin/city-corporations', {
                params: status && status !== 'ALL' ? { status } : undefined,
            });

            // Backend returns { success: true, cityCorporations: [...] }
            const cityCorporations = response.data.cityCorporations || [];

            if (!Array.isArray(cityCorporations)) {
                console.warn('City corporations data is not an array, returning empty array');
                return { cityCorporations: [] };
            }

            return { cityCorporations };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Failed to fetch city corporations:', error.response?.data?.message || error.message);
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch city corporations'
                );
            }
            throw error;
        }
    }

    // Get single city corporation by code
    async getCityCorporationByCode(code: string): Promise<CityCorporation> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: CityCorporation;
            }>(`/api/admin/city-corporations/${code}`);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch city corporation'
                );
            }
            throw error;
        }
    }

    // Create new city corporation
    async createCityCorporation(data: CreateCityCorporationDto): Promise<CityCorporation> {
        try {
            const response = await this.apiClient.post<{
                success: boolean;
                data: CityCorporation;
            }>('/api/admin/city-corporations', data);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to create city corporation'
                );
            }
            throw error;
        }
    }

    // Update city corporation
    async updateCityCorporation(
        code: string,
        data: UpdateCityCorporationDto
    ): Promise<CityCorporation> {
        try {
            const response = await this.apiClient.put<{
                success: boolean;
                data: CityCorporation;
            }>(`/api/admin/city-corporations/${code}`, data);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to update city corporation'
                );
            }
            throw error;
        }
    }

    // Get city corporation statistics
    async getCityCorporationStats(code: string): Promise<CityCorporationStats> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: CityCorporationStats;
            }>(`/api/admin/city-corporations/${code}/statistics`);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch city corporation statistics'
                );
            }
            throw error;
        }
    }
}

export const cityCorporationService = new CityCorporationService();
