import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
    ChatMessage,
    SendMessageRequest,
    GetChatMessagesResponse,
    SendMessageResponse,
    MarkAsReadResponse,
} from '../types/chat-service.types';

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
            const response = await this.apiClient.get<GetChatMessagesResponse>(
                `/admin/chat/${complaintId}`,
                {
                    params: { page, limit },
                }
            );

            return response.data.data;
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
                `/admin/chat/${complaintId}`,
                data
            );

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
                `/admin/chat/${complaintId}/read`
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
}

export const chatService = new ChatService();
