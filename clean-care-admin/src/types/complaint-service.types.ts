// Complaint Service Types
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Complaint {
    id: number;
    complaintId: string; // Display ID (e.g., C001234)
    title: string;
    description: string;
    category: string;
    priority: number;
    status: ComplaintStatus;
    location: string; // Formatted location string
    locationDetails?: {
        address: string;
        district: string;
        thana: string;
        ward: string;
        latitude?: number;
        longitude?: number;
    };
    imageUrl?: string; // JSON string of image URLs
    audioUrl?: string; // JSON string of audio URLs
    imageUrls: string[];
    audioUrls: string[];
    userId: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
    timeAgo?: string; // Computed field
}

export interface ComplaintDetails extends Complaint {
    statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
    id: number;
    complaintId: number;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
    changedBy: number;
    note?: string;
    createdAt: string;
}

export interface ComplaintFilters {
    search?: string;
    status?: ComplaintStatus | 'ALL';
    category?: string;
    ward?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority';
    sortOrder?: 'asc' | 'desc';
}

export interface ComplaintStats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface GetComplaintsResponse {
    complaints: Complaint[];
    pagination: PaginationInfo;
    statusCounts: ComplaintStats;
}

export interface GetComplaintByIdResponse {
    complaint: ComplaintDetails;
}

export interface UpdateComplaintStatusRequest {
    status: ComplaintStatus;
    note?: string;
}

export interface UpdateComplaintStatusResponse {
    success: boolean;
    message: string;
    data: {
        complaint: Complaint;
    };
}

// Custom API Error class
// Custom API Error interface
export interface ApiError {
    name: string;
    statusCode: number;
    message: string;
    errors?: any;
}
