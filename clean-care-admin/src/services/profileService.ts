/**
 * Profile Service
 * Handles all profile-related API calls with comprehensive error handling
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { UserProfile, ProfileUpdateData, ProfileUpdateResponse, AvatarUploadResponse } from '../types/profile.types';
import {
    handleProfileFetchError,
    handleProfileUpdateError,
    handleAvatarUploadError,
    retryWithBackoff,
} from '../utils/profileErrorHandler';
import { validateProfileUpdate, validateFile } from '../utils/profileValidation';

class ProfileService {
    private apiClient: AxiosInstance;
    private readonly MAX_RETRIES = 3;
    private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: this.REQUEST_TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add authorization header from localStorage
        this.apiClient.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                // Silently ignore 404 and 401 errors (expected when not logged in)
                const status = error.response?.status;
                if (status !== 404 && status !== 401) {
                    // Log error for debugging
                    console.error('API Error:', {
                        url: error.config?.url,
                        method: error.config?.method,
                        status: error.response?.status,
                        message: error.message,
                    });
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get current user profile with retry logic
     */
    async getProfile(): Promise<UserProfile> {
        try {
            return await retryWithBackoff(
                async () => {
                    const response = await this.apiClient.get<{ success: boolean; data: UserProfile }>(
                        API_CONFIG.ENDPOINTS.AUTH.PROFILE
                    );

                    if (!response.data.success) {
                        throw new Error('Failed to fetch profile');
                    }

                    return response.data.data;
                },
                this.MAX_RETRIES,
                (attempt, error) => {
                    console.log(`Retrying profile fetch (attempt ${attempt}):`, error.message);
                }
            );
        } catch (error) {
            const profileError = handleProfileFetchError(error);
            throw new Error(profileError.message);
        }
    }

    /**
     * Update user profile with validation
     */
    async updateProfile(data: ProfileUpdateData): Promise<UserProfile> {
        try {
            // Validate data before sending
            const validation = validateProfileUpdate(data);
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(errorMessages);
            }

            // Sanitize data
            const sanitizedData: ProfileUpdateData = {};
            if (data.firstName) sanitizedData.firstName = data.firstName.trim();
            if (data.lastName) sanitizedData.lastName = data.lastName.trim();
            if (data.avatar) sanitizedData.avatar = data.avatar.trim();
            if (data.ward) sanitizedData.ward = data.ward.trim();
            if (data.zone) sanitizedData.zone = data.zone.trim();
            if (data.address) sanitizedData.address = data.address.trim();

            const response = await this.apiClient.patch<ProfileUpdateResponse>(
                '/api/admin/auth/profile',
                sanitizedData
            );

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update profile');
            }

            return response.data.data;
        } catch (error) {
            const profileError = handleProfileUpdateError(error);
            throw new Error(profileError.message);
        }
    }

    /**
     * Upload avatar image with validation and retry logic
     */
    async uploadAvatar(file: File): Promise<string> {
        try {
            // Validate file before upload
            const validationError = validateFile(file, {
                maxSizeInMB: 5,
                allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
                allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
            });

            if (validationError) {
                throw new Error(validationError);
            }

            // Upload with retry logic
            return await retryWithBackoff(
                async () => {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await this.apiClient.post<AvatarUploadResponse>(
                        '/api/uploads/avatar',
                        formData,
                        {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                            timeout: 60000, // 60 seconds for uploads
                        }
                    );

                    if (!response.data.success) {
                        throw new Error('Failed to upload avatar');
                    }

                    return response.data.url;
                },
                2, // Only retry once for uploads
                (attempt, error) => {
                    console.log(`Retrying avatar upload (attempt ${attempt}):`, error.message);
                }
            );
        } catch (error) {
            const uploadError = handleAvatarUploadError(error);
            throw new Error(uploadError.message);
        }
    }

    /**
     * Check if profile service is available
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.apiClient.get('/api/health', {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }
}

export const profileService = new ProfileService();
