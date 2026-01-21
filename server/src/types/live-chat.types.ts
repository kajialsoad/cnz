import { ChatMessageType, SenderType } from '@prisma/client';

/**
 * Live Chat Message
 * Represents a message in the live chat system
 */
export interface LiveChatMessage {
    id: number;
    content: string;
    type: ChatMessageType;
    fileUrl?: string | null;
    voiceUrl?: string | null;
    senderId: number;
    receiverId: number;
    senderType: SenderType;
    isRead: boolean;
    createdAt: Date;
    sender?: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        role: string;
    };
    receiver?: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        role: string;
    };
}

/**
 * User Conversation
 * Represents a conversation between a user and admin
 */
export interface UserConversation {
    user: {
        id: number;
        firstName: string;
        lastName: string;
        avatar?: string | null;
        phone?: string | null;
        ward?: {
            id: number;
            number: string;
            wardNumber?: string | null;
        } | null;
        zone?: {
            id: number;
            number: string;
            name?: string | null;
        } | null;
    };
    lastMessage?: LiveChatMessage | null;
    unreadCount: number;
}

/**
 * Live Chat Filters
 * Filters for querying live chat conversations
 */
export interface LiveChatFilters {
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
    unreadOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

/**
 * Chat Statistics
 * Statistics for admin dashboard
 */
export interface ChatStatistics {
    totalConversations: number;
    unreadMessages: number;
    todayMessages: number;
}

/**
 * Admin Info
 * Information about the assigned admin
 */
export interface AdminInfo {
    id: number;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    role: string;
    designation?: string | null;
    phone?: string | null;
    ward?: {
        id: number;
        number: string;
        wardNumber?: string | null;
    } | null;
    zone?: {
        id: number;
        number: string;
        name?: string | null;
    } | null;
}

/**
 * Messages Response
 * Response format for message queries
 */
export interface MessagesResponse {
    messages: LiveChatMessage[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Conversations Response
 * Response format for conversation queries
 */
export interface ConversationsResponse {
    conversations: UserConversation[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

/**
 * Send Message Input
 * Input for sending a message
 */
export interface SendMessageInput {
    content: string;
    type?: ChatMessageType;
    fileUrl?: string;
    voiceUrl?: string;
}

/**
 * Pagination Query
 * Query parameters for pagination
 */
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
