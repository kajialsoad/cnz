import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
    AnalyticsData,
    TrendData,
    AnalyticsQuery,
    GetAnalyticsResponse,
    GetTrendsResponse,
} from '../types/analytics-service.types';

class AnalyticsService {
    private apiClient: AxiosInstance;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.cache = new Map();
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

    /**
     * Generate cache key from query parameters
     */
    private getCacheKey(endpoint: string, query?: AnalyticsQuery): string {
        const queryString = query ? JSON.stringify(query) : '';
        return `${endpoint}:${queryString}`;
    }

    /**
     * Get cached data if available and not expired
     */
    private getCachedData<T>(cacheKey: string): T | null {
        const cached = this.cache.get(cacheKey);
        if (cached) {
            const now = Date.now();
            if (now - cached.timestamp < this.CACHE_DURATION) {
                return cached.data as T;
            } else {
                // Cache expired, remove it
                this.cache.delete(cacheKey);
            }
        }
        return null;
    }

    /**
     * Set data in cache
     */
    private setCachedData(cacheKey: string, data: any): void {
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Clear all cached data
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear specific cache entry
     */
    public clearCacheEntry(endpoint: string, query?: AnalyticsQuery): void {
        const cacheKey = this.getCacheKey(endpoint, query);
        this.cache.delete(cacheKey);
    }

    /**
     * Get complaint analytics with caching
     */
    async getAnalytics(query?: AnalyticsQuery): Promise<AnalyticsData> {
        try {
            const cacheKey = this.getCacheKey('analytics', query);

            // Check cache first
            const cachedData = this.getCachedData<AnalyticsData>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetAnalyticsResponse>(
                '/api/admin/analytics',
                {
                    params: query,
                }
            );

            const analyticsData = response.data.data;

            // Cache the result
            this.setCachedData(cacheKey, analyticsData);

            return analyticsData;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch analytics'
                );
            }
            throw error;
        }
    }

    /**
     * Get complaint trends over time with caching
     */
    async getComplaintTrends(query?: AnalyticsQuery): Promise<TrendData[]> {
        try {
            const cacheKey = this.getCacheKey('trends', query);

            // Check cache first
            const cachedData = this.getCachedData<TrendData[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetTrendsResponse>(
                '/api/admin/analytics/trends',
                {
                    params: query,
                }
            );

            const trends = response.data.data.trends;

            // Cache the result
            this.setCachedData(cacheKey, trends);

            return trends;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch complaint trends'
                );
            }
            throw error;
        }
    }

    /**
     * Get analytics for a specific date range
     */
    async getAnalyticsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<AnalyticsData> {
        return this.getAnalytics({
            startDate,
            endDate,
        });
    }

    /**
     * Get analytics for a specific period
     */
    async getAnalyticsByPeriod(
        period: 'day' | 'week' | 'month' | 'year'
    ): Promise<AnalyticsData> {
        return this.getAnalytics({
            period,
        });
    }

    /**
     * Get trends for a specific date range
     */
    async getTrendsByDateRange(
        startDate: string,
        endDate: string
    ): Promise<TrendData[]> {
        return this.getComplaintTrends({
            startDate,
            endDate,
        });
    }

    /**
     * Get trends for a specific period
     */
    async getTrendsByPeriod(
        period: 'day' | 'week' | 'month' | 'year'
    ): Promise<TrendData[]> {
        return this.getComplaintTrends({
            period,
        });
    }
}

export const analyticsService = new AnalyticsService();
