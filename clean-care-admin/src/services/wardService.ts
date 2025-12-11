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
     * Get wards by zone
     */
    async getWardsByZone(
        zoneId: number,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ): Promise<Ward[]> {
        const params = new URLSearchParams();
        if (status && status !== 'ALL') {
            params.append('status', status);
        }

        const response = await this.apiClient.get(
            `/api/admin/wards?zoneId=${zoneId}&${params.toString()}`
        );
        return response.data.wards || response.data;
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
     * Get available ward numbers for a zone
     */
    async getAvailableWardNumbers(zoneId: number, maxWardNumber: number = 100): Promise<number[]> {
        try {
            const response = await this.apiClient.get(
                `/api/admin/wards/available?zoneId=${zoneId}&maxWardNumber=${maxWardNumber}`
            );
            return response.data.availableNumbers || response.data;
        } catch (error) {
            // Fallback: calculate client-side
            const wards = await this.getWardsByZone(zoneId, 'ALL');
            const existingNumbers = wards.map(w => w.wardNumber);
            const available: number[] = [];
            for (let i = 1; i <= maxWardNumber; i++) {
                if (!existingNumbers.includes(i)) {
                    available.push(i);
                }
            }
            return available;
        }
    }
}

export const wardService = new WardService();
