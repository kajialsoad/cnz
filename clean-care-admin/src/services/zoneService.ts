import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

export interface Zone {
    id: number;
    zoneNumber: number;
    name?: string;
    cityCorporationId: number;
    cityCorporation?: {
        id: number;
        code: string;
        name: string;
    };
    officerName?: string;
    officerDesignation?: string;
    officerSerialNumber?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    _count?: {
        wards: number;
        users: number;
    };
    totalWards?: number;
    totalUsers?: number;
    totalComplaints?: number;
}

export interface CreateZoneDto {
    zoneNumber: number;
    name?: string;
    cityCorporationId: number;
    officerName?: string;
    officerDesignation?: string;
    officerSerialNumber?: string;
}

export interface UpdateZoneDto {
    name?: string;
    officerName?: string;
    officerDesignation?: string;
    officerSerialNumber?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface ZoneStats {
    totalWards: number;
    totalUsers: number;
    totalComplaints: number;
}

class ZoneService {
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
     * Get zones by city corporation
     */
    async getZonesByCityCorporation(
        cityCorporationId: number,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ): Promise<Zone[]> {
        const params = new URLSearchParams();
        if (status && status !== 'ALL') {
            params.append('status', status);
        }

        const response = await this.apiClient.get(
            `/api/admin/zones?cityCorporationId=${cityCorporationId}&${params.toString()}`
        );
        // API returns { success: true, data: zones }
        return Array.isArray(response.data.data) ? response.data.data : [];
    }

    /**
     * Get single zone by ID
     */
    async getZoneById(id: number): Promise<Zone> {
        const response = await this.apiClient.get(`/api/admin/zones/${id}`);
        // API returns { success: true, data: zone }
        return response.data.data || response.data;
    }

    /**
     * Create new zone
     */
    async createZone(data: CreateZoneDto): Promise<Zone> {
        const response = await this.apiClient.post('/api/admin/zones', data);
        // API returns { success: true, data: zone }
        return response.data.data || response.data;
    }

    /**
     * Update zone
     */
    async updateZone(id: number, data: UpdateZoneDto): Promise<Zone> {
        const response = await this.apiClient.put(`/api/admin/zones/${id}`, data);
        // API returns { success: true, data: zone }
        return response.data.data || response.data;
    }

    /**
     * Delete zone
     */
    async deleteZone(id: number): Promise<void> {
        await this.apiClient.delete(`/api/admin/zones/${id}`);
    }

    /**
     * Get zone statistics
     */
    async getZoneStats(id: number): Promise<ZoneStats> {
        const response = await this.apiClient.get(`/api/admin/zones/${id}/statistics`);
        return response.data;
    }

    /**
     * Validate zone number
     */
    async validateZoneNumber(cityCorporationId: number, zoneNumber: number): Promise<boolean> {
        try {
            const response = await this.apiClient.get(
                `/api/admin/zones/validate?cityCorporationId=${cityCorporationId}&zoneNumber=${zoneNumber}`
            );
            return response.data.valid;
        } catch (error) {
            return false;
        }
    }
}

export const zoneService = new ZoneService();
