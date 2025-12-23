import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Review Service
 * Handles all review-related API calls
 */

// ==================== Types ====================

export interface Review {
    id: number;
    complaintId: number;
    userId: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        avatar: string | null;
    };
}

export interface ReviewSubmission {
    rating: number;
    comment?: string;
}

export interface ReviewAnalytics {
    averageRating: number;
    totalReviews: number;
    reviewPercentage: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    recentReviews: Array<{
        id: number;
        rating: number;
        comment: string | null;
        createdAt: string;
        complaint: {
            id: number;
            title: string;
        };
        user: {
            firstName: string;
            lastName: string;
        };
    }>;
}

export interface ReviewAnalyticsFilters {
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    startDate?: string;
    endDate?: string;
}

export interface ApiError {
    name: string;
    statusCode: number;
    message: string;
    errors?: any[];
}

// ==================== Service Class ====================

class ReviewService {
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
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Handle API errors and convert to ApiError
     */
    private handleError(error: any): ApiError {
        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status || 500;
            const message = error.response?.data?.message || 'An error occurred';
            const errors = error.response?.data?.errors;

            return {
                name: 'ApiError',
                statusCode,
                message,
                errors,
            } as ApiError;
        }

        return {
            name: 'ApiError',
            statusCode: 500,
            message: error.message || 'An unexpected error occurred',
        } as ApiError;
    }

    /**
     * Submit a review for a complaint
     * @param complaintId - ID of the complaint to review
     * @param review - Review data (rating and optional comment)
     * @returns Created review
     */
    async submitReview(
        complaintId: number,
        review: ReviewSubmission
    ): Promise<Review> {
        try {
            const response = await this.apiClient.post<{
                success: boolean;
                data: Review;
            }>(`/api/complaints/${complaintId}/review`, review);

            return response.data.data;
        } catch (error) {
            console.error('Error submitting review:', error);
            throw error;
        }
    }

    /**
     * Get all reviews for a specific complaint
     * @param complaintId - ID of the complaint
     * @returns Array of reviews
     */
    async getComplaintReviews(complaintId: number): Promise<Review[]> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: Review[];
            }>(`/api/complaints/${complaintId}/reviews`);

            return response.data.data;
        } catch (error) {
            console.error('Error fetching complaint reviews:', error);
            throw error;
        }
    }

    /**
     * Get review analytics (Admin only)
     * @param filters - Optional filters (city corporation, zone, ward, date range)
     * @returns Review analytics data
     */
    async getReviewAnalytics(
        filters: ReviewAnalyticsFilters = {}
    ): Promise<ReviewAnalytics> {
        try {
            const params: any = {};

            // Add filters to params if provided
            if (filters.cityCorporationCode) {
                params.cityCorporationCode = filters.cityCorporationCode;
            }
            if (filters.zoneId !== undefined) {
                params.zoneId = filters.zoneId;
            }
            if (filters.wardId !== undefined) {
                params.wardId = filters.wardId;
            }
            if (filters.startDate) {
                params.startDate = filters.startDate;
            }
            if (filters.endDate) {
                params.endDate = filters.endDate;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: ReviewAnalytics;
            }>('/api/admin/complaints/analytics/reviews', { params });

            return response.data.data;
        } catch (error) {
            console.error('Error fetching review analytics:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const reviewService = new ReviewService();
