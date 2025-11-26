import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
    Complaint,
    ComplaintDetails,
    ComplaintFilters,
    GetComplaintsResponse,
    GetComplaintByIdResponse,
    UpdateComplaintStatusRequest,
    UpdateComplaintStatusResponse,
    ApiError,
} from '../types/complaint-service.types';

class ComplaintService {
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
     * Fix image/audio URL to use current server
     * Replaces localhost:4000 or any other hardcoded URL with current API base URL
     */
    private fixMediaUrl(url: string): string {
        if (!url) return url;

        // If URL is already using current server, return as is
        if (url.startsWith(API_CONFIG.BASE_URL)) {
            return url;
        }

        // If URL contains localhost:4000 or any other server, replace it
        const urlPattern = /^https?:\/\/[^\/]+/;
        if (urlPattern.test(url)) {
            return url.replace(urlPattern, API_CONFIG.BASE_URL);
        }

        // If URL is relative (starts with /), prepend base URL
        if (url.startsWith('/')) {
            return `${API_CONFIG.BASE_URL}${url}`;
        }

        // Otherwise, prepend base URL with /
        return `${API_CONFIG.BASE_URL}/${url}`;
    }

    /**
     * Parse image and audio URLs from JSON strings
     */
    private parseMediaUrls(complaint: any): Complaint {
        let imageUrls: string[] = [];
        let audioUrls: string[] = [];

        try {
            if (complaint.imageUrl) {
                const parsed = JSON.parse(complaint.imageUrl);
                imageUrls = parsed.map((url: string) => this.fixMediaUrl(url));
            }
        } catch (e) {
            console.error('Error parsing imageUrl:', e);
        }

        try {
            if (complaint.audioUrl) {
                const parsed = JSON.parse(complaint.audioUrl);
                audioUrls = parsed.map((url: string) => this.fixMediaUrl(url));
            }
        } catch (e) {
            console.error('Error parsing audioUrl:', e);
        }

        return {
            ...complaint,
            imageUrls,
            audioUrls,
        };
    }

    /**
     * Get all complaints with pagination and filters
     * Supports filtering by category, subcategory, status, ward, date range, and search
     */
    async getComplaints(
        page: number = 1,
        limit: number = 20,
        filters?: ComplaintFilters
    ): Promise<GetComplaintsResponse> {
        try {
            const params: any = {
                page,
                limit,
            };

            // Add filters to params if provided
            if (filters) {
                if (filters.search) params.search = filters.search;
                if (filters.status && filters.status !== 'ALL') params.status = filters.status;

                // Handle "uncategorized" filter - send special value to backend
                if (filters.category === 'uncategorized') {
                    params.category = 'null'; // Backend will interpret this as NULL category filter
                } else if (filters.category) {
                    params.category = filters.category;
                }

                if (filters.subcategory) params.subcategory = filters.subcategory;
                if (filters.cityCorporationCode) params.cityCorporationCode = filters.cityCorporationCode;
                if (filters.ward) params.ward = filters.ward;
                if (filters.thanaId) params.thanaId = filters.thanaId;
                if (filters.startDate) params.startDate = filters.startDate;
                if (filters.endDate) params.endDate = filters.endDate;
                if (filters.sortBy) params.sortBy = filters.sortBy;
                if (filters.sortOrder) params.sortOrder = filters.sortOrder;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: GetComplaintsResponse;
            }>('/api/admin/complaints', { params });

            // Validate response structure
            if (!response.data || !response.data.data) {
                console.error('Invalid response structure:', response.data);
                throw new Error('Invalid response structure from server');
            }

            const responseData = response.data.data;

            // Ensure complaints is an array
            if (!Array.isArray(responseData.complaints)) {
                console.error('Complaints is not an array:', responseData);
                throw new Error('Invalid complaints data from server');
            }

            // Parse media URLs for each complaint
            const complaints = responseData.complaints.map((complaint) =>
                this.parseMediaUrls(complaint)
            );

            return {
                ...responseData,
                complaints,
            };
        } catch (error) {
            console.error('Error in getComplaints:', error);
            throw error;
        }
    }

    /**
     * Get single complaint by ID
     */
    async getComplaintById(id: number): Promise<ComplaintDetails> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: GetComplaintByIdResponse;
            }>(`/api/admin/complaints/${id}`);

            // Parse media URLs
            const complaint = this.parseMediaUrls(
                response.data.data.complaint
            ) as ComplaintDetails;

            return complaint;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update complaint status
     */
    async updateComplaintStatus(
        id: number,
        data: UpdateComplaintStatusRequest
    ): Promise<Complaint> {
        try {
            const response = await this.apiClient.patch<UpdateComplaintStatusResponse>(
                `/api/admin/complaints/${id}/status`,
                data
            );

            // Parse media URLs
            const complaint = this.parseMediaUrls(response.data.data.complaint);

            return complaint;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Search complaints by search term
     * This is a convenience method that uses getComplaints with search filter
     */
    async searchComplaints(
        searchTerm: string,
        page: number = 1,
        limit: number = 20
    ): Promise<GetComplaintsResponse> {
        try {
            return await this.getComplaints(page, limit, {
                search: searchTerm,
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get complaints by user ID
     */
    async getComplaintsByUser(
        userId: number,
        page: number = 1,
        limit: number = 20
    ): Promise<{
        user: any;
        complaints: Complaint[];
        statistics: {
            total: number;
            resolved: number;
            unresolved: number;
            pending: number;
            inProgress: number;
        };
    }> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: any;
            }>(`/api/admin/users/${userId}/complaints`, {
                params: { page, limit },
            });

            // Parse media URLs for each complaint
            const complaints = response.data.data.complaints.map((complaint: any) =>
                this.parseMediaUrls(complaint)
            );

            return {
                ...response.data.data,
                complaints,
            };
        } catch (error) {
            throw error;
        }
    }
}

export const complaintService = new ComplaintService();
