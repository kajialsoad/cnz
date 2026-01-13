// User roles
export const UserRole = {
    CUSTOMER: 'CUSTOMER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    MASTER_ADMIN: 'MASTER_ADMIN',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// User status
export const UserStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    PENDING: 'PENDING',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// Complaint status
export const ComplaintStatus = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    RESOLVED: 'RESOLVED',
    REJECTED: 'REJECTED',
} as const;

export type ComplaintStatus = typeof ComplaintStatus[keyof typeof ComplaintStatus];

// User statistics
export interface UserStatistics {
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
}

// City Corporation info
export interface CityCorporationInfo {
    code: string;
    name: string;
}

// Zone info
export interface ZoneInfo {
    id: number;
    zoneNumber: number;
    name?: string;
    officerName?: string | null;
    officerPhone?: string | null;
}

// Ward info
export interface WardInfo {
    id: number;
    wardNumber: number;
    inspectorName?: string | null;
    inspectorPhone?: string | null;
}

// User with statistics
export interface UserWithStats {
    id: number;
    email: string | null;
    phone: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    designation?: string | null;
    address: string | null;
    joiningDate?: string | null;
    whatsapp?: string | null;
    role: UserRole;
    passwordHash?: string;
    visiblePassword?: string;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    statistics: UserStatistics;
    cityCorporation?: CityCorporationInfo;
    zone?: ZoneInfo;
    ward?: WardInfo;
    cityCorporationCode?: string | null;
    zoneId?: number | null;
    wardId?: number | null;
    permissions?: Permissions | null;
    extraWards?: WardInfo[];
}

// Pagination
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// Query parameters for getting users
export interface GetUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    role?: UserRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    cityCorporationCode?: string;
    zoneId?: number;
    wardId?: number;
}

// Get users response
export interface GetUsersResponse {
    users: UserWithStats[];
    pagination: Pagination;
}

// Complaint summary
export interface ComplaintSummary {
    id: number;
    title: string;
    status: ComplaintStatus;
    priority: number;
    createdAt: string;
    updatedAt: string;
}

// Get user response
export interface GetUserResponse {
    user: UserWithStats;
    recentComplaints: ComplaintSummary[];
}

// User statistics response
export interface UserStatisticsResponse {
    totalCitizens: number;
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    successRate: number;
    activeUsers: number;
    newUsersThisMonth: number;
    statusBreakdown: {
        active: number;
        inactive: number;
        suspended: number;
        pending: number;
    };
}

// Create user DTO
export interface CreateUserDto {
    firstName: string;
    lastName: string;
    designation?: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    joiningDate?: string;
    password: string;
    cityCorporationCode?: string;
    thanaId?: number;
    zoneId?: number;
    wardId?: number;
    ward?: string;
    zone?: string;
    address?: string;
    role?: UserRole;
    permissions?: any;
}

// Update user DTO
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    designation?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    joiningDate?: string;
    cityCorporationCode?: string;
    thanaId?: number;
    ward?: string;
    zone?: string;
    address?: string;
    role?: UserRole;
    status?: UserStatus;
    password?: string;
    zoneId?: number;
    wardId?: number;
    avatar?: string;
    permissions?: Permissions;
}

// Update status DTO
export interface UpdateStatusDto {
    status: UserStatus;
    reason?: string;
}

// Create user response
export interface CreateUserResponse {
    success: boolean;
    message: string;
    data: {
        user: UserWithStats;
    };
}

// Update user response
export interface UpdateUserResponse {
    success: boolean;
    message: string;
    data: {
        user: UserWithStats;
    };
}

// Update status response
export interface UpdateStatusResponse {
    success: boolean;
    message: string;
    data: {
        user: UserWithStats;
    };
}

// Form data types
export interface CreateUserFormData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
    ward: string;
    zone: string;
    address: string;
    role: UserRole;
}

export interface UpdateUserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    ward: string;
    zone: string;
    address: string;
    role: UserRole;
    status: UserStatus;
}

// Filter types
export interface UserFilters {
    search: string;
    status: UserStatus | 'ALL';
    role: UserRole | 'ALL';
}

// Permissions Interface
export interface PermissionFeatures {
    // Complaint Management
    canViewComplaints: boolean;
    canApproveComplaints: boolean;
    canRejectComplaints: boolean;
    canMarkComplaintsPending: boolean;
    canEditComplaints: boolean;
    canDeleteComplaints: boolean;

    // User Management
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canAddUsers: boolean;

    // Admin Management
    canViewAdmins: boolean;
    canEditAdmins: boolean;
    canDeleteAdmins: boolean;
    canAddAdmins: boolean;

    // Messaging
    canViewMessages: boolean;
    canSendMessagesToUsers: boolean;
    canSendMessagesToAdmins: boolean;

    // Analytics & Reports
    canViewAnalytics: boolean;
    canExportData: boolean;
    canDownloadReports: boolean;

    // View Only Mode
    viewOnlyMode: boolean;

    // Granular Access
    canViewComplainantProfile: boolean;
    canViewAreaStats: boolean;
    canViewOwnPerformance: boolean;
    canShowReviews: boolean;
}

export interface Permissions {
    zones: number[];
    wards: number[];
    categories: string[];
    features: PermissionFeatures;
}
