/**
 * Bot Message System - Type Definitions
 * 
 * This file contains all TypeScript types and interfaces for the Bot Message System.
 */

import { ChatType } from '@prisma/client';

/**
 * Bot Message Configuration
 */
export interface BotMessage {
    id: number;
    chatType: ChatType;
    messageKey: string;
    content: string;
    contentBn: string;
    stepNumber: number;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bot Trigger Rules Configuration
 */
export interface BotTriggerRule {
    id: number;
    chatType: ChatType;
    isEnabled: boolean;
    reactivationThreshold: number;
    resetStepsOnReactivate: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bot Conversation State
 */
export interface BotConversationState {
    id: number;
    chatType: ChatType;
    conversationId: string;
    currentStep: number;
    isActive: boolean;
    lastAdminReplyAt: Date | null;
    userMessageCount: number;
    lastBotMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Bot Message Analytics
 */
export interface BotMessageAnalytics {
    id: number;
    chatType: ChatType;
    messageKey: string;
    stepNumber: number;
    triggerCount: number;
    adminReplyCount: number;
    avgResponseTime: number | null;
    date: Date;
}

/**
 * Input for checking if bot should trigger
 */
export interface ShouldTriggerBotInput {
    chatType: ChatType;
    conversationId: string;
    hasAdminReplied: boolean;
}

/**
 * Result of bot trigger check
 */
export interface ShouldTriggerBotResult {
    shouldSend: boolean;
    botMessage?: BotMessage;
    step?: number;
}

/**
 * Input for handling admin reply
 */
export interface HandleAdminReplyInput {
    chatType: ChatType;
    conversationId: string;
}

/**
 * Input for handling user message
 */
export interface HandleUserMessageInput {
    chatType: ChatType;
    conversationId: string;
}

/**
 * Input for creating conversation state
 */
export interface CreateConversationStateInput {
    chatType: ChatType;
    conversationId: string;
}

/**
 * Input for updating conversation state
 */
export interface UpdateConversationStateInput {
    currentStep?: number;
    isActive?: boolean;
    lastAdminReplyAt?: Date;
    userMessageCount?: number;
    lastBotMessageAt?: Date;
}

/**
 * Bot analytics query parameters
 */
export interface BotAnalyticsQuery {
    chatType?: ChatType;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Bot analytics result
 */
export interface BotAnalyticsResult {
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
 * Create bot message input
 */
export interface CreateBotMessageInput {
    chatType: ChatType;
    messageKey: string;
    content: string;
    contentBn: string;
    stepNumber: number;
    displayOrder?: number;
}

/**
 * Update bot message input
 */
export interface UpdateBotMessageInput {
    content?: string;
    contentBn?: string;
    stepNumber?: number;
    isActive?: boolean;
    displayOrder?: number;
}

/**
 * Update trigger rules input
 */
export interface UpdateTriggerRulesInput {
    isEnabled?: boolean;
    reactivationThreshold?: number;
    resetStepsOnReactivate?: boolean;
}
