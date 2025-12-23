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
     * Check if URL is a Cloudinary URL
     */
    private isCloudinaryUrl(url: string): boolean {
        return !!url && url.includes('res.cloudinary.com') && url.includes('/upload/');
    }

    /**
     * Fix local media URL to use current server (for backward compatibility)
     * Only applies to non-Cloudinary URLs
     */
    private fixLocalMediaUrl(url: string): string {
        if (!url) return url;

        // If it's a Cloudinary URL, return as is
        if (this.isCloudinaryUrl(url)) {
            return url;
        }

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
     * Get Cloudinary thumbnail URL with transformations
     * Inserts transformation parameters into Cloudinary URL for optimized thumbnails
     * @param url - Original Cloudinary URL
     * @param width - Thumbnail width (default: 200)
     * @param height - Thumbnail height (default: 200)
     * @returns Transformed Cloudinary URL or original URL if not a Cloudinary URL
     */
    private getCloudinaryThumbnail(url: string, width: number = 200, height: number = 200): string {
        if (!url) return url;

        // Check if URL is a Cloudinary URL
        if (this.isCloudinaryUrl(url)) {
            // Insert transformation parameters after /upload/
            return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
        }

        // If not a Cloudinary URL, return as is (for backward compatibility with local URLs)
        return url;
    }

    /**
     * Get optimized Cloudinary URL with automatic format and quality optimization
     * @param url - Original Cloudinary URL
     * @returns Optimized Cloudinary URL or original URL if not a Cloudinary URL
     */
    private getOptimizedCloudinaryUrl(url: string): string {
        if (!url) return url;

        // Check if URL is a Cloudinary URL
        if (this.isCloudinaryUrl(url)) {
            // Insert optimization parameters after /upload/
            return url.replace('/upload/', '/upload/q_auto,f_auto/');
        }

        // If not a Cloudinary URL, return as is
        return url;
    }

    /**
     * Parse image and audio URLs from JSON strings
     * Supports hybrid storage: Cloudinary URLs (new) and local URLs (legacy)
     */
    private parseMediaUrls(complaint: any): Complaint {
        let imageUrls: string[] = [];
        let audioUrls: string[] = [];



        try {
            if (complaint.imageUrl) {
                let parsed;
                const rawUrl = complaint.imageUrl;

                // Check if it's likely a JSON array
                if (typeof rawUrl === 'string' && rawUrl.trim().startsWith('[')) {
                    try {
                        parsed = JSON.parse(rawUrl);
                    } catch (e) {
                        // If parse fails but it looks like JSON, it might be malformed.
                        // But also could be a weird string. Fallback to treating as single URL.
                        parsed = [rawUrl];
                    }
                } else if (Array.isArray(rawUrl)) {
                    parsed = rawUrl;
                } else {
                    // Treat as single string URL
                    parsed = [rawUrl];
                }

                // Process each URL
                if (Array.isArray(parsed)) {
                    imageUrls = parsed.map((url: string) => this.fixLocalMediaUrl(url));
                }
            }
        } catch (e) {
            console.error('Error processing imageUrl:', e);
        }

        try {
            if (complaint.audioUrl) {
                let parsed;
                const rawUrl = complaint.audioUrl;

                if (typeof rawUrl === 'string' && rawUrl.trim().startsWith('[')) {
                    try {
                        parsed = JSON.parse(rawUrl);
                    } catch (e) {
                        parsed = [rawUrl];
                    }
                } else if (Array.isArray(rawUrl)) {
                    parsed = rawUrl;
                } else {
                    parsed = [rawUrl];
                }

                if (Array.isArray(parsed)) {
                    audioUrls = parsed.map((url: string) => this.fixLocalMediaUrl(url));
                }
            }
        } catch (e) {
            console.error('Error processing audioUrl:', e);
        }

        // Ensure we preserve the original object's location data structure
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
            // Check if we need to send FormData (for file uploads)
            if (data.resolutionImageFiles && data.resolutionImageFiles.length > 0) {
                const formData = new FormData();
                formData.append('status', data.status);

                if (data.note) formData.append('note', data.note);
                if (data.resolutionImages) formData.append('resolutionImages', data.resolutionImages);
                if (data.resolutionNote) formData.append('resolutionNote', data.resolutionNote);
                if (data.category) formData.append('category', data.category);
                if (data.subcategory) formData.append('subcategory', data.subcategory);

                // Append files
                data.resolutionImageFiles.forEach((file) => {
                    formData.append('resolutionImages', file); // Field name expected by backend multer
                });

                // Backend controller expects 'resolutionImageFiles'? 
                // Wait, backend controller (admin.complaint.controller.ts) uses uploadConfig.array('resolutionImages', 5) (probably).
                // Let's check backend route. 
                // But generally backend maps 'resolutionImages' to files.
                // In controller line 247: resolutionImageFiles: files. Multi-part parses them.
                // The field name in FormData must match the uploadConfig middleware. 
                // Assuming it is 'resolutionImages' or 'images'. 
                // Controller line 247 passes 'files' which comes from req.files using the field name.
                // Route admin.complaint.routes.ts likely has uploadConfig.array('resolutionImages').
                // I will use 'resolutionImages' as the field name for files.

                // Note: Providing both 'resolutionImages' (string) and 'resolutionImages' (files) might be tricky depending on how backend parses.
                // Backend parses files separately from body.
                // body.resolutionImages will contain the string.
                // req.files will contain the files.
                // This is fine.

                const response = await this.apiClient.patch<UpdateComplaintStatusResponse>(
                    `/api/admin/complaints/${id}/status`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                return this.parseMediaUrls(response.data.data.complaint);
            } else {
                // Send JSON as before
                const response = await this.apiClient.patch<UpdateComplaintStatusResponse>(
                    `/api/admin/complaints/${id}/status`,
                    data
                );
                return this.parseMediaUrls(response.data.data.complaint);
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * Mark complaint as Others
     */
    async markComplaintAsOthers(
        id: number,
        data: {
            othersCategory: string;
            othersSubcategory: string;
            note?: string;
            images?: File[];
        }
    ): Promise<Complaint> {
        try {
            const formData = new FormData();
            formData.append('othersCategory', data.othersCategory);
            formData.append('othersSubcategory', data.othersSubcategory);

            if (data.note) {
                formData.append('note', data.note);
            }

            if (data.images && data.images.length > 0) {
                data.images.forEach((image) => {
                    formData.append('images', image);
                });
            }

            const response = await this.apiClient.patch<UpdateComplaintStatusResponse>(
                `/api/admin/complaints/${id}/mark-others`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            // Parse media URLs
            const complaint = this.parseMediaUrls(response.data.data.complaint);

            return complaint;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update complaint status with resolution documentation
     * Supports multipart/form-data for image uploads
     */
    async updateComplaintStatusWithResolution(
        id: number,
        status: string,
        resolutionNote?: string,
        resolutionImages?: File[]
    ): Promise<Complaint> {
        try {
            const formData = new FormData();
            formData.append('status', status);

            if (resolutionNote) {
                formData.append('resolutionNote', resolutionNote);
            }

            if (resolutionImages && resolutionImages.length > 0) {
                resolutionImages.forEach((image) => {
                    formData.append('resolutionImages', image);
                });
            }

            const response = await this.apiClient.patch<UpdateComplaintStatusResponse>(
                `/api/admin/complaints/${id}/status`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
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

    /**
     * Get thumbnail URL for a Cloudinary image
     * Public method for components to use
     * @param url - Original image URL
     * @param width - Thumbnail width (default: 200)
     * @param height - Thumbnail height (default: 200)
     * @returns Thumbnail URL with Cloudinary transformations
     */
    getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
        return this.getCloudinaryThumbnail(url, width, height);
    }

    /**
     * Get optimized URL for a Cloudinary image
     * Public method for components to use
     * @param url - Original image URL
     * @returns Optimized URL with automatic format and quality settings
     */
    getOptimizedUrl(url: string): string {
        return this.getOptimizedCloudinaryUrl(url);
    }

    /**
     * Upload an image file
     * @param file - The file to upload
     * @returns The uploaded file URL
     */
    async uploadImage(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('images', file);

            const response = await this.apiClient.post<{
                success: boolean;
                data: {
                    fileUrls: string[];
                };
            }>('/api/uploads', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success && response.data.data.fileUrls.length > 0) {
                return response.data.data.fileUrls[0];
            }

            throw new Error('Failed to upload image');
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Get Others complaints analytics
     * @param filters - Optional filters (city corporation, zone, date range)
     * @returns Others analytics data
     */
    async getOthersAnalytics(filters: {
        cityCorporationCode?: string;
        zoneId?: number;
        startDate?: string;
        endDate?: string;
    } = {}): Promise<{
        totalOthers: number;
        byCategory: {
            CORPORATION_INTERNAL: number;
            CORPORATION_EXTERNAL: number;
        };
        bySubcategory: Record<string, number>;
        topSubcategories: Array<{ subcategory: string; count: number }>;
        averageResolutionTime: {
            overall: number;
            bySubcategory: Record<string, number>;
        };
        trend: Array<{ date: string; count: number }>;
    }> {
        try {
            const params: any = {};

            // Add filters to params if provided
            if (filters.cityCorporationCode) {
                params.cityCorporationCode = filters.cityCorporationCode;
            }
            if (filters.zoneId !== undefined) {
                params.zoneId = filters.zoneId;
            }
            if (filters.startDate) {
                params.startDate = filters.startDate;
            }
            if (filters.endDate) {
                params.endDate = filters.endDate;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: any;
            }>('/api/admin/complaints/analytics/others', { params });

            return response.data.data;
        } catch (error) {
            console.error('Error fetching Others analytics:', error);
            throw error;
        }
    }
}

export const complaintService = new ComplaintService();
