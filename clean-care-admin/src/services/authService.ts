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
        } catch {}

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
            const loginResponse = await this.apiClient.post<{
                accessToken: string;
                refreshToken: string;
                accessExpiresIn: number;
                refreshExpiresIn: number;
            }>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);

            // Persist tokens and set Authorization header
            this.setAccessToken(loginResponse.data.accessToken);
            this.setRefreshToken(loginResponse.data.refreshToken);

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
            const storedRefresh = localStorage.getItem(this.refreshTokenKey);
            await this.apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
                refreshToken: storedRefresh,
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        // Always clear client-side tokens
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
