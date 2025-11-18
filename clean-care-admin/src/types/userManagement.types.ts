// User roles
export const UserRole = {
    CUSTOMER: 'CUSTOMER',
    SERVICE_PROVIDER: 'SERVICE_PROVIDER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
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

// User with statistics
export interface UserWithStats {
    id: number;
    email: string | null;
    phone: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    ward: string | null;
    zone: string | null;
    address: string | null;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    statistics: UserStatistics;
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
    phone: string;
    email?: string;
    password: string;
    ward?: string;
    zone?: string;
    address?: string;
    role?: UserRole;
}

// Update user DTO
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    ward?: string;
    zone?: string;
    address?: string;
    role?: UserRole;
    status?: UserStatus;
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
