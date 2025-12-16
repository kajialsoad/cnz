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
    officerPhone?: string;
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
    officerPhone?: string;
}

export interface UpdateZoneDto {
    name?: string;
    officerName?: string;
    officerDesignation?: string;
    officerSerialNumber?: string;
    officerPhone?: string;
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
     * Get zones with flexible query parameters
     */
    async getZones(params?: {
        cityCorporationCode?: string;
        cityCorporationId?: number;
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    }): Promise<{ zones: Zone[] }> {
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.log('⚠️ No auth token found, skipping zone fetch');
                return { zones: [] };
            }

            const queryParams = new URLSearchParams();

            // Add cityCorporationCode if provided
            if (params?.cityCorporationCode) {
                queryParams.append('cityCorporationCode', params.cityCorporationCode);
            }

            // Add cityCorporationId if provided
            if (params?.cityCorporationId) {
                queryParams.append('cityCorporationId', params.cityCorporationId.toString());
            }

            // Add status if provided
            if (params?.status && params.status !== 'ALL') {
                queryParams.append('status', params.status);
            }

            const queryString = queryParams.toString();

            // If no parameters provided, return empty array (backend requires cityCorporationId or cityCorporationCode)
            if (!queryString) {
                console.log('⚠️ No city corporation specified, returning empty zones');
                return { zones: [] };
            }

            const url = `/api/admin/zones?${queryString}`;

            const response = await this.apiClient.get(url);

            console.log('🔍 Zones API Response:', response.data);

            // Backend returns { success: true, data: [...] }
            const zones = response.data.data || response.data.zones || [];

            if (!Array.isArray(zones)) {
                console.error('❌ zones is not an array:', zones);
                return { zones: [] };
            }

            return { zones };
        } catch (error: any) {
            console.error('❌ Error fetching zones:', error);
            if (error.response?.status === 401) {
                console.log('⚠️ Unauthorized - user needs to login');
            }
            return { zones: [] };
        }
    }

    /**
     * Get zones by city corporation
     */
    async getZonesByCityCorporation(
        cityCorporationId: number,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ): Promise<Zone[]> {
        const result = await this.getZones({ cityCorporationId, status });
        return result.zones;
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

    /**
     * Get available zone numbers for a city corporation
     * Returns only zone numbers that are not yet used
     */
    async getAvailableZoneNumbers(cityCorporationId: number): Promise<number[]> {
        try {
            console.log('🔍 Fetching available zones for city corporation:', cityCorporationId);

            const response = await this.apiClient.get(
                `/api/admin/zones/available/${cityCorporationId}`
            );

            console.log('✅ Available zones response:', response.data);

            // Backend returns { success: true, data: [1, 2, 3, ...] }
            const availableNumbers = response.data.data || [];

            if (!Array.isArray(availableNumbers)) {
                console.error('❌ Available numbers is not an array:', availableNumbers);
                return [];
            }

            return availableNumbers;
        } catch (error: any) {
            console.error('❌ Error fetching available zone numbers:', error);
            console.error('Error details:', error.response?.data);
            return [];
        }
    }
}

export const zoneService = new ZoneService();
