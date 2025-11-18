import prisma from '../utils/prisma';
import { hash } from 'bcrypt';
import { UserRole, UserStatus, ComplaintStatus, Prisma } from '@prisma/client';

// Query interfaces
export interface GetUsersQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: UserStatus;
    role?: UserRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Response interfaces
export interface UserStatistics {
    totalComplaints: number;
    resolvedComplaints: number;
    unresolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
}

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
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
    statistics: UserStatistics;
}

export interface GetUsersResponse {
    users: UserWithStats[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ComplaintSummary {
    id: number;
    title: string;
    status: ComplaintStatus;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface GetUserResponse {
    user: UserWithStats;
    recentComplaints: ComplaintSummary[];
}

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

export interface CreateUserDto {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    password: string;
    ward?: string;
    zone?: string;
    role?: UserRole;
}

export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    ward?: string;
    zone?: string;
    role?: UserRole;
    status?: UserStatus;
}

export interface UpdateStatusDto {
    status: UserStatus;
    reason?: string;
}

export class AdminUserService {
    // Get users with filters and pagination
    async getUsers(query: GetUsersQuery): Promise<GetUsersResponse> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';

        // Build where clause
        const where: Prisma.UserWhereInput = {};

        // Apply search filter
        if (query.search) {
            where.OR = this.buildSearchQuery(query.search);
        }

        // Apply status filter
        if (query.status) {
            where.status = query.status;
        }

        // Apply role filter
        if (query.role) {
            where.role = query.role;
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users with pagination
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ward: true,
                zone: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });

        // Calculate statistics for each user
        const usersWithStats: UserWithStats[] = await Promise.all(
            users.map(async (user) => {
                const statistics = await this.calculateUserStats(user.id);
                return {
                    ...user,
                    statistics,
                };
            })
        );

        return {
            users: usersWithStats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // Get single user with details
    async getUserById(userId: number): Promise<GetUserResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ward: true,
                zone: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get user statistics
        const statistics = await this.calculateUserStats(userId);

        // Get recent complaints
        const recentComplaints = await prisma.complaint.findMany({
            where: { userId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            user: {
                ...user,
                statistics,
            },
            recentComplaints,
        };
    }

    // Get aggregate statistics
    async getUserStatistics(): Promise<UserStatisticsResponse> {
        // Total citizens
        const totalCitizens = await prisma.user.count({
            where: {
                role: UserRole.CUSTOMER,
            },
        });

        // Total complaints
        const totalComplaints = await prisma.complaint.count();

        // Resolved complaints
        const resolvedComplaints = await prisma.complaint.count({
            where: {
                status: ComplaintStatus.RESOLVED,
            },
        });

        // Unresolved complaints
        const unresolvedComplaints = totalComplaints - resolvedComplaints;

        // Success rate
        const successRate = totalComplaints > 0
            ? Math.round((resolvedComplaints / totalComplaints) * 100)
            : 0;

        // Active users (logged in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await prisma.user.count({
            where: {
                lastLoginAt: {
                    gte: thirtyDaysAgo,
                },
            },
        });

        // New users this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsersThisMonth = await prisma.user.count({
            where: {
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });

        // Status breakdown
        const statusBreakdown = {
            active: await prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
            inactive: await prisma.user.count({ where: { status: UserStatus.INACTIVE } }),
            suspended: await prisma.user.count({ where: { status: UserStatus.SUSPENDED } }),
            pending: await prisma.user.count({ where: { status: UserStatus.PENDING } }),
        };

        return {
            totalCitizens,
            totalComplaints,
            resolvedComplaints,
            unresolvedComplaints,
            successRate,
            activeUsers,
            newUsersThisMonth,
            statusBreakdown,
        };
    }

    // Create new user
    async createUser(data: CreateUserDto): Promise<UserWithStats> {
        // Check if user exists by phone
        const existingUserByPhone = await prisma.user.findUnique({
            where: { phone: data.phone },
        });

        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }

        // Check if user exists by email (if provided)
        if (data.email) {
            const existingUserByEmail = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (existingUserByEmail) {
                throw new Error('User already exists with this email');
            }
        }

        // Hash password
        const hashedPassword = await hash(data.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                ward: data.ward,
                zone: data.zone,
                role: data.role || UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
                emailVerified: false,
                phoneVerified: false,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ward: true,
                zone: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            statistics,
        };
    }

    // Update user information
    async updateUser(userId: number, data: UpdateUserDto): Promise<UserWithStats> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Check for duplicate phone (if changing)
        if (data.phone && data.phone !== existingUser.phone) {
            const duplicatePhone = await prisma.user.findUnique({
                where: { phone: data.phone },
            });

            if (duplicatePhone) {
                throw new Error('Phone number already in use');
            }
        }

        // Check for duplicate email (if changing)
        if (data.email && data.email !== existingUser.email) {
            const duplicateEmail = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (duplicateEmail) {
                throw new Error('Email already in use');
            }
        }

        // Update user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                ward: data.ward,
                zone: data.zone,
                role: data.role,
                status: data.status,
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ward: true,
                zone: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            statistics,
        };
    }

    // Update user status
    async updateUserStatus(userId: number, status: UserStatus): Promise<UserWithStats> {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new Error('User not found');
        }

        // Update status
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                ward: true,
                zone: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
        });

        // Get statistics
        const statistics = await this.calculateUserStats(user.id);

        return {
            ...user,
            statistics,
        };
    }

    // Build search query
    private buildSearchQuery(search: string): Prisma.UserWhereInput[] {
        const searchTerm = search.toLowerCase();

        return [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
            { ward: { contains: searchTerm } },
            { zone: { contains: searchTerm } },
        ];
    }

    // Calculate user statistics
    private async calculateUserStats(userId: number): Promise<UserStatistics> {
        // Total complaints
        const totalComplaints = await prisma.complaint.count({
            where: { userId },
        });

        // Resolved complaints
        const resolvedComplaints = await prisma.complaint.count({
            where: {
                userId,
                status: ComplaintStatus.RESOLVED,
            },
        });

        // Pending complaints
        const pendingComplaints = await prisma.complaint.count({
            where: {
                userId,
                status: ComplaintStatus.PENDING,
            },
        });

        // In progress complaints
        const inProgressComplaints = await prisma.complaint.count({
            where: {
                userId,
                status: ComplaintStatus.IN_PROGRESS,
            },
        });

        // Unresolved complaints (pending + in progress)
        const unresolvedComplaints = pendingComplaints + inProgressComplaints;

        return {
            totalComplaints,
            resolvedComplaints,
            unresolvedComplaints,
            pendingComplaints,
            inProgressComplaints,
        };
    }
}

export const adminUserService = new AdminUserService();
