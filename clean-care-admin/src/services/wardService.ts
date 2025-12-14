import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface Ward {
    id: number;
    wardNumber: number;
    zoneId: number;
    zone?: {
        id: number;
        zoneNumber: number;
        name: string;
        cityCorporation: {
            id: number;
            code: string;
            name: string;
        };
    };
    inspectorName?: string;
    inspectorSerialNumber?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    _count?: {
        users: number;
    };
    totalUsers?: number;
    totalComplaints?: number;
    totalImages?: number;
}

export interface CreateWardDto {
    wardNumber: number;
    zoneId: number;
    inspectorName?: string;
    inspectorSerialNumber?: string;
}

export interface UpdateWardDto {
    inspectorName?: string;
    inspectorSerialNumber?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface WardStats {
    totalUsers: number;
    totalComplaints: number;
    totalImages: number;
}

class WardService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
        });

        // Add request interceptor to include auth token
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    /**
     * Get wards with flexible query parameters
     */
    async getWards(params?: {
        zoneId?: number;
        cityCorporationCode?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    }): Promise<{ wards: Ward[] }> {
        try {
            if (!params?.zoneId) {
                console.warn('⚠️ No zoneId provided');
                return { wards: [] };
            }

            const queryParams = new URLSearchParams();
            queryParams.append('zoneId', params.zoneId.toString());

            if (params?.status && params.status !== 'ALL') {
                queryParams.append('status', params.status);
            }

            const response = await this.apiClient.get(
                `/api/admin/wards?${queryParams.toString()}`
            );

            console.log('🔍 Wards API Response:', response.data);

            // Backend returns { success: true, data: [...] }
            const wards = response.data.data || response.data.wards || [];

            if (!Array.isArray(wards)) {
                console.error('❌ wards is not an array:', wards);
                return { wards: [] };
            }

            return { wards };
        } catch (error) {
            console.error('❌ Error fetching wards:', error);
            return { wards: [] };
        }
    }

    /**
     * Get wards by zone
     */
    async getWardsByZone(
        zoneId: number,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ): Promise<Ward[]> {
        const result = await this.getWards({ zoneId, status });
        return result.wards;
    }

    /**
     * Get single ward by ID
     */
    async getWardById(id: number): Promise<Ward> {
        const response = await this.apiClient.get(`/api/admin/wards/${id}`);
        return response.data.ward || response.data;
    }

    /**
     * Create new ward
     */
    async createWard(data: CreateWardDto): Promise<Ward> {
        const response = await this.apiClient.post('/api/admin/wards', data);
        return response.data.ward || response.data;
    }

    /**
     * Bulk create wards
     */
    async createWardsBulk(zoneId: number, wardNumbers: number[]): Promise<Ward[]> {
        const response = await this.apiClient.post('/api/admin/wards/bulk', {
            zoneId,
            wardNumbers,
        });
        return response.data.wards || response.data;
    }

    /**
     * Update ward
     */
    async updateWard(id: number, data: UpdateWardDto): Promise<Ward> {
        const response = await this.apiClient.put(`/api/admin/wards/${id}`, data);
        return response.data.ward || response.data;
    }

    /**
     * Delete ward
     */
    async deleteWard(id: number): Promise<void> {
        await this.apiClient.delete(`/api/admin/wards/${id}`);
    }

    /**
     * Get ward statistics
     */
    async getWardStats(id: number): Promise<WardStats> {
        const response = await this.apiClient.get(`/api/admin/wards/${id}/statistics`);
        return response.data;
    }

    /**
     * Get available ward numbers for a zone (city corporation level)
     * Backend now gets ward limits from city corporation automatically
     */
    async getAvailableWardNumbers(zoneId: number): Promise<number[]> {
        try {
            // Backend gets ward range from city corporation automatically
            const response = await this.apiClient.get(
                `/api/admin/wards/available/${zoneId}`
            );

            console.log('🔍 Available wards API response:', response.data);

            // Backend returns { success: true, data: [...] }
            const availableNumbers = response.data.data || response.data.availableNumbers || response.data;

            if (!Array.isArray(availableNumbers)) {
                console.error('❌ Available numbers is not an array:', availableNumbers);
                return [];
            }

            return availableNumbers;
        } catch (error: any) {
            console.error('❌ Error fetching available ward numbers:', error);
            console.error('Error response:', error.response?.data);
            throw error;
        }
    }
}

export const wardService = new WardService();
