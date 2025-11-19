// Export all services
export { authService } from './authService';
export { userManagementService } from './userManagementService';
export { complaintService } from './complaintService';
export { analyticsService } from './analyticsService';
export { chatService } from './chatService';
export { translationService } from './translationService';
export { categoryService } from './categoryService';

// Export service types
export type {
    ComplaintStatus,
    Complaint,
    ComplaintDetails,
    StatusHistoryEntry,
    ComplaintFilters,
    ComplaintStats,
    GetComplaintsResponse,
    GetComplaintByIdResponse,
    UpdateComplaintStatusRequest,
    UpdateComplaintStatusResponse,
    ApiError,
} from '../types/complaint-service.types';

export type {
    AnalyticsData,
    TrendData,
    AnalyticsQuery,
    GetAnalyticsResponse,
    GetTrendsResponse,
} from '../types/analytics-service.types';

export type {
    SenderType,
    ChatMessage,
    SendMessageRequest,
    GetChatMessagesResponse,
    SendMessageResponse,
    MarkAsReadResponse,
} from '../types/chat-service.types';

export type {
    ChatConversation,
    ChatFilters,
    ChatStatistics,
    ChatCitizen,
    LastMessage,
    MessageBubbleProps,
    GetChatConversationsResponse,
    GetChatStatisticsResponse,
    ChatComplaintDetails,
    StatisticsByCategory,
} from '../types/chat-page.types';

export type {
    CategoryItem,
    SubcategoryItem,
    CategoryStatistic,
    SubcategoryStatistic,
    CategoryTrendDataPoint,
    CategoryMetadata,
    CategoryStatisticsQuery,
    CategoryTrendsQuery,
    GetCategoriesResponse,
    GetCategoryResponse,
    GetSubcategoriesResponse,
    GetCategoryStatisticsResponse,
    GetCategoryTrendsResponse,
} from '../types/category-service.types';
