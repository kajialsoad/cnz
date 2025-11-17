// Chat Page Specific Types
import type { ComplaintStatus } from './complaint-service.types';
import type { ChatMessage, SenderType } from './chat-service.types';

/**
 * Citizen information in chat context
 */
export interface ChatCitizen {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    district: string;
    upazila: string;
    ward: string;
    zone: string;
    address: string;
    profilePicture?: string;
}

/**
 * Last message in a chat conversation
 */
export interface LastMessage {
    id: number;
    text: string;
    timestamp: Date;
    senderType: SenderType;
}

/**
 * Chat conversation item for the chat list
 */
export interface ChatConversation {
    complaintId: number;
    trackingNumber: string;
    complaintTitle: string;
    complaintCategory: string;
    complaintStatus: ComplaintStatus;
    complaintCreatedAt: Date;
    citizen: ChatCitizen;
    lastMessage: LastMessage;
    unreadCount: number;
    totalMessages: number;
    isNew: boolean; // Never opened by admin
    lastActivity: Date;
}

/**
 * Filters for chat list
 */
export interface ChatFilters {
    search?: string;
    district?: string;
    upazila?: string;
    ward?: string;
    zone?: string;
    status?: ComplaintStatus;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
}

/**
 * Statistics by location or status
 */
export interface StatisticsByCategory {
    category: string;
    count: number;
}

/**
 * Chat statistics for the chat page
 */
export interface ChatStatistics {
    totalChats: number;
    unreadCount: number;
    byDistrict: StatisticsByCategory[];
    byUpazila: StatisticsByCategory[];
    byWard: StatisticsByCategory[];
    byZone: StatisticsByCategory[];
    byStatus: { status: ComplaintStatus; count: number }[];
}

/**
 * Props for MessageBubble component
 */
export interface MessageBubbleProps {
    message: ChatMessage;
    isAdmin: boolean;
    showSenderName?: boolean;
}

/**
 * Response from getChatConversations API
 */
export interface GetChatConversationsResponse {
    success: boolean;
    data: {
        chats: ChatConversation[];
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
}

/**
 * Response from getChatStatistics API
 */
export interface GetChatStatisticsResponse {
    success: boolean;
    data: ChatStatistics;
}

/**
 * Complete complaint details for chat header
 */
export interface ChatComplaintDetails {
    id: number;
    trackingNumber: string;
    title: string;
    category: string;
    status: ComplaintStatus;
    createdAt: Date;
    description?: string;
    location?: string;
}

