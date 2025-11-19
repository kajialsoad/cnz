import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
    CategoryItem,
    SubcategoryItem,
    GetCategoriesResponse,
    GetCategoryResponse,
    GetSubcategoriesResponse,
    CategoryStatistic,
    GetCategoryStatisticsResponse,
    CategoryStatisticsQuery,
    CategoryTrendDataPoint,
    CategoryMetadata,
    GetCategoryTrendsResponse,
    CategoryTrendsQuery,
} from '../types/category-service.types';

class CategoryService {
    private apiClient: AxiosInstance;
    private cache: Map<string, { data: any; timestamp: number }>;
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (categories rarely change)

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
     * Generate cache key
     */
    private getCacheKey(endpoint: string, params?: any): string {
        const paramsString = params ? JSON.stringify(params) : '';
        return `${endpoint}:${paramsString}`;
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
     * Get all categories with subcategories
     */
    async getAllCategories(): Promise<CategoryItem[]> {
        try {
            const cacheKey = this.getCacheKey('categories');

            // Check cache first
            const cachedData = this.getCachedData<CategoryItem[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetCategoriesResponse>(
                '/api/categories'
            );

            const categories = response.data.data.categories;

            // Cache the result
            this.setCachedData(cacheKey, categories);

            return categories;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch categories'
                );
            }
            throw error;
        }
    }

    /**
     * Get a specific category by ID
     */
    async getCategoryById(categoryId: string): Promise<CategoryItem> {
        try {
            const cacheKey = this.getCacheKey(`category-${categoryId}`);

            // Check cache first
            const cachedData = this.getCachedData<CategoryItem>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetCategoryResponse>(
                `/api/categories/${categoryId}`
            );

            const category = response.data.data.category;

            // Cache the result
            this.setCachedData(cacheKey, category);

            return category;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch category'
                );
            }
            throw error;
        }
    }

    /**
     * Get subcategories for a specific category
     */
    async getSubcategories(categoryId: string): Promise<SubcategoryItem[]> {
        try {
            const cacheKey = this.getCacheKey(`subcategories-${categoryId}`);

            // Check cache first
            const cachedData = this.getCachedData<SubcategoryItem[]>(cacheKey);
            if (cachedData) {
                return cachedData;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetSubcategoriesResponse>(
                `/api/categories/${categoryId}/subcategories`
            );

            const subcategories = response.data.data.subcategories;

            // Cache the result
            this.setCachedData(cacheKey, subcategories);

            return subcategories;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch subcategories'
                );
            }
            throw error;
        }
    }

    /**
     * Get category statistics
     */
    async getCategoryStatistics(
        query?: CategoryStatisticsQuery
    ): Promise<{
        statistics: CategoryStatistic[];
        totalCategories: number;
        totalComplaints: number;
    }> {
        try {
            const cacheKey = this.getCacheKey('category-statistics', query);

            // Check cache first (shorter cache for statistics)
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
                // 5 min cache for stats
                return cached.data;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetCategoryStatisticsResponse>(
                '/api/admin/analytics/categories',
                {
                    params: query,
                }
            );

            const data = response.data.data;

            // Cache the result
            this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message ||
                    'Failed to fetch category statistics'
                );
            }
            throw error;
        }
    }

    /**
     * Get category trends over time
     */
    async getCategoryTrends(
        query?: CategoryTrendsQuery
    ): Promise<{
        trends: CategoryTrendDataPoint[];
        categories: CategoryMetadata[];
    }> {
        try {
            const cacheKey = this.getCacheKey('category-trends', query);

            // Check cache first (shorter cache for trends)
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
                // 5 min cache for trends
                return cached.data;
            }

            // Fetch from API
            const response = await this.apiClient.get<GetCategoryTrendsResponse>(
                '/api/admin/analytics/categories/trends',
                {
                    params: query,
                }
            );

            const data = response.data.data;

            // Cache the result
            this.setCachedData(cacheKey, data);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch category trends'
                );
            }
            throw error;
        }
    }

    /**
     * Get category name by ID (from cached categories)
     */
    async getCategoryName(
        categoryId: string,
        language: 'en' | 'bn' = 'en'
    ): Promise<string> {
        const categories = await this.getAllCategories();
        const category = categories.find((cat) => cat.id === categoryId);
        if (!category) {
            return 'Unknown Category';
        }
        return language === 'bn' ? category.bangla : category.english;
    }

    /**
     * Get subcategory name by ID (from cached categories)
     */
    async getSubcategoryName(
        categoryId: string,
        subcategoryId: string,
        language: 'en' | 'bn' = 'en'
    ): Promise<string> {
        const category = await this.getCategoryById(categoryId);
        const subcategory = category.subcategories.find(
            (sub) => sub.id === subcategoryId
        );
        if (!subcategory) {
            return 'Unknown Subcategory';
        }
        return language === 'bn' ? subcategory.bangla : subcategory.english;
    }

    /**
     * Get category color by ID (from cached categories)
     */
    async getCategoryColor(categoryId: string): Promise<string> {
        const categories = await this.getAllCategories();
        const category = categories.find((cat) => cat.id === categoryId);
        return category?.color || '#808080'; // Default gray if not found
    }

    /**
     * Validate if a category exists
     */
    async categoryExists(categoryId: string): Promise<boolean> {
        try {
            await this.getCategoryById(categoryId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate if a subcategory exists within a category
     */
    async subcategoryExists(
        categoryId: string,
        subcategoryId: string
    ): Promise<boolean> {
        try {
            const subcategories = await this.getSubcategories(categoryId);
            return subcategories.some((sub) => sub.id === subcategoryId);
        } catch {
            return false;
        }
    }
}

export const categoryService = new CategoryService();
