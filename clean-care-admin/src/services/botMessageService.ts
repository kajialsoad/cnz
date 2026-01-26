import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { cache, cacheKeys } from '../utils/cache';
import type {
    BotMessageConfig,
    BotMessagesResponse,
    CreateBotMessageRequest,
    UpdateBotMessageRequest,
    UpdateTriggerRulesRequest,
    BotAnalyticsQuery,
    BotAnalyticsResponse,
    ApiResponse,
    ChatType,
} from '../types/bot-message.types';

/**
 * Custom error class for bot message service errors
 */
export class BotMessageServiceError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public originalError?: any
    ) {
        super(message);
        this.name = 'BotMessageServiceError';
        Object.setPrototypeOf(this, BotMessageServiceError.prototype);
    }
}

/**
 * Error response interface
 */
interface ErrorResponse {
    message: string;
    statusCode?: number;
    errors?: Array<{ field: string; message: string }>;
}

/**
 * Bot Message Service
 * Handles all bot message-related API calls for the admin panel
 */
class BotMessageService {
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
                    console.error('[BotMessageService] Error getting token:', error);
                }
                return config;
            },
            (error) => {
                console.error('[BotMessageService] Request error:', error);
                return Promise.reject(this.handleError(error));
            }
        );

        // Response interceptor - Handle errors
        this.apiClient.interceptors.response.use(
            (response) => response,
            (error) => {
                console.error('[BotMessageService] Response error:', error);

                if (error.response?.status === 401) {
                    // Token expired or invalid - redirect to login
                    if (window.location.pathname !== '/login') {
                        console.warn('[BotMessageService] Unauthorized - redirecting to login');
                        window.location.assign('/login');
                    }
                }

                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Handle and format errors
     */
    private handleError(error: any): BotMessageServiceError {
        // Handle Axios errors
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<any>;
            const statusCode = axiosError.response?.status;
            const errorData = axiosError.response?.data;

            // Network error
            if (!axiosError.response) {
                return new BotMessageServiceError(
                    'Network error. Please check your internet connection.',
                    0,
                    error
                );
            }

            // Timeout error
            if (axiosError.code === 'ECONNABORTED') {
                return new BotMessageServiceError(
                    'Request timeout. Please try again.',
                    408,
                    error
                );
            }

            // Handle validation errors with detailed field messages
            if (statusCode === 400 && errorData?.errors && Array.isArray(errorData.errors)) {
                const fieldErrors = errorData.errors
                    .map((err: any) => `${err.field}: ${err.message}`)
                    .join(', ');
                return new BotMessageServiceError(
                    `Validation error: ${fieldErrors}`,
                    400,
                    error
                );
            }

            // Server error with message
            if (errorData?.message) {
                return new BotMessageServiceError(
                    errorData.message,
                    statusCode,
                    error
                );
            }

            // Generic HTTP errors
            switch (statusCode) {
                case 400:
                    return new BotMessageServiceError(
                        'Invalid request. Please check your input.',
                        400,
                        error
                    );
                case 401:
                    return new BotMessageServiceError(
                        'Unauthorized. Please log in again.',
                        401,
                        error
                    );
                case 403:
                    return new BotMessageServiceError(
                        'Access denied. You do not have permission to perform this action.',
                        403,
                        error
                    );
                case 404:
                    return new BotMessageServiceError(
                        'Resource not found.',
                        404,
                        error
                    );
                case 409:
                    return new BotMessageServiceError(
                        'Conflict. The resource already exists or is in use.',
                        409,
                        error
                    );
                case 422:
                    return new BotMessageServiceError(
                        'Validation error. Please check your input.',
                        422,
                        error
                    );
                case 429:
                    return new BotMessageServiceError(
                        'Too many requests. Please try again later.',
                        429,
                        error
                    );
                case 500:
                    return new BotMessageServiceError(
                        'Server error. Please try again later.',
                        500,
                        error
                    );
                case 503:
                    return new BotMessageServiceError(
                        'Service unavailable. Please try again later.',
                        503,
                        error
                    );
                default:
                    return new BotMessageServiceError(
                        `Request failed with status ${statusCode}`,
                        statusCode,
                        error
                    );
            }
        }

        // Handle BotMessageServiceError
        if (error instanceof BotMessageServiceError) {
            return error;
        }

        // Handle generic errors
        return new BotMessageServiceError(
            error?.message || 'An unexpected error occurred',
            undefined,
            error
        );
    }

    /**
     * Validate chat type
     */
    private validateChatType(chatType: string): void {
        const validTypes = ['LIVE_CHAT', 'COMPLAINT_CHAT'];
        if (!validTypes.includes(chatType)) {
            throw new BotMessageServiceError(
                `Invalid chat type: ${chatType}. Must be LIVE_CHAT or COMPLAINT_CHAT.`,
                400
            );
        }
    }

    /**
     * Validate bot message ID
     */
    private validateMessageId(id: number): void {
        if (!id || id <= 0 || !Number.isInteger(id)) {
            throw new BotMessageServiceError(
                'Invalid message ID. Must be a positive integer.',
                400
            );
        }
    }

    /**
     * Validate create bot message request
     */
    private validateCreateRequest(request: CreateBotMessageRequest): void {
        if (!request.chatType) {
            throw new BotMessageServiceError('Chat type is required', 400);
        }
        this.validateChatType(request.chatType);

        if (!request.messageKey || request.messageKey.trim().length === 0) {
            throw new BotMessageServiceError('Message key is required', 400);
        }

        if (!request.content || request.content.trim().length === 0) {
            throw new BotMessageServiceError('Content is required', 400);
        }

        if (!request.contentBn || request.contentBn.trim().length === 0) {
            throw new BotMessageServiceError('Bangla content is required', 400);
        }

        if (request.stepNumber === undefined || request.stepNumber < 1) {
            throw new BotMessageServiceError(
                'Step number must be a positive integer',
                400
            );
        }
    }

    /**
     * Get all bot messages for a specific chat type
     * @param chatType - Optional chat type filter (LIVE_CHAT or COMPLAINT_CHAT)
     * @returns Bot messages and trigger rules
     * @throws {BotMessageServiceError} If the request fails
     */
    async getBotMessages(chatType?: ChatType): Promise<BotMessagesResponse> {
        try {
            // Validate chat type if provided
            if (chatType) {
                this.validateChatType(chatType);
            }

            const params: any = {};
            if (chatType) {
                params.chatType = chatType;
            }

            // Check cache first
            const cacheKey = `bot-messages-${chatType || 'all'}`;
            const cachedData = cache.get<BotMessagesResponse>(cacheKey);

            if (cachedData) {
                console.log('[BotMessageService] Returning cached bot messages');
                return cachedData;
            }

            console.log('[BotMessageService] Fetching bot messages from API');
            const response = await this.apiClient.get<ApiResponse<BotMessagesResponse>>(
                '/api/admin/bot-messages',
                { params }
            );

            if (!response.data?.data) {
                throw new BotMessageServiceError(
                    'Invalid response format from server',
                    500
                );
            }

            const data = response.data.data;

            // Cache the response for 60 seconds
            cache.set(cacheKey, data, 60000);
            console.log('[BotMessageService] Bot messages fetched and cached successfully');

            return data;
        } catch (error) {
            console.error('[BotMessageService] Error fetching bot messages:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Create a new bot message
     * @param request - Bot message creation data
     * @returns Created bot message
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async createBotMessage(request: CreateBotMessageRequest): Promise<BotMessageConfig> {
        try {
            // Validate request
            this.validateCreateRequest(request);

            console.log('[BotMessageService] Creating bot message:', request.messageKey);
            const response = await this.apiClient.post<ApiResponse<BotMessageConfig>>(
                '/api/admin/bot-messages',
                request
            );

            if (!response.data?.data) {
                throw new BotMessageServiceError(
                    'Invalid response format from server',
                    500
                );
            }

            // Invalidate cache
            cache.invalidatePattern('bot-messages');
            console.log('[BotMessageService] Bot message created successfully');

            return response.data.data;
        } catch (error) {
            console.error('[BotMessageService] Error creating bot message:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Update an existing bot message
     * @param id - Bot message ID
     * @param request - Bot message update data
     * @returns Updated bot message
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async updateBotMessage(
        id: number,
        request: UpdateBotMessageRequest
    ): Promise<BotMessageConfig> {
        try {
            // Validate message ID
            this.validateMessageId(id);

            // Validate request fields if provided
            if (request.content !== undefined && request.content.trim().length === 0) {
                throw new BotMessageServiceError('Content cannot be empty', 400);
            }

            if (request.contentBn !== undefined && request.contentBn.trim().length === 0) {
                throw new BotMessageServiceError('Bangla content cannot be empty', 400);
            }

            if (request.stepNumber !== undefined && request.stepNumber < 1) {
                throw new BotMessageServiceError(
                    'Step number must be a positive integer',
                    400
                );
            }

            console.log('[BotMessageService] Updating bot message:', id);
            const response = await this.apiClient.put<ApiResponse<BotMessageConfig>>(
                `/api/admin/bot-messages/${id}`,
                request
            );

            if (!response.data?.data) {
                throw new BotMessageServiceError(
                    'Invalid response format from server',
                    500
                );
            }

            // Invalidate cache
            cache.invalidatePattern('bot-messages');
            console.log('[BotMessageService] Bot message updated successfully');

            return response.data.data;
        } catch (error) {
            console.error('[BotMessageService] Error updating bot message:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Delete a bot message
     * @param id - Bot message ID
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async deleteBotMessage(id: number): Promise<void> {
        try {
            // Validate message ID
            this.validateMessageId(id);

            console.log('[BotMessageService] Deleting bot message:', id);
            await this.apiClient.delete(`/api/admin/bot-messages/${id}`);

            // Invalidate cache
            cache.invalidatePattern('bot-messages');
            console.log('[BotMessageService] Bot message deleted successfully');
        } catch (error) {
            console.error('[BotMessageService] Error deleting bot message:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Update trigger rules for a specific chat type
     * @param chatType - Chat type (LIVE_CHAT or COMPLAINT_CHAT)
     * @param request - Trigger rules update data
     * @returns Updated trigger rules
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async updateTriggerRules(
        chatType: ChatType,
        request: UpdateTriggerRulesRequest
    ): Promise<any> {
        try {
            // Validate chat type
            this.validateChatType(chatType);

            // Validate request
            if (request.reactivationThreshold !== undefined) {
                if (request.reactivationThreshold < 1 || request.reactivationThreshold > 100) {
                    throw new BotMessageServiceError(
                        'Reactivation threshold must be between 1 and 100',
                        400
                    );
                }
            }

            console.log('[BotMessageService] Updating trigger rules for:', chatType);
            const response = await this.apiClient.put<ApiResponse<{ rules: any }>>(
                `/api/admin/bot-messages/rules/${chatType}`,
                request
            );

            if (!response.data?.data?.rules) {
                throw new BotMessageServiceError(
                    'Invalid response format from server',
                    500
                );
            }

            // Invalidate cache
            cache.invalidatePattern('bot-messages');
            console.log('[BotMessageService] Trigger rules updated successfully');

            return response.data.data.rules;
        } catch (error) {
            console.error('[BotMessageService] Error updating trigger rules:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Get bot analytics
     * @param query - Analytics query parameters
     * @returns Bot analytics data
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async getBotAnalytics(query?: BotAnalyticsQuery): Promise<BotAnalyticsResponse> {
        try {
            // Validate chat type if provided
            if (query?.chatType) {
                this.validateChatType(query.chatType);
            }

            // Validate date range
            if (query?.startDate && query?.endDate) {
                const startDate = new Date(query.startDate);
                const endDate = new Date(query.endDate);

                if (isNaN(startDate.getTime())) {
                    throw new BotMessageServiceError('Invalid start date format', 400);
                }

                if (isNaN(endDate.getTime())) {
                    throw new BotMessageServiceError('Invalid end date format', 400);
                }

                if (startDate > endDate) {
                    throw new BotMessageServiceError(
                        'Start date must be before end date',
                        400
                    );
                }
            }

            const params: any = {};
            if (query?.chatType) {
                params.chatType = query.chatType;
            }
            if (query?.startDate) {
                params.startDate = query.startDate;
            }
            if (query?.endDate) {
                params.endDate = query.endDate;
            }

            // Check cache first
            const cacheKey = `bot-analytics-${JSON.stringify(params)}`;
            const cachedData = cache.get<BotAnalyticsResponse>(cacheKey);

            if (cachedData) {
                console.log('[BotMessageService] Returning cached bot analytics');
                return cachedData;
            }

            console.log('[BotMessageService] Fetching bot analytics from API');
            const response = await this.apiClient.get<ApiResponse<BotAnalyticsResponse>>(
                '/api/admin/bot-messages/analytics',
                { params }
            );

            if (!response.data?.data) {
                throw new BotMessageServiceError(
                    'Invalid response format from server',
                    500
                );
            }

            const data = response.data.data;

            // Cache the response for 60 seconds
            cache.set(cacheKey, data, 60000);
            console.log('[BotMessageService] Bot analytics fetched and cached successfully');

            return data;
        } catch (error) {
            console.error('[BotMessageService] Error fetching bot analytics:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Reorder bot messages
     * @param chatType - Chat type
     * @param messageIds - Array of message IDs in new order
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async reorderBotMessages(chatType: ChatType, messageIds: number[]): Promise<void> {
        try {
            // Validate chat type
            this.validateChatType(chatType);

            // Validate message IDs
            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                throw new BotMessageServiceError(
                    'Message IDs must be a non-empty array',
                    400
                );
            }

            // Validate each message ID
            messageIds.forEach((id, index) => {
                if (!Number.isInteger(id) || id <= 0) {
                    throw new BotMessageServiceError(
                        `Invalid message ID at index ${index}: ${id}`,
                        400
                    );
                }
            });

            console.log('[BotMessageService] Reordering bot messages for:', chatType);

            // Update display order for each message
            const updatePromises = messageIds.map((id, index) =>
                this.updateBotMessage(id, { displayOrder: index })
            );

            await Promise.all(updatePromises);

            // Invalidate cache
            cache.invalidatePattern('bot-messages');
            console.log('[BotMessageService] Bot messages reordered successfully');
        } catch (error) {
            console.error('[BotMessageService] Error reordering bot messages:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Toggle bot message active status
     * @param id - Bot message ID
     * @param isActive - New active status
     * @returns Updated bot message
     * @throws {BotMessageServiceError} If validation fails or the request fails
     */
    async toggleBotMessageActive(id: number, isActive: boolean): Promise<BotMessageConfig> {
        try {
            // Validate message ID
            this.validateMessageId(id);

            // Validate isActive
            if (typeof isActive !== 'boolean') {
                throw new BotMessageServiceError(
                    'isActive must be a boolean value',
                    400
                );
            }

            console.log('[BotMessageService] Toggling bot message active status:', id, isActive);
            return await this.updateBotMessage(id, { isActive });
        } catch (error) {
            console.error('[BotMessageService] Error toggling bot message status:', error);
            throw this.handleError(error);
        }
    }
}

// Export singleton instance
export const botMessageService = new BotMessageService();
