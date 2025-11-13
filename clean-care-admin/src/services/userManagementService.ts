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
            const response = await this.apiClient.get<{
                success: boolean;
                data: GetUsersResponse;
            }>('/admin/users', {
                params: query,
            });

            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
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
            }>(`/admin/users/${userId}`);

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
    async getUserStatistics(): Promise<UserStatisticsResponse> {
        try {
            const response = await this.apiClient.get<{
                success: boolean;
                data: UserStatisticsResponse;
            }>('/admin/users/statistics');

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
            const response = await this.apiClient.post<CreateUserResponse>(
                '/admin/users',
                data
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to create user'
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
                `/admin/users/${userId}`,
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
                `/admin/users/${userId}/status`,
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
}

export const userManagementService = new UserManagementService();
