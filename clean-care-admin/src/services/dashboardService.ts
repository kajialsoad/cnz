import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

// Dashboard statistics interfaces
export interface DashboardStats {
    complaints: ComplaintStats;
    messages: MessageStats;
    users: UserStats;
    performance: PerformanceStats;
}

export interface ComplaintStats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    successRate: number;
    averageResolutionTime: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
    byCategory: { category: string; count: number }[];
    byPriority: { priority: number; count: number }[];
}

export interface MessageStats {
    total: number;
    unread: number;
    todayCount: number;
    weekCount: number;
    averageResponseTime: number;
}

export interface UserStats {
    totalCitizens: number;
    totalAdmins: number;
    totalSuperAdmins: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersWeek: number;
    newUsersMonth: number;
}

export interface PerformanceStats {
    averageComplaintResolutionTime: number;
    averageResponseTime: number;
    adminPerformance: {
        adminId: number;
        adminName: string;
        resolvedCount: number;
        averageResolutionTime: number;
    }[];
}

export interface DashboardFilters {
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    startDate?: string;
    endDate?: string;
}

class DashboardService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

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
                    console.error('Error getting auth token:', error);
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
                    // Token expired or invalid
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }
    /**
     * Get dashboard statistics with role-based filtering
     * Automatically applies role-based filtering on the backend
     */
    async getDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
        try {
            const params = new URLSearchParams();

            if (filters?.cityCorporationCode) {
                params.append('cityCorporationCode', filters.cityCorporationCode);
            }

            if (filters?.zoneId) {
                params.append('zoneId', filters.zoneId.toString());
            }

            if (filters?.wardId) {
                params.append('wardId', filters.wardId.toString());
            }

            if (filters?.startDate) {
                params.append('startDate', filters.startDate);
            }

            if (filters?.endDate) {
                params.append('endDate', filters.endDate);
            }

            const queryString = params.toString();
            const url = `/api/dashboard/stats${queryString ? `?${queryString}` : ''}`;

            const response = await this.apiClient.get<{ success: boolean; data: DashboardStats }>(url);

            if (!response.data.success) {
                throw new Error('Failed to fetch dashboard statistics');
            }

            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching dashboard statistics:', error);
            throw new Error(error.response?.data?.error?.message || 'Failed to fetch dashboard statistics');
        }
    }

    /**
     * Refresh dashboard statistics cache
     * Only available for Master Admin
     */
    async refreshStats(): Promise<void> {
        try {
            const response = await this.apiClient.post<{ success: boolean; message: string }>(
                '/api/dashboard/stats/refresh'
            );

            if (!response.data.success) {
                throw new Error('Failed to refresh statistics cache');
            }
        } catch (error: any) {
            console.error('Error refreshing statistics:', error);
            throw new Error(error.response?.data?.error?.message || 'Failed to refresh statistics cache');
        }
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
