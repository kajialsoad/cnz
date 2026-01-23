import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { cache, cacheKeys } from '../utils/cache';
import type {
    LiveChatMessage,
    UserConversation,
    LiveChatFilters,
    ChatStatistics,
    MessagesResponse,
    ConversationsResponse,
} from '../types/live-chat.types';

class LiveChatService {
    private apiClient: AxiosInstance;
    private pollingIntervals: Map<number, ReturnType<typeof setInterval>>;
    private readonly POLLING_INTERVAL = 5000; // 5 seconds

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.pollingIntervals = new Map();
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
                return Promise.reject(error);
            }
        );
    }

    /**
     * Check if URL is a Cloudinary URL
     */
    private isCloudinaryUrl(url: string): boolean {
        return !!url && url.includes('res.cloudinary.com') && url.includes('/upload/');
    }

    /**
     * Transform media URL - supports hybrid storage (Cloudinary + local)
     */
    private transformMediaUrl(url: string | null | undefined): string | null {
        if (!url) return null;

        // If it's a Cloudinary URL, return as is
        if (this.isCloudinaryUrl(url)) {
            return url;
        }

        // If already absolute URL (but not Cloudinary), check if it needs fixing
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // If it's already using current server, return as is
            if (url.startsWith(API_CONFIG.BASE_URL)) {
                return url;
            }
            // Replace other server URLs with current server
            const urlPattern = /^https?:\/\/[^\/]+/;
            return url.replace(urlPattern, API_CONFIG.BASE_URL);
        }

        // Convert relative URL to absolute
        const baseUrl = API_CONFIG.BASE_URL;
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    /**
     * Get Cloudinary thumbnail URL with transformations
     */
    private getCloudinaryThumbnail(url: string, width: number = 200, height: number = 200): string {
        if (!url) return url;

        // Check if URL is a Cloudinary URL
        if (this.isCloudinaryUrl(url)) {
            // Insert transformation parameters after /upload/
            return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
        }

        // If not a Cloudinary URL, return as is
        return url;
    }

    /**
     * Get optimized Cloudinary URL
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
     * Transform message media URLs
     */
    private transformMessage(message: LiveChatMessage): LiveChatMessage {
        return {
            ...message,
            fileUrl: this.transformMediaUrl(message.fileUrl) || undefined,
            voiceUrl: this.transformMediaUrl(message.voiceUrl) || undefined,
        };
    }

    /**
     * Get all user conversations with filters
     */
    async getConversations(filters?: LiveChatFilters): Promise<ConversationsResponse> {
        try {
            const params: any = {
                page: filters?.page || 1,
                limit: filters?.limit || 20,
            };

            // Add filters to params if provided
            if (filters?.cityCorporationCode) {
                params.cityCorporationCode = filters.cityCorporationCode;
            }
            if (filters?.zoneId) {
                params.zoneId = filters.zoneId;
            }
            if (filters?.wardId) {
                params.wardId = filters.wardId;
            }
            if (filters?.unreadOnly) {
                params.unreadOnly = 'true';
            }
            if (filters?.search) {
                params.search = filters.search;
            }

            // Check cache first
            const cacheKey = cacheKeys.liveChatConversations(JSON.stringify(params));
            const cachedData = cache.get<ConversationsResponse>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: ConversationsResponse;
            }>('/api/admin/live-chat', { params });

            const data = response.data.data;

            // Transform media URLs in last messages
            if (data.conversations) {
                data.conversations = data.conversations.map(conv => ({
                    ...conv,
                    lastMessage: conv.lastMessage ? this.transformMessage(conv.lastMessage) : null,
                }));
            }

            // Cache the response for 30 seconds
            cache.set(cacheKey, data, 30000);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch conversations'
                );
            }
            throw error;
        }
    }

    /**
     * Get messages for a specific user
     */
    async getUserMessages(
        userId: number,
        page: number = 1,
        limit: number = 50
    ): Promise<MessagesResponse> {
        try {
            // Check cache first
            const cacheKey = cacheKeys.liveChatMessages(userId, page);
            const cachedData = cache.get<MessagesResponse>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: MessagesResponse;
            }>(`/api/admin/live-chat/${userId}`, {
                params: { page, limit },
            });

            const data = response.data.data;

            // Transform media URLs
            if (data.messages) {
                data.messages = data.messages.map(msg => this.transformMessage(msg));
            }

            // Cache the response for 30 seconds
            cache.set(cacheKey, data, 30000);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch messages'
                );
            }
            throw error;
        }
    }

    /**
     * Send a message to a user
     */
    async sendMessage(
        userId: number,
        message: string,
        imageFile?: File
    ): Promise<LiveChatMessage> {
        try {
            if (imageFile) {
                // Send with file upload
                const formData = new FormData();
                // If no text message, use a default message for image
                const messageContent = message.trim() || 'Image';
                formData.append('message', messageContent);
                formData.append('image', imageFile);

                const token = localStorage.getItem('accessToken');

                const response = await axios.post<{
                    success: boolean;
                    data: { message: LiveChatMessage };
                }>(
                    `${API_CONFIG.BASE_URL}/api/admin/live-chat/${userId}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                // Invalidate cache
                cache.invalidatePattern(`live-chat-messages-${userId}`);
                cache.invalidatePattern('live-chat-conversations');

                return this.transformMessage(response.data.data.message);
            } else {
                // Send text only
                const response = await this.apiClient.post<{
                    success: boolean;
                    data: { message: LiveChatMessage };
                }>(`/api/admin/live-chat/${userId}`, {
                    message: message,
                });

                // Invalidate cache
                cache.invalidatePattern(`live-chat-messages-${userId}`);
                cache.invalidatePattern('live-chat-conversations');

                return this.transformMessage(response.data.data.message);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to send message'
                );
            }
            throw error;
        }
    }

    /**
     * Mark messages as read for a user
     */
    async markAsRead(userId: number): Promise<void> {
        try {
            await this.apiClient.patch(`/api/admin/live-chat/${userId}/read`);

            // Invalidate cache
            cache.invalidatePattern(`live-chat-messages-${userId}`);
            cache.invalidatePattern('live-chat-conversations');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to mark messages as read'
                );
            }
            throw error;
        }
    }

    /**
     * Get live chat statistics
     */
    async getStatistics(): Promise<ChatStatistics> {
        try {
            // Check cache first
            const cacheKey = cacheKeys.liveChatStatistics();
            const cachedData = cache.get<ChatStatistics>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const response = await this.apiClient.get<{
                success: boolean;
                data: ChatStatistics;
            }>('/api/admin/live-chat/statistics');

            const data = response.data.data;

            // Cache the response for 30 seconds
            cache.set(cacheKey, data, 30000);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch statistics'
                );
            }
            throw error;
        }
    }

    /**
     * Start polling for new messages
     */
    startPolling(
        userId: number,
        callback: (messages: LiveChatMessage[]) => void
    ): void {
        // Stop existing polling for this user if any
        this.stopPolling(userId);

        // Start new polling interval
        const intervalId = setInterval(async () => {
            try {
                const { messages } = await this.getUserMessages(userId);
                callback(messages);
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }, this.POLLING_INTERVAL);

        this.pollingIntervals.set(userId, intervalId);
    }

    /**
     * Stop polling for messages
     */
    stopPolling(userId: number): void {
        const intervalId = this.pollingIntervals.get(userId);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollingIntervals.delete(userId);
        }
    }

    /**
     * Stop all polling intervals
     */
    stopAllPolling(): void {
        this.pollingIntervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.pollingIntervals.clear();
    }

    /**
     * Get thumbnail URL for an image
     */
    getThumbnailUrl(url: string, width: number = 200, height: number = 200): string {
        return this.getCloudinaryThumbnail(url, width, height);
    }

    /**
     * Get optimized URL for an image
     */
    getOptimizedUrl(url: string): string {
        return this.getOptimizedCloudinaryUrl(url);
    }
}

export const liveChatService = new LiveChatService();
