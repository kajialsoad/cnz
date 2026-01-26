/**
 * Bot Message System Types
 * TypeScript types for the Bot Message System in the admin panel
 */

/**
 * Chat Type Enum
 */
export type ChatType = 'LIVE_CHAT' | 'COMPLAINT_CHAT';

/**
 * Bot Message Configuration
 * Represents a bot message configuration
 */
export interface BotMessageConfig {
    id: number;
    chatType: ChatType;
    messageKey: string;
    content: string;
    contentBn: string;
    stepNumber: number;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Bot Trigger Rule
 * Configuration for bot trigger behavior
 */
export interface BotTriggerRule {
    id: number;
    chatType: ChatType;
    isEnabled: boolean;
    reactivationThreshold: number;
    resetStepsOnReactivate: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Bot Conversation State
 * Tracks bot state for a specific conversation
 */
export interface BotConversationState {
    id: number;
    chatType: ChatType;
    conversationId: string;
    currentStep: number;
    isActive: boolean;
    lastAdminReplyAt?: Date | string | null;
    userMessageCount: number;
    lastBotMessageAt?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Bot Message Analytics
 * Analytics data for bot messages
 */
export interface BotMessageAnalytics {
    id: number;
    chatType: ChatType;
    messageKey: string;
    stepNumber: number;
    triggerCount: number;
    adminReplyCount: number;
    avgResponseTime?: number | null;
    date: Date | string;
}

/**
 * Bot Messages Response
 * Response format for getting bot messages
 */
export interface BotMessagesResponse {
    messages: BotMessageConfig[];
    rules: BotTriggerRule;
}

/**
 * Create Bot Message Request
 * Request payload for creating a bot message
 */
export interface CreateBotMessageRequest {
    chatType: ChatType;
    messageKey: string;
    content: string;
    contentBn: string;
    stepNumber: number;
    displayOrder: number;
}

/**
 * Update Bot Message Request
 * Request payload for updating a bot message
 */
export interface UpdateBotMessageRequest {
    content?: string;
    contentBn?: string;
    stepNumber?: number;
    isActive?: boolean;
    displayOrder?: number;
}

/**
 * Update Trigger Rules Request
 * Request payload for updating trigger rules
 */
export interface UpdateTriggerRulesRequest {
    isEnabled: boolean;
    reactivationThreshold: number;
    resetStepsOnReactivate: boolean;
}

/**
 * Bot Analytics Query
 * Query parameters for bot analytics
 */
export interface BotAnalyticsQuery {
    chatType?: ChatType;
    startDate?: string;
    endDate?: string;
}

/**
 * Bot Analytics Response
 * Response format for bot analytics
 */
export interface BotAnalyticsResponse {
    totalTriggers: number;
    adminReplyRate: number;
    avgResponseTime: number;
    stepBreakdown: Array<{
        step: number;
        triggers: number;
        replies: number;
    }>;
}

/**
 * API Response Wrapper
 * Generic API response format
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
