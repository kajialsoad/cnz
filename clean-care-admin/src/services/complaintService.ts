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
     * Parse image and audio URLs from JSON strings
     */
    private parseMediaUrls(complaint: any): Complaint {
        let imageUrls: string[] = [];
        let audioUrls: string[] = [];

        try {
            if (complaint.imageUrl) {
                imageUrls = JSON.parse(complaint.imageUrl);
            }
        } catch (e) {
            console.error('Error parsing imageUrl:', e);
        }

        try {
            if (complaint.audioUrl) {
                audioUrls = JSON.parse(complaint.audioUrl);
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
                ...filters,
            };

            const response = await this.apiClient.get<{
                success: boolean;
                data: GetComplaintsResponse;
            }>('/api/admin/complaints', { params });

            // Parse media URLs for each complaint
            const complaints = response.data.data.complaints.map((complaint) =>
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
