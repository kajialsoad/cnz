// Chat Service Types

export type SenderType = 'ADMIN' | 'CITIZEN' | 'BOT';

export interface ChatMessage {
    id: number;
    complaintId: number;
    senderId: number;
    senderType: SenderType;
    senderName?: string;
    senderRole?: string;
    message: string;
    imageUrl?: string;
    voiceUrl?: string;
    read: boolean;
    createdAt: string;
}

export interface SendMessageRequest {
    message: string;
    imageUrl?: string;
    voiceUrl?: string;
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
        botMessage?: ChatMessage | null;
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
