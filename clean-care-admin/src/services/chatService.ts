import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { cache, cacheKeys } from '../utils/cache';
import type {
    ChatMessage,
    SendMessageRequest,
    GetChatMessagesResponse,
    SendMessageResponse,
    MarkAsReadResponse,
} from '../types/chat-service.types';
import type {
    ChatConversation,
    ChatFilters,
    ChatStatistics,
    GetChatConversationsResponse,
    GetChatStatisticsResponse,
} from '../types/chat-page.types';

class ChatService {
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
     * Get chat messages for a complaint
     */
    async getChatMessages(
        complaintId: number,
        page: number = 1,
        limit: number = 50
    ): Promise<{
        messages: ChatMessage[];
        pagination: any;
    }> {
        try {
            // Check cache first
            const cacheKey = cacheKeys.chatMessages(complaintId, page);
            const cachedData = cache.get<{ messages: ChatMessage[]; pagination: any }>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const response = await this.apiClient.get<GetChatMessagesResponse>(
                `/api/admin/chat/${complaintId}`,
                {
                    params: { page, limit },
                }
            );

            const data = response.data.data;

            // Cache the response for 30 seconds
            cache.set(cacheKey, data, 30000);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch chat messages'
                );
            }
            throw error;
        }
    }

    /**
     * Send a chat message
     */
    async sendMessage(
        complaintId: number,
        data: SendMessageRequest
    ): Promise<ChatMessage> {
        try {
            const response = await this.apiClient.post<SendMessageResponse>(
                `/api/admin/chat/${complaintId}`,
                data
            );

            // Invalidate cache for this complaint's messages
            cache.invalidatePattern(`chat-messages-${complaintId}`);

            // Invalidate chat list cache as last message will change
            cache.invalidatePattern('chat-list');

            return response.data.data.message;
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
     * Mark messages as read for a complaint
     */
    async markAsRead(complaintId: number): Promise<void> {
        try {
            await this.apiClient.patch<MarkAsReadResponse>(
                `/api/admin/chat/${complaintId}/read`
            );
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
     * Get unread message count for a complaint
     * Note: This is calculated from the messages, not a separate endpoint
     */
    async getUnreadCount(complaintId: number): Promise<number> {
        try {
            const { messages } = await this.getChatMessages(complaintId, 1, 100);

            // Count unread messages from citizens (not from admin)
            const unreadCount = messages.filter(
                (msg) => !msg.read && msg.senderType === 'CITIZEN'
            ).length;

            return unreadCount;
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    /**
     * Start polling for new messages
     * @param complaintId - The complaint ID to poll messages for
     * @param callback - Callback function to handle new messages
     */
    startPolling(
        complaintId: number,
        callback: (messages: ChatMessage[]) => void
    ): void {
        // Stop existing polling for this complaint if any
        this.stopPolling(complaintId);

        // Start new polling interval
        const intervalId = setInterval(async () => {
            try {
                const { messages } = await this.getChatMessages(complaintId);
                callback(messages);
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }, this.POLLING_INTERVAL);

        this.pollingIntervals.set(complaintId, intervalId);
    }

    /**
     * Stop polling for messages
     * @param complaintId - The complaint ID to stop polling for
     */
    stopPolling(complaintId: number): void {
        const intervalId = this.pollingIntervals.get(complaintId);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollingIntervals.delete(complaintId);
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
     * Send a message with image attachment
     */
    async sendMessageWithImage(
        complaintId: number,
        message: string,
        imageUrl: string
    ): Promise<ChatMessage> {
        return this.sendMessage(complaintId, {
            message,
            imageUrl,
        });
    }

    /**
     * Get latest messages (convenience method)
     */
    async getLatestMessages(
        complaintId: number,
        limit: number = 20
    ): Promise<ChatMessage[]> {
        const { messages } = await this.getChatMessages(complaintId, 1, limit);
        return messages;
    }

    /**
     * Get all chat conversations with pagination
     * @param filters - Optional filters for chat list
     * @returns Chat conversations with pagination info
     */
    async getChatConversationsWithPagination(
        filters?: ChatFilters
    ): Promise<{
        chats: ChatConversation[];
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        try {
            const params = new URLSearchParams();

            // Add filter parameters if provided
            if (filters?.search) {
                params.append('search', filters.search);
            }
            if (filters?.district) {
                params.append('district', filters.district);
            }
            if (filters?.upazila) {
                params.append('upazila', filters.upazila);
            }
            if (filters?.ward) {
                params.append('ward', filters.ward);
            }
            if (filters?.zone) {
                params.append('zone', filters.zone);
            }
            if (filters?.cityCorporationCode) {
                params.append('cityCorporationCode', filters.cityCorporationCode);
            }
            if (filters?.thanaId) {
                params.append('thanaId', filters.thanaId.toString());
            }
            if (filters?.status) {
                params.append('status', filters.status);
            }
            if (filters?.unreadOnly) {
                params.append('unreadOnly', 'true');
            }
            if (filters?.page) {
                params.append('page', filters.page.toString());
            }
            if (filters?.limit) {
                params.append('limit', filters.limit.toString());
            }

            const queryString = params.toString();
            const url = queryString ? `/api/admin/chat?${queryString}` : '/api/admin/chat';

            const response = await this.apiClient.get<GetChatConversationsResponse>(url);

            // Transform date strings to Date objects
            const chats = response.data.data.chats.map((chat) => ({
                ...chat,
                complaintCreatedAt: new Date(chat.complaintCreatedAt),
                lastMessage: {
                    ...chat.lastMessage,
                    timestamp: new Date(chat.lastMessage.timestamp),
                },
                lastActivity: new Date(chat.lastActivity),
            }));

            return {
                chats,
                pagination: response.data.data.pagination,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch chat conversations'
                );
            }
            throw error;
        }
    }

    /**
     * Get all chat conversations with filters
     * @param filters - Optional filters for search, location, status, etc.
     * @returns Array of chat conversations with complaint and citizen details
     */
    async getChatConversations(
        filters?: ChatFilters
    ): Promise<ChatConversation[]> {
        try {
            const params = new URLSearchParams();

            // Add filter parameters if provided
            if (filters?.search) {
                params.append('search', filters.search);
            }
            if (filters?.district) {
                params.append('district', filters.district);
            }
            if (filters?.upazila) {
                params.append('upazila', filters.upazila);
            }
            if (filters?.ward) {
                params.append('ward', filters.ward);
            }
            if (filters?.zone) {
                params.append('zone', filters.zone);
            }
            if (filters?.cityCorporationCode) {
                params.append('cityCorporationCode', filters.cityCorporationCode);
            }
            if (filters?.thanaId) {
                params.append('thanaId', filters.thanaId.toString());
            }
            if (filters?.status) {
                params.append('status', filters.status);
            }
            if (filters?.unreadOnly) {
                params.append('unreadOnly', 'true');
            }
            if (filters?.page) {
                params.append('page', filters.page.toString());
            }
            if (filters?.limit) {
                params.append('limit', filters.limit.toString());
            }

            const queryString = params.toString();

            // Check cache first
            const cacheKey = cacheKeys.chatList(queryString);
            const cachedData = cache.get<ChatConversation[]>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const url = queryString ? `/api/admin/chat?${queryString}` : '/api/admin/chat';

            const response = await this.apiClient.get<GetChatConversationsResponse>(url);

            // Transform date strings to Date objects
            const chats = response.data.data.chats.map((chat) => ({
                ...chat,
                complaintCreatedAt: new Date(chat.complaintCreatedAt),
                lastMessage: {
                    ...chat.lastMessage,
                    timestamp: new Date(chat.lastMessage.timestamp),
                },
                lastActivity: new Date(chat.lastActivity),
            }));

            // Cache the response for 30 seconds
            cache.set(cacheKey, chats, 30000);

            return chats;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch chat conversations'
                );
            }
            throw error;
        }
    }

    /**
     * Get chat statistics
     * @returns Statistics including total chats, unread count, and breakdowns by location and status
     */
    async getChatStatistics(): Promise<ChatStatistics> {
        try {
            // Check cache first
            const cacheKey = cacheKeys.chatStatistics();
            const cachedData = cache.get<ChatStatistics>(cacheKey);

            if (cachedData) {
                return cachedData;
            }

            const response = await this.apiClient.get<GetChatStatisticsResponse>(
                '/api/admin/chat/statistics'
            );

            const data = response.data.data;

            // Cache the response for 30 seconds
            cache.set(cacheKey, data, 30000);

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(
                    error.response?.data?.message || 'Failed to fetch chat statistics'
                );
            }
            throw error;
        }
    }
}

export const chatService = new ChatService();
