
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import { UserRole, UserStatus } from '../types/userManagement.types';
import { handleApiError } from '../utils/errorHandler';

export interface SuperAdminPermissions {
    zones?: number[];
    wards?: number[];
    categories?: string[];
    features?: {
        // View Only Mode - শুধু দেখতে পারবে, কোনো action নিতে পারবে না
        viewOnlyMode?: boolean;

        // Individual Permissions (only active if viewOnlyMode is false)
        chat?: boolean;
        reports?: 'view_only' | 'download' | 'none';
        customerProfile?: boolean;
        reviews?: boolean;
        messaging?: boolean;
        complaintManagement?: boolean; // Can view complaints
        complaintApproval?: boolean; // Can approve/disapprove complaints
        adminManagement?: boolean; // Can manage Ward Admins
    };
}

export interface SuperAdmin {
    id: number;
    email: string | null;
    phone: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    address: string | null;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    cityCorporationCode: string | null;
    cityCorporation: {
        code: string;
        name: string;
    } | null;
    zoneId: number | null;
    zone: {
        id: number;
        zoneNumber: number | null;
        name: string;
        officerName: string | null;
    } | null;
    wardId: number | null;
    ward: {
        id: number;
        wardNumber: number | null;
        inspectorName: string | null;
    } | null;
    assignedZones?: ZoneAssignment[];
    permissions: SuperAdminPermissions | null;
    statistics: {
        totalComplaints: number;
        resolvedComplaints: number;
        unresolvedComplaints: number;
        pendingComplaints: number;
        inProgressComplaints: number;
    };
}

export interface GetSuperAdminsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    cityCorporationCode?: string;
    zoneId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetSuperAdminsResponse {
    users: SuperAdmin[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface SuperAdminStatistics {
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

export interface CreateSuperAdminDto {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
    cityCorporationCode?: string;
    zoneId?: number;
    permissions?: SuperAdminPermissions;
}

export interface UpdateSuperAdminDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    cityCorporationCode?: string;
    zoneId?: number;
    status?: UserStatus;
    permissions?: SuperAdminPermissions;
}

export interface ZoneAssignment {
    id: number;
    userId: number;
    zoneId: number;
    assignedAt: string;
    assignedBy: number;
    zone: {
        id: number;
        zoneNumber: number;
        name: string;
        cityCorporationCode: string;
    };
}

class SuperAdminService {
    private apiClient: AxiosInstance;

    constructor() {
        this.apiClient = axios.create({
            baseURL: API_CONFIG.BASE_URL,
            timeout: API_CONFIG.TIMEOUT,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token to requests
        this.apiClient.interceptors.request.use((config) => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Get all super admins with filters and pagination
     */
    async getSuperAdmins(params: GetSuperAdminsParams = {}): Promise<GetSuperAdminsResponse> {
        const response = await this.apiClient.get('/api/admin/users', {
            params: {
                ...params,
                role: UserRole.SUPER_ADMIN, // Filter by SUPER_ADMIN role
            },
        });
        return response.data.data;
    }

    /**
     * Get super admin statistics
     */
    async getSuperAdminStatistics(
        cityCorporationCode?: string,
        zoneId?: number
    ): Promise<SuperAdminStatistics> {
        const response = await this.apiClient.get('/api/admin/users/statistics', {
            params: {
                role: UserRole.SUPER_ADMIN,
                cityCorporationCode,
                zoneId,
            },
        });
        return response.data.data;
    }

    /**
     * Get single super admin by ID
     */
    async getSuperAdminById(id: number): Promise<SuperAdmin> {
        const response = await this.apiClient.get(`/api/admin/users/${id}`);
        return response.data.data.user;
    }

    /**
     * Create new super admin
     */
    async createSuperAdmin(data: CreateSuperAdminDto): Promise<SuperAdmin> {
        const response = await this.apiClient.post('/api/admin/users', {
            ...data,
            role: UserRole.SUPER_ADMIN,
        });
        return response.data.data.user;
    }

    /**
     * Update super admin
     */
    async updateSuperAdmin(id: number, data: UpdateSuperAdminDto): Promise<SuperAdmin> {
        const response = await this.apiClient.put(`/api/admin/users/${id}`, data);
        return response.data.data.user;
    }

    /**
     * Update super admin status
     */
    async updateSuperAdminStatus(id: number, status: UserStatus, reason?: string): Promise<SuperAdmin> {
        const response = await this.apiClient.patch(`/api/admin/users/${id}/status`, {
            status,
            reason,
        });
        return response.data.data.user;
    }

    /**
     * Update super admin permissions
     */
    async updateSuperAdminPermissions(id: number, permissions: SuperAdminPermissions): Promise<SuperAdmin> {
        const response = await this.apiClient.patch(`/api/admin/users/${id}/permissions`, permissions);
        return response.data.data.user;
    }

    /**
     * Delete super admin (soft delete)
     */
    async deleteSuperAdmin(id: number): Promise<void> {
        await this.apiClient.delete(`/api/admin/users/${id}`);
    }

    /**
     * Assign zones to super admin
     */


    /**
     * Assign zones to super admin
     */
    async assignZones(userId: number, zoneIds: number[]): Promise<void> {
        try {
            await this.apiClient.post(`/api/admin/users/${userId}/zones`, { zoneIds });
        } catch (error) {
            throw handleApiError(error);
        }
    }

    /**
     * Update zone assignments for super admin
     */
    async updateZones(userId: number, zoneIds: number[]): Promise<void> {
        try {
            await this.apiClient.put(`/api/admin/users/${userId}/zones`, { zoneIds });
        } catch (error) {
            throw handleApiError(error);
        }
    }

    /**
     * Get assigned zones for super admin
     */
    async getAssignedZones(userId: number): Promise<ZoneAssignment[]> {
        try {
            const response = await this.apiClient.get(`/api/admin/users/${userId}/zones`);
            return response.data.data;
        } catch (error) {
            throw handleApiError(error);
        }
    }
}

export const superAdminService = new SuperAdminService();
