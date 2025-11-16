// Chat Service Types

export type SenderType = 'ADMIN' | 'CITIZEN';

export interface ChatMessage {
    id: number;
    complaintId: number;
    senderId: number;
    senderType: SenderType;
    senderName?: string;
    message: string;
    imageUrl?: string;
    read: boolean;
    createdAt: string;
}

export interface SendMessageRequest {
    message: string;
    imageUrl?: string;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface GetChatMessagesResponse {
    success: boolean;
    data: {
        messages: ChatMessage[];
        pagination: PaginationInfo;
    };
}

export interface SendMessageResponse {
    success: boolean;
    data: {
        message: ChatMessage;
    };
}

export interface MarkAsReadResponse {
    success: boolean;
    message: string;
}

export interface UnreadCountResponse {
    success: boolean;
    data: {
        unreadCount: number;
    };
}
