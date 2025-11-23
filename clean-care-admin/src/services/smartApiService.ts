import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/apiConfig';

class SmartApiService {
    private primaryClient: AxiosInstance;
    private fallbackClient: AxiosInstance;
    private useVercel: boolean = false;
    private lastLocalCheck: Date | null = null;
    private recheckInterval = 30000; // 30 seconds

    constructor() {
        // Primary client (localhost)
        this.primaryClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.FALLBACK_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Fallback client (Vercel)
        this.fallbackClient = axios.create({
            baseURL: API_CONFIG.VERCEL_URL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Add auth token to requests
        const addAuthToken = (config: any) => {
            const token = localStorage.getItem('adminToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        };

        this.primaryClient.interceptors.request.use(addAuthToken);
        this.fallbackClient.interceptors.request.use(addAuthToken);
    }

    private shouldRecheckLocal(): boolean {
        if (!this.lastLocalCheck) return true;
        return Date.now() - this.lastLocalCheck.getTime() > this.recheckInterval;
    }

    private async checkLocalServer(): Promise<boolean> {
        this.lastLocalCheck = new Date();
        try {
            await this.primaryClient.get('/api/health', { timeout: 2000 });
            console.log('✅ Local server is back online');
            this.useVercel = false;
            return true;
        } catch {
            return false;
        }
    }

    async request<T>(config: AxiosRequestConfig): Promise<T> {
        // Recheck local if using Vercel
        if (this.useVercel && this.shouldRecheckLocal()) {
            await this.checkLocalServer();
        }

        try {
            // Try primary (local) first
            if (!this.useVercel) {
                try {
                    const response = await this.primaryClient.request<T>(config);
                    return response.data;
                } catch (error: any) {
                    console.warn('⚠️ Local server failed, switching to Vercel:', error.message);
                    this.useVercel = true;
                    this.lastLocalCheck = new Date();
                }
            }

            // Use Vercel fallback
            console.log('🌐 Using Vercel server');
            const response = await this.fallbackClient.request<T>(config);
            return response.data;
        } catch (error: any) {
            console.error('❌ Both servers failed:', error);
            throw error;
        }
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>({ ...config, method: 'GET', url });
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>({ ...config, method: 'POST', url, data });
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>({ ...config, method: 'PUT', url, data });
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>({ ...config, method: 'DELETE', url });
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        return this.request<T>({ ...config, method: 'PATCH', url, data });
    }

    getCurrentServer(): string {
        return this.useVercel ? 'Vercel (Cloud)' : 'Local WiFi';
    }

    isUsingVercel(): boolean {
        return this.useVercel;
    }

    forceVercel() {
        this.useVercel = true;
        this.lastLocalCheck = new Date();
    }

    forceLocal() {
        this.useVercel = false;
    }
}

export const smartApiService = new SmartApiService();
