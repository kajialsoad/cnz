import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { LoginCredentials, AuthResponse, User } from '../types/auth.types';

class AuthService {
    private apiClient: AxiosInstance;
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];
    private accessTokenKey = 'accessToken';

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Load any existing token on startup
        try {
            const existing = localStorage.getItem(this.accessTokenKey);
            if (existing) {
                this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${existing}`;
            }
        } catch { }

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.apiClient.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        return new Promise((resolve) => {
                            this.refreshSubscribers.push((token: string) => {
                                originalRequest.headers = {
                                    ...(originalRequest.headers || {}),
                                    Authorization: `Bearer ${token}`,
                                };
                                resolve(this.apiClient(originalRequest));
                            });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const newToken = await this.refreshToken();
                        this.isRefreshing = false;

                        this.refreshSubscribers.forEach((cb) => cb(newToken));
                        this.refreshSubscribers = [];

                        originalRequest.headers = {
                            ...(originalRequest.headers || {}),
                            Authorization: `Bearer ${newToken}`,
                        };
                        return this.apiClient(originalRequest);
                    } catch (refreshError) {
                        this.isRefreshing = false;
                        this.refreshSubscribers = [];
                        // Avoid reload loop on login page
                        const loginPath = `${import.meta.env.BASE_URL}login`;
                        if (window.location.pathname !== loginPath) {
                            window.location.assign(loginPath);
                        }
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private setAccessToken(token: string) {
        try {
            localStorage.setItem(this.accessTokenKey, token);
            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch { }
    }


    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const loginResponse = await this.apiClient.post<{
                accessToken: string;
                accessExpiresIn: number;
                refreshToken?: string;
                refreshExpiresIn?: number;
            }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);

            // Persist tokens and set Authorization header
            this.setAccessToken(loginResponse.data.accessToken);

            // Fetch profile with fresh token
            const profileResponse = await this.apiClient.get<{ user: User }>(
                API_CONFIG.ENDPOINTS.AUTH.PROFILE,
                {
                    headers: {
                        Authorization: `Bearer ${loginResponse.data.accessToken}`,
                    },
                }
            );

            return {
                user: profileResponse.data.user,
                accessToken: loginResponse.data.accessToken,
                refreshToken: loginResponse.data.refreshToken ?? '',
                expiresIn: loginResponse.data.accessExpiresIn,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(error.response?.data?.message || 'Login failed');
            }
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.error('Logout error:', error);
        }
        // Always clear client-side tokens and cache
        try {
            localStorage.removeItem(this.accessTokenKey);
            // Clear profile cache
            localStorage.removeItem('cc_profile_cache');
            delete this.apiClient.defaults.headers.common['Authorization'];
        } catch { }
    }

    async refreshToken(): Promise<string> {
        try {
            const response = await this.apiClient.post<{ accessToken: string }>(
                API_CONFIG.ENDPOINTS.AUTH.REFRESH,
                {}
            );
            const newAccess = response.data.accessToken;
            this.setAccessToken(newAccess);
            return newAccess;
        } catch (error) {
            throw new Error('Token refresh failed');
        }
    }

    async getProfile(): Promise<User> {
        try {
            const response = await this.apiClient.get<{ success: boolean; data: User } | { user: User }>(
                API_CONFIG.ENDPOINTS.AUTH.PROFILE
            );
            // Handle both response formats: { success, data } and { user }
            if ('data' in response.data && response.data.data) {
                return response.data.data;
            }
            if ('user' in response.data) {
                return response.data.user;
            }
            throw new Error('Invalid profile response format');
        } catch (error) {
            throw new Error('Failed to fetch profile');
        }
    }
}

export const authService = new AuthService();
