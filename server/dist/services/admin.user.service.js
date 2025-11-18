"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUserService = exports.AdminUserService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcrypt_1 = require("bcrypt");
const client_1 = require("@prisma/client");
class AdminUserService {
    // Get users with filters and pagination
    async getUsers(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'desc';
        // Build where clause
        const where = {};
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
        const total = await prisma_1.default.user.count({ where });
        // Get users with pagination
        const users = await prisma_1.default.user.findMany({
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
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const statistics = await this.calculateUserStats(user.id);
            return {
                ...user,
                statistics,
            };
        }));
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
    async getUserById(userId) {
        const user = await prisma_1.default.user.findUnique({
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
        const recentComplaints = await prisma_1.default.complaint.findMany({
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
    async getUserStatistics() {
        // Total citizens
        const totalCitizens = await prisma_1.default.user.count({
            where: {
                role: client_1.UserRole.CUSTOMER,
            },
        });
        // Total complaints
        const totalComplaints = await prisma_1.default.complaint.count();
        // Resolved complaints
        const resolvedComplaints = await prisma_1.default.complaint.count({
            where: {
                status: client_1.ComplaintStatus.RESOLVED,
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
        const activeUsers = await prisma_1.default.user.count({
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
        const newUsersThisMonth = await prisma_1.default.user.count({
            where: {
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });
        // Status breakdown
        const statusBreakdown = {
            active: await prisma_1.default.user.count({ where: { status: client_1.UserStatus.ACTIVE } }),
            inactive: await prisma_1.default.user.count({ where: { status: client_1.UserStatus.INACTIVE } }),
            suspended: await prisma_1.default.user.count({ where: { status: client_1.UserStatus.SUSPENDED } }),
            pending: await prisma_1.default.user.count({ where: { status: client_1.UserStatus.PENDING } }),
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
    async createUser(data) {
        // Check if user exists by phone
        const existingUserByPhone = await prisma_1.default.user.findUnique({
            where: { phone: data.phone },
        });
        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }
        // Check if user exists by email (if provided)
        if (data.email) {
            const existingUserByEmail = await prisma_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (existingUserByEmail) {
                throw new Error('User already exists with this email');
            }
        }
        // Hash password
        const hashedPassword = await (0, bcrypt_1.hash)(data.password, 12);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                passwordHash: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                ward: data.ward,
                zone: data.zone,
                role: data.role || client_1.UserRole.CUSTOMER,
                status: client_1.UserStatus.ACTIVE,
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
    async updateUser(userId, data) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Check for duplicate phone (if changing)
        if (data.phone && data.phone !== existingUser.phone) {
            const duplicatePhone = await prisma_1.default.user.findUnique({
                where: { phone: data.phone },
            });
            if (duplicatePhone) {
                throw new Error('Phone number already in use');
            }
        }
        // Check for duplicate email (if changing)
        if (data.email && data.email !== existingUser.email) {
            const duplicateEmail = await prisma_1.default.user.findUnique({
                where: { email: data.email },
            });
            if (duplicateEmail) {
                throw new Error('Email already in use');
            }
        }
        // Update user
        const user = await prisma_1.default.user.update({
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
    async updateUserStatus(userId, status) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!existingUser) {
            throw new Error('User not found');
        }
        // Update status
        const user = await prisma_1.default.user.update({
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
    buildSearchQuery(search) {
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
    async calculateUserStats(userId) {
        // Total complaints
        const totalComplaints = await prisma_1.default.complaint.count({
            where: { userId },
        });
        // Resolved complaints
        const resolvedComplaints = await prisma_1.default.complaint.count({
            where: {
                userId,
                status: client_1.ComplaintStatus.RESOLVED,
            },
        });
        // Pending complaints
        const pendingComplaints = await prisma_1.default.complaint.count({
            where: {
                userId,
                status: client_1.ComplaintStatus.PENDING,
            },
        });
        // In progress complaints
        const inProgressComplaints = await prisma_1.default.complaint.count({
            where: {
                userId,
                status: client_1.ComplaintStatus.IN_PROGRESS,
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
exports.AdminUserService = AdminUserService;
exports.adminUserService = new AdminUserService();
