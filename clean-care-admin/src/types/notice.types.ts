// Notice Types for Admin Panel

export enum NoticeType {
    GENERAL = 'GENERAL',
    URGENT = 'URGENT',
    EVENT = 'EVENT',
    SCHEDULED = 'SCHEDULED',
}

export enum NoticePriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export interface NoticeCategory {
    id: number;
    name: string;
    nameBn?: string;
    color: string;
    icon?: string;
    parentId?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    children?: NoticeCategory[];
}

export interface Notice {
    id: number;
    title: string;
    titleBn?: string;
    description: string;
    descriptionBn?: string;
    content: string;
    contentBn?: string;
    categoryId: number;
    category?: NoticeCategory;
    type: NoticeType;
    priority: NoticePriority;
    isActive: boolean;
    publishDate: string;
    expiryDate?: string;
    imageUrl?: string;
    attachments?: any;
    targetZones?: number[];
    targetWards?: number[];
    targetCities?: number[];
    viewCount: number;
    readCount: number;
    displayOrder: number;
    createdBy: number;
    creator?: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
    };
    interactions?: {
        counts: {
            LIKE?: number;
            LOVE?: number;
            RSVP_YES?: number;
            RSVP_NO?: number;
            RSVP_MAYBE?: number;
        };
        userInteractions: string[];
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateNoticeDTO {
    title: string;
    titleBn?: string;
    description: string;
    descriptionBn?: string;
    content: string;
    contentBn?: string;
    categoryId: number;
    type?: NoticeType;
    priority?: NoticePriority;
    publishDate?: string;
    expiryDate?: string;
    imageUrl?: string;
    attachments?: any;
    targetZones?: number[];
    targetWards?: number[];
    targetCities?: number[];
}

export interface UpdateNoticeDTO extends Partial<CreateNoticeDTO> {
    isActive?: boolean;
}

export interface NoticeFilters {
    categoryId?: number;
    type?: NoticeType;
    priority?: NoticePriority;
    isActive?: boolean;
    search?: string;
}

export interface NoticeListResponse {
    notices: Notice[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface NoticeAnalytics {
    totalNotices: number;
    activeNotices: number;
    expiredNotices: number;
    urgentNotices: number;
    totalViews: number;
    totalReads: number;
    categoryStats: Array<{
        categoryId: number;
        _count: number;
        _sum: {
            viewCount: number;
            readCount: number;
        };
    }>;
}
