// Complaint Service Types
export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'OTHERS';

export interface Complaint {
    id: number;
    complaintId: string; // Display ID (e.g., C001234)
    title: string;
    description: string;
    category: string; // Category ID (e.g., 'home', 'road_environment')
    subcategory: string; // Subcategory ID (e.g., 'not_collecting_waste')
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
    resolutionNote?: string | null; // Admin's resolution note
    resolutionImages?: string | null; // Resolution proof images (comma-separated URLs)
    review?: {
        rating: number;
        comment?: string;
    } | null;
    othersCategory?: string | null; // "CORPORATION_INTERNAL" or "CORPORATION_EXTERNAL"
    othersSubcategory?: string | null; // Specific department/agency
    userId: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        zone?: string | { id: number; name: string; zoneNumber?: number } | null;
        ward?: string | { id: number; wardNumber: number; number?: number } | null;
        address?: string | null;
        cityCorporation?: {
            code: string;
            name: string;
        } | null;
        thana?: {
            id: number;
            name: string;
        } | null;
        avatar?: string | null;
    };
    // Complaint's direct relations (from backend)
    wards?: {
        id: number;
        number?: number;
        wardNumber?: number;
        displayName?: string;
        inspectorName?: string | null;
        inspectorPhone?: string | null;
    } | null;
    zone?: {
        id: number;
        zoneNumber?: number;
        name?: string;
        displayName?: string;
        officerName?: string | null;
        officerPhone?: string | null;
    } | null;
    cityCorporation?: {
        id: number;
        code: string;
        name: string;
        nameBangla?: string;
    } | null;
    assignedAdmin?: {
        id: number;
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
    } | null;
    trackingNumber?: string;
    createdAt: string;
    updatedAt: string;
    timeAgo?: string; // Computed field
}

export interface ComplaintDetails extends Complaint {
    statusHistory?: StatusHistoryEntry[];
    reviews?: Array<{
        id: number;
        rating: number;
        comment?: string | null;
        createdAt: string;
        user?: {
            id: number;
            firstName: string;
            lastName: string;
            avatar?: string | null;
        };
    }>;
}

export interface StatusHistoryEntry {
    id: number;
    complaintId: number;
    oldStatus: ComplaintStatus;
    newStatus: ComplaintStatus;
    changedBy: number;
    note?: string;
    createdAt: string;
    changer?: {
        role: string;
        firstName?: string;
        lastName?: string;
        name: string;
    };
}

/**
 * Filters for querying complaints
 */
export interface ComplaintFilters {
    /** Search term to filter by title, description, or tracking number */
    search?: string;
    /** Filter by complaint status (PENDING, IN_PROGRESS, RESOLVED, REJECTED, or ALL) */
    status?: ComplaintStatus | 'ALL';
    /** Filter by category ID (e.g., 'home', 'road_environment', 'business') */
    category?: string;
    /** Filter by subcategory ID (e.g., 'not_collecting_waste', 'worker_behavior') */
    subcategory?: string;
    /** Filter by city corporation code (e.g., 'DSCC', 'DNCC') */
    cityCorporationCode?: string;
    /** Filter by zone ID */
    zoneId?: number;
    /** Filter by ward ID */
    wardId?: number;
    /** Filter by ward number (Legacy) */
    ward?: string;
    /** Filter by thana ID */
    thanaId?: number;
    /** Filter complaints created after this date (ISO 8601 format) */
    startDate?: string;
    /** Filter complaints created before this date (ISO 8601 format) */
    endDate?: string;
    /** Field to sort by */
    sortBy?: 'createdAt' | 'updatedAt' | 'priority';
    /** Sort order (ascending or descending) */
    sortOrder?: 'asc' | 'desc';
    /** Filter by complaint's city corporation code (not user's profile) */
    complaintCityCorporationCode?: string;
    /** Filter by complaint's zone ID (not user's profile) */
    complaintZoneId?: number;
    /** Filter by complaint's ward ID (not user's profile) */
    complaintWardId?: number;
}

export interface ComplaintStats {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    others: number;
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
    note?: string; // For rejection or resolution notes
    resolutionImages?: string; // Comma separated URLs
    resolutionImageFiles?: File[]; // For new uploads
    resolutionNote?: string;
    category?: string;
    subcategory?: string;
    adminId?: number;
}

export interface MarkOthersRequest {
    othersCategory: string;
    othersSubcategory: string;
    note?: string;
    images?: File[];
    adminId?: number;
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
