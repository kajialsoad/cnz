export interface NotificationMetadata {
  resolutionImages?: string[];
  resolutionNote?: string;
  othersCategory?: string;
  othersSubcategory?: string;
  adminName?: string;
}

export interface Notification {
  id: number;
  userId: number;
  complaintId: number;
  title: string;
  message: string;
  type: string;
  statusChange: string | null;
  metadata?: NotificationMetadata | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  complaint?: {
    id: number;
    title: string;
    status: string;
  } | null;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  unreadCount: number;
}