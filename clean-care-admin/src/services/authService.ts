import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { LoginCredentials, AuthResponse, User } from '../types/auth.types';

class AuthService {
    private apiClient: AxiosInstance;
    private isRefreshing = false;
    private refreshSubscribers: ((token: string) => void)[] = [];
    private accessTokenKey = 'accessToken';
    private refreshTokenKey = 'refreshToken';

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true, // Send cookies with requests
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Setup response interceptor for automatic token refresh
        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.apiClient.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                // If error is 401 and we haven't tried to refresh yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If already refreshing, queue this request
                        return new Promise((resolve) => {
                            this.refreshSubscribers.push((token: string) => {
                                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                                resolve(this.apiClient(originalRequest));
                            });
                        });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const newToken = await this.refreshToken();
                        this.isRefreshing = false;

                        // Retry all queued requests
                        this.refreshSubscribers.forEach((callback) => callback(newToken));
                        this.refreshSubscribers = [];

                        // Retry the original request
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return this.apiClient(originalRequest);
                    } catch (refreshError) {
                        this.isRefreshing = false;
                        this.refreshSubscribers = [];
                        // Avoid hard reload loop on login page; let routing handle redirect
                        if (window.location.pathname !== '/login') {
                            window.location.assign('/login');
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
        } catch {}
    }

    private setRefreshToken(token: string) {
        try {
            localStorage.setItem(this.refreshTokenKey, token);
        } catch {}
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            // Step 1: Login to get tokens
            const loginResponse = await this.apiClient.post<{
                accessToken: string;
                refreshToken: string;
                accessExpiresIn: number;
                refreshExpiresIn: number;
            }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);

            // Persist tokens and set default Authorization header
            this.setAccessToken(loginResponse.data.accessToken);
            this.setRefreshToken(loginResponse.data.refreshToken);

            // Step 2: Get user profile
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
                refreshToken: loginResponse.data.refreshToken,
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
            // Even if logout fails on backend, we should clear local state
        }
        // Clear local tokens and default header
        try {
            localStorage.removeItem(this.accessTokenKey);
            localStorage.removeItem(this.refreshTokenKey);
            delete this.apiClient.defaults.headers.common['Authorization'];
        } catch {}
    }

    async refreshToken(): Promise<string> {
        try {
            const storedRefresh = localStorage.getItem(this.refreshTokenKey);
            if (!storedRefresh) throw new Error('Missing refresh token');
            const response = await this.apiClient.post<{ accessToken: string }>(
                API_CONFIG.ENDPOINTS.AUTH.REFRESH,
                { refreshToken: storedRefresh }
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
            const response = await this.apiClient.get<{ user: User }>(
                API_CONFIG.ENDPOINTS.AUTH.PROFILE
            );
            return response.data.user;
        } catch (error) {
            throw new Error('Failed to fetch profile');
        }
    }
}

export const authService = new AuthService();
