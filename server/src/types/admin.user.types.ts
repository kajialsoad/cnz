import { users_role, UserStatus, Complaint_status } from '@prisma/client';

// Query interfaces
export interface GetUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    role?: users_role;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

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
    role: users_role;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    statistics: UserStatistics;
}

// Pagination
export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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
    status: Complaint_status;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
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
    role?: users_role;
    permissions?: any;
}

// Update user DTO
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    ward?: string;
    zone?: string;
    role?: users_role;
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
    user: UserWithStats;
}

// Update user response
export interface UpdateUserResponse {
    success: boolean;
    message: string;
    user: UserWithStats;
}

// Update status response
export interface UpdateStatusResponse {
    success: boolean;
    message: string;
    user: UserWithStats;
}

// Error response
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}

// Error codes
export enum ErrorCode {
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    DUPLICATE_PHONE = 'DUPLICATE_PHONE',
    DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
    INVALID_INPUT = 'INVALID_INPUT',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
}
