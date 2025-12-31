import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

class SystemConfigService {
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
                    if (window.location.pathname !== '/login') {
                        window.location.assign('/login');
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async getAllConfigs() {
        const response = await this.apiClient.get('/api/admin/config');
        return response.data;
    }

    async getConfig(key: string) {
        const response = await this.apiClient.get(`/api/admin/config/${key}`);
        return response.data;
    }

    async updateConfig(key: string, value: string, description?: string) {
        const response = await this.apiClient.put(`/api/admin/config/${key}`, {
            value,
            description
        });
        return response.data;
    }
}

export const systemConfigService = new SystemConfigService();
