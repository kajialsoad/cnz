/**
 * Bot Message Service
 * 
 * Handles all bot message logic including:
 * - Bot trigger detection
 * - Conversation state management
 * - Bot message retrieval
 * - Analytics tracking
 */

import { PrismaClient, ChatType } from '@prisma/client';
import {
    BotMessage,
    BotTriggerRule,
    BotConversationState,
    ShouldTriggerBotInput,
    ShouldTriggerBotResult,
    HandleAdminReplyInput,
    HandleUserMessageInput,
    CreateConversationStateInput,
    UpdateConversationStateInput,
    BotAnalyticsQuery,
    BotAnalyticsResult,
    CreateBotMessageInput,
    UpdateBotMessageInput,
    UpdateTriggerRulesInput
} from '../types/bot-message.types';

const prisma = new PrismaClient();

export class BotMessageService {
    /**
     * Check if bot should send a message
     * Called after every user message
     * 
     * @param input - Chat type, conversation ID, and admin reply status
     * @returns Whether bot should send, the message, and step number
     */
    async shouldTriggerBot(input: ShouldTriggerBotInput): Promise<ShouldTriggerBotResult> {
        try {
            // 1. Get trigger rules for this chat type
            const rules = await this.getTriggerRules(input.chatType);

            if (!rules || !rules.isEnabled) {
                return { shouldSend: false };
            }

            // 2. Get or create conversation state
            let state = await this.getConversationState(input.chatType, input.conversationId);

            if (!state) {
                state = await this.createConversationState({
                    chatType: input.chatType,
                    conversationId: input.conversationId
                });
            }

            // 3. Determine if bot should send based on admin reply status
            if (!input.hasAdminReplied) {
                // Case 1: Admin hasn't replied yet - send next bot step
                const nextStep = state.currentStep + 1;
                const botMessage = await this.getBotMessageByStep(input.chatType, nextStep);

                if (botMessage) {
                    // Update state
                    await this.updateConversationState(state.id, {
                        currentStep: nextStep,
                        lastBotMessageAt: new Date()
                    });

                    // Track analytics
                    await this.trackBotTrigger(input.chatType, botMessage.messageKey, nextStep);

                    return {
                        shouldSend: true,
                        botMessage,
                        step: nextStep
                    };
                }
            } else {
                // Case 2 & 3: Admin has replied - check if bot should reactivate
                // Re-fetch state to ensure we have the latest userMessageCount
                const freshState = await this.getConversationState(input.chatType, input.conversationId);

                if (!freshState) {
                    console.log(`[BOT] shouldTriggerBot: No fresh state found for conversation ${input.conversationId}`);
                    return { shouldSend: false };
                }

                const userMessagesSinceReply = freshState.userMessageCount;
                console.log(`[BOT] shouldTriggerBot: Admin has replied. userMessageCount=${userMessagesSinceReply}, threshold=${rules.reactivationThreshold}, isActive=${freshState.isActive}`);

                if (userMessagesSinceReply >= rules.reactivationThreshold) {
                    console.log(`[BOT] shouldTriggerBot: Threshold reached! Reactivating bot...`);
                    // Reactivate bot
                    let nextStep = rules.resetStepsOnReactivate ? 1 : freshState.currentStep + 1;
                    let botMessage = await this.getBotMessageByStep(input.chatType, nextStep);

                    // If no message found for next step, reset to step 1
                    if (!botMessage && nextStep > 1) {
                        console.log(`[BOT] shouldTriggerBot: No message for step ${nextStep}, resetting to step 1`);
                        nextStep = 1;
                        botMessage = await this.getBotMessageByStep(input.chatType, nextStep);
                    }

                    if (botMessage) {
                        await this.updateConversationState(freshState.id, {
                            currentStep: nextStep,
                            isActive: true,
                            userMessageCount: 0, // Reset counter
                            lastBotMessageAt: new Date()
                        });

                        // Track analytics
                        await this.trackBotTrigger(input.chatType, botMessage.messageKey, nextStep);

                        console.log(`[BOT] shouldTriggerBot: Bot reactivated! Sending step ${nextStep}`);
                        return {
                            shouldSend: true,
                            botMessage,
                            step: nextStep
                        };
                    } else {
                        console.log(`[BOT] shouldTriggerBot: No bot message found for step ${nextStep}`);
                    }
                } else {
                    console.log(`[BOT] shouldTriggerBot: Threshold not reached yet (${userMessagesSinceReply}/${rules.reactivationThreshold})`);
                }
            }

            return { shouldSend: false };
        } catch (error) {
            console.error('Error in shouldTriggerBot:', error);
            throw new Error(`Failed to check bot trigger: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle admin reply
     * Deactivates bot for this conversation
     * 
     * @param input - Chat type and conversation ID
     */
    async handleAdminReply(input: HandleAdminReplyInput): Promise<void> {
        try {
            const state = await this.getConversationState(input.chatType, input.conversationId);

            if (state) {
                await this.updateConversationState(state.id, {
                    isActive: false,
                    lastAdminReplyAt: new Date(),
                    userMessageCount: 0
                });

                // Track admin reply in analytics
                await this.trackAdminReply(input.chatType, state.currentStep);
            }
        } catch (error) {
            console.error('Error in handleAdminReply:', error);
            throw new Error(`Failed to handle admin reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Handle user message
     * Increments counter if bot is inactive (admin has replied)
     * 
     * @param input - Chat type and conversation ID
     */
    async handleUserMessage(input: HandleUserMessageInput): Promise<void> {
        try {
            const state = await this.getConversationState(input.chatType, input.conversationId);

            if (state && !state.isActive) {
                // Bot is inactive, increment counter
                const newCount = state.userMessageCount + 1;
                console.log(`[BOT] handleUserMessage: Incrementing counter from ${state.userMessageCount} to ${newCount} for conversation ${input.conversationId}`);

                await this.updateConversationState(state.id, {
                    userMessageCount: newCount
                });
            } else if (state) {
                console.log(`[BOT] handleUserMessage: Bot is active (${state.isActive}), not incrementing counter for conversation ${input.conversationId}`);
            } else {
                console.log(`[BOT] handleUserMessage: No state found for conversation ${input.conversationId}`);
            }
        } catch (error) {
            console.error('Error in handleUserMessage:', error);
            throw new Error(`Failed to handle user message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get bot message by step number
     * 
     * @param chatType - Type of chat (LIVE_CHAT or COMPLAINT_CHAT)
     * @param stepNumber - Step number to retrieve
     * @returns Bot message or null if not found
     */
    async getBotMessageByStep(chatType: ChatType, stepNumber: number): Promise<BotMessage | null> {
        try {
            const message = await prisma.botMessageConfig.findFirst({
                where: {
                    chatType,
                    stepNumber,
                    isActive: true
                },
                orderBy: {
                    displayOrder: 'asc'
                }
            });

            return message;
        } catch (error) {
            console.error('Error in getBotMessageByStep:', error);
            throw new Error(`Failed to get bot message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get conversation state
     * 
     * @param chatType - Type of chat
     * @param conversationId - Unique conversation identifier
     * @returns Conversation state or null if not found
     */
    async getConversationState(
        chatType: ChatType,
        conversationId: string
    ): Promise<BotConversationState | null> {
        try {
            const state = await prisma.botConversationState.findUnique({
                where: {
                    chatType_conversationId: {
                        chatType,
                        conversationId
                    }
                }
            });

            return state;
        } catch (error) {
            console.error('Error in getConversationState:', error);
            throw new Error(`Failed to get conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create conversation state
     * 
     * @param input - Chat type and conversation ID
     * @returns Created conversation state
     */
    async createConversationState(
        input: CreateConversationStateInput
    ): Promise<BotConversationState> {
        try {
            const state = await prisma.botConversationState.create({
                data: {
                    chatType: input.chatType,
                    conversationId: input.conversationId,
                    currentStep: 0,
                    isActive: true,
                    userMessageCount: 0
                }
            });

            return state;
        } catch (error) {
            console.error('Error in createConversationState:', error);
            throw new Error(`Failed to create conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update conversation state
     * 
     * @param stateId - State ID to update
     * @param input - Fields to update
     * @returns Updated conversation state
     */
    async updateConversationState(
        stateId: number,
        input: UpdateConversationStateInput
    ): Promise<BotConversationState> {
        try {
            const state = await prisma.botConversationState.update({
                where: { id: stateId },
                data: input
            });

            return state;
        } catch (error) {
            console.error('Error in updateConversationState:', error);
            throw new Error(`Failed to update conversation state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get trigger rules for a chat type
     * 
     * @param chatType - Type of chat
     * @returns Trigger rules or null if not found
     */
    async getTriggerRules(chatType: ChatType): Promise<BotTriggerRule | null> {
        try {
            const rules = await prisma.botTriggerRule.findUnique({
                where: { chatType }
            });

            return rules;
        } catch (error) {
            console.error('Error in getTriggerRules:', error);
            throw new Error(`Failed to get trigger rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update trigger rules
     * 
     * @param chatType - Type of chat
     * @param input - Fields to update
     * @returns Updated trigger rules
     */
    async updateTriggerRules(
        chatType: ChatType,
        input: UpdateTriggerRulesInput
    ): Promise<BotTriggerRule> {
        try {
            const rules = await prisma.botTriggerRule.upsert({
                where: { chatType },
                update: input,
                create: {
                    chatType,
                    isEnabled: input.isEnabled ?? true,
                    reactivationThreshold: input.reactivationThreshold ?? 5,
                    resetStepsOnReactivate: input.resetStepsOnReactivate ?? false
                }
            });

            return rules;
        } catch (error) {
            console.error('Error in updateTriggerRules:', error);
            throw new Error(`Failed to update trigger rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get all bot messages for a chat type
     * 
     * @param chatType - Type of chat
     * @returns Array of bot messages
     */
    async getBotMessages(chatType: ChatType): Promise<BotMessage[]> {
        try {
            const messages = await prisma.botMessageConfig.findMany({
                where: { chatType },
                orderBy: [
                    { displayOrder: 'asc' },
                    { stepNumber: 'asc' }
                ]
            });

            return messages;
        } catch (error) {
            console.error('Error in getBotMessages:', error);
            throw new Error(`Failed to get bot messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Create bot message
     * 
     * @param input - Bot message data
     * @returns Created bot message
     */
    async createBotMessage(input: CreateBotMessageInput): Promise<BotMessage> {
        try {
            const message = await prisma.botMessageConfig.create({
                data: {
                    chatType: input.chatType,
                    messageKey: input.messageKey,
                    content: input.content,
                    contentBn: input.contentBn,
                    stepNumber: input.stepNumber,
                    displayOrder: input.displayOrder ?? input.stepNumber,
                    isActive: true
                }
            });

            return message;
        } catch (error) {
            console.error('Error in createBotMessage:', error);
            throw new Error(`Failed to create bot message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update bot message
     * 
     * @param messageId - Message ID to update
     * @param input - Fields to update
     * @returns Updated bot message
     */
    async updateBotMessage(
        messageId: number,
        input: UpdateBotMessageInput
    ): Promise<BotMessage> {
        try {
            const message = await prisma.botMessageConfig.update({
                where: { id: messageId },
                data: input
            });

            return message;
        } catch (error) {
            console.error('Error in updateBotMessage:', error);
            throw new Error(`Failed to update bot message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete bot message
     * 
     * @param messageId - Message ID to delete
     */
    async deleteBotMessage(messageId: number): Promise<void> {
        try {
            await prisma.botMessageConfig.delete({
                where: { id: messageId }
            });
        } catch (error) {
            console.error('Error in deleteBotMessage:', error);
            throw new Error(`Failed to delete bot message: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Track bot trigger in analytics
     * 
     * @param chatType - Type of chat
     * @param messageKey - Message key
     * @param stepNumber - Step number
     */
    private async trackBotTrigger(
        chatType: ChatType,
        messageKey: string,
        stepNumber: number
    ): Promise<void> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find existing analytics record for today
            const existing = await prisma.botMessageAnalytics.findFirst({
                where: {
                    chatType,
                    messageKey,
                    date: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (existing) {
                // Update existing record
                await prisma.botMessageAnalytics.update({
                    where: { id: existing.id },
                    data: {
                        triggerCount: {
                            increment: 1
                        }
                    }
                });
            } else {
                // Create new record
                await prisma.botMessageAnalytics.create({
                    data: {
                        chatType,
                        messageKey,
                        stepNumber,
                        triggerCount: 1,
                        adminReplyCount: 0,
                        date: today
                    }
                });
            }
        } catch (error) {
            console.error('Error tracking bot trigger:', error);
            // Don't throw - analytics failure shouldn't break bot functionality
        }
    }

    /**
     * Track admin reply in analytics
     * 
     * @param chatType - Type of chat
     * @param currentStep - Current bot step when admin replied
     */
    private async trackAdminReply(chatType: ChatType, currentStep: number): Promise<void> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find the analytics record for the current step
            const analytics = await prisma.botMessageAnalytics.findFirst({
                where: {
                    chatType,
                    stepNumber: currentStep,
                    date: today
                }
            });

            if (analytics) {
                await prisma.botMessageAnalytics.update({
                    where: { id: analytics.id },
                    data: {
                        adminReplyCount: {
                            increment: 1
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error tracking admin reply:', error);
            // Don't throw - analytics failure shouldn't break bot functionality
        }
    }

    /**
     * Get bot analytics
     * 
     * @param query - Analytics query parameters
     * @returns Analytics result
     */
    async getBotAnalytics(query: BotAnalyticsQuery): Promise<BotAnalyticsResult> {
        try {
            const where: any = {};

            if (query.chatType) {
                where.chatType = query.chatType;
            }

            if (query.startDate || query.endDate) {
                where.date = {};
                if (query.startDate) {
                    where.date.gte = query.startDate;
                }
                if (query.endDate) {
                    where.date.lte = query.endDate;
                }
            }

            const analytics = await prisma.botMessageAnalytics.findMany({
                where
            });

            // Calculate aggregated metrics
            const totalTriggers = analytics.reduce((sum, a) => sum + a.triggerCount, 0);
            const totalReplies = analytics.reduce((sum, a) => sum + a.adminReplyCount, 0);
            const adminReplyRate = totalTriggers > 0 ? totalReplies / totalTriggers : 0;

            // Calculate average response time (if available)
            const avgResponseTimes = analytics
                .filter(a => a.avgResponseTime !== null)
                .map(a => a.avgResponseTime as number);
            const avgResponseTime = avgResponseTimes.length > 0
                ? avgResponseTimes.reduce((sum, t) => sum + t, 0) / avgResponseTimes.length
                : 0;

            // Group by step
            const stepMap = new Map<number, { triggers: number; replies: number }>();
            analytics.forEach(a => {
                const existing = stepMap.get(a.stepNumber) || { triggers: 0, replies: 0 };
                stepMap.set(a.stepNumber, {
                    triggers: existing.triggers + a.triggerCount,
                    replies: existing.replies + a.adminReplyCount
                });
            });

            const stepBreakdown = Array.from(stepMap.entries())
                .map(([step, data]) => ({
                    step,
                    triggers: data.triggers,
                    replies: data.replies
                }))
                .sort((a, b) => a.step - b.step);

            return {
                totalTriggers,
                adminReplyRate,
                avgResponseTime,
                stepBreakdown
            };
        } catch (error) {
            console.error('Error in getBotAnalytics:', error);
            throw new Error(`Failed to get bot analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

// Export singleton instance
export const botMessageService = new BotMessageService();
