import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
    GetUsersQuery,
    GetUsersResponse,
    GetUserResponse,
    UserStatisticsResponse,
    CreateUserDto,
    UpdateUserDto,
    UpdateStatusDto,
    CreateUserResponse,
    UpdateUserResponse,
    UpdateStatusResponse,
} from '../types/userManagement.types';

class UserManagementService {
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

        // Add auth token from localStorage
        this.setupInterceptors();
    }

    private setupInterceptors() {
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

    // Get all users with pagination and filters
    async getUsers(query?: GetUsersQuery): Promise<GetUsersResponse> {
        try {
            console.log('🔍 Fetching users with query:', query);

            const response = await this.apiClient.get('/api/admin/users', {
                params: query,
            });

            console.log('✅ Full response:', response);
            console.log('✅ Response data:', response.data);
            console.log('✅ Response data type:', typeof response.data);
            console.log('✅ Response data keys:', Object.keys(response.data || {}));

            // Handle different response structures
            if (response.data?.success && response.data?.data) {
                // Backend returns { success: true, data: { users: [...], pagination: {...} } }
                console.log('✅ Using response.data.data structure');
                return response.data.data;
            } else if (response.data?.users && response.data?.pagination) {
                // Backend returns { users: [...], pagination: {...} } directly
                console.log('✅ Using direct structure');
                return response.data;
            } else {
                console.error('❌ Unexpected response structure:', response.data);
                throw new Error('Unexpected response structure from server');
            }
        } catch (error) {
            console.error('❌ Error fetching users:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response data:', error.response?.data);
                console.error('Response status:', error.response?.status);
                console.error('Request URL:', error.config?.url);
                console.error('Request params:', error.config?.params);
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch users'
                );
            }
            throw error;
        }
    }

    // Get single user by ID
    async getUserById(userId: number): Promise<GetUserResponse> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: GetUserResponse;
            }>(`/api/admin/users/${userId}?t=${Date.now()}`);

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch user details'
                );
            }
            throw error;
        }
    }

    // Get user statistics
    async getUserStatistics(cityCorporationCode?: string, role?: string, zoneId?: number, wardId?: number): Promise<UserStatisticsResponse> {
        try {
            const params: any = {};
            if (cityCorporationCode) {
                params.cityCorporationCode = cityCorporationCode;
            }
            if (role) {
                params.role = role;
            }
            if (zoneId) {
                params.zoneId = zoneId;
            }
            if (wardId) {
                params.wardId = wardId;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: UserStatisticsResponse;
            }>('/api/admin/users/statistics', {
                params: Object.keys(params).length > 0 ? params : undefined,
            });

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch statistics'
                );
            }
            throw error;
        }
    }

    // Create new user
    async createUser(data: CreateUserDto): Promise<CreateUserResponse> {
        try {
            console.log('🔵 UserManagementService.createUser - Sending data:', { ...data, password: '***' });
            const response = await this.apiClient.post<CreateUserResponse>(
                '/api/admin/users',
                data
            );

            console.log('✅ UserManagementService.createUser - Success:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ UserManagementService.createUser - Error:', error);
            if (axios.isAxiosError(error)) {
                console.error('❌ Axios error response:', error.response);
                console.error('❌ Axios error data:', error.response?.data);

                // Extract validation errors if present
                const errorData = error.response?.data;
                if (errorData?.errors && Array.isArray(errorData.errors)) {
                    const validationMessages = errorData.errors
                        .map((err: any) => `${err.field || 'Field'}: ${err.message}`)
                        .join(', ');
                    throw new Error(validationMessages || errorData.message || 'Validation failed');
                }

                throw new Error(
                    errorData?.message || 'Failed to create user'
                );
            }
            throw error;
        }
    }

    // Update user
    async updateUser(
        userId: number,
        data: UpdateUserDto
    ): Promise<UpdateUserResponse> {
        try {
            const response = await this.apiClient.put<UpdateUserResponse>(
                `/api/admin/users/${userId}`,
                data
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to update user'
                );
            }
            throw error;
        }
    }

    // Update user status
    async updateUserStatus(
        userId: number,
        data: UpdateStatusDto
    ): Promise<UpdateStatusResponse> {
        try {
            const response = await this.apiClient.patch<UpdateStatusResponse>(
                `/api/admin/users/${userId}/status`,
                data
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to update user status'
                );
            }
            throw error;
        }
    }

    // Upload avatar
    async uploadAvatar(file: File): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await this.apiClient.post<{
                success: boolean;
                data: { url: string };
            }>('/api/uploads/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data.data.url;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to upload avatar'
                );
            }
            throw error;
        }
    }

    // Bulk delete users
    async bulkDeleteUsers(userIds: number[]): Promise<void> {
        try {
            await this.apiClient.post('/api/admin/users/bulk-delete', { userIds });
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to bulk delete users'
                );
            }
            throw error;
        }
    }

    // Get user reactions for waste management posts
    async getUserReactions(userId: number): Promise<any[]> {
        try {
            const response = await this.apiClient.get(`/api/waste-management/admin/users/${userId}/reactions`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch user reactions'
                );
            }
            throw error;
        }
    }

    // Get user notice interactions
    async getUserNoticeInteractions(userId: number): Promise<any[]> {
        try {
            const response = await this.apiClient.get(`/api/notices/admin/users/${userId}/interactions`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch user notice interactions'
                );
            }
            throw error;
        }
    }
}

export const userManagementService = new UserManagementService();
