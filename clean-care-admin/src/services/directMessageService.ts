import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type { ChatMessage } from '../types/chat-service.types';

export interface DirectMessage extends ChatMessage {
    receiverId?: number;
}

class DirectMessageService {
    private apiClient;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.apiClient.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Get conversation with a user
     */
    async getConversation(userId: number, page: number = 1, limit: number = 50) {
        try {
            const response = await this.apiClient.get(`/api/admin/direct-chat/${userId}`, {
                params: { page, limit }
            });
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Send a direct message
     */
    async sendMessage(userId: number, content: string, fileUrl?: string) {
        try {
            const response = await this.apiClient.post(`/api/admin/direct-chat/${userId}`, {
                content,
                fileUrl
            });
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }
}

export const directMessageService = new DirectMessageService();
