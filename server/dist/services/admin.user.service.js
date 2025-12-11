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
    async getUsers(query, requestingUser) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || 'createdAt';
        const sortOrder = query.sortOrder || 'asc'; // Changed to 'asc' to show oldest users first
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
        // Apply city corporation filter
        if (query.cityCorporationCode) {
            where.cityCorporationCode = query.cityCorporationCode;
        }
        // Apply zone filter
        if (query.zoneId) {
            where.zoneId = query.zoneId;
        }
        // Apply ward filter
        if (query.wardId) {
            where.wardId = query.wardId;
        }
        // Apply role-based automatic filtering
        if (requestingUser) {
            this.applyRoleBasedFiltering(where, requestingUser);
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
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
                _count: {
                    select: {
                        complaints: true,
                    },
                },
            },
        });
        // Get all user IDs for batch statistics query
        const userIds = users.map(u => u.id);
        // Batch query for all complaint statistics at once
        const complaintStats = await prisma_1.default.complaint.groupBy({
            by: ['userId', 'status'],
            where: {
                userId: { in: userIds },
            },
            _count: {
                id: true,
            },
        });
        // Build statistics map for quick lookup
        const statsMap = new Map();
        // Initialize stats for all users
        userIds.forEach(userId => {
            statsMap.set(userId, {
                totalComplaints: 0,
                resolvedComplaints: 0,
                unresolvedComplaints: 0,
                pendingComplaints: 0,
                inProgressComplaints: 0,
            });
        });
        // Populate stats from grouped data
        complaintStats.forEach(stat => {
            // Skip if userId is null (shouldn't happen but TypeScript requires the check)
            if (!stat.userId)
                return;
            const userStat = statsMap.get(stat.userId);
            if (!userStat)
                return; // Skip if user not in our list
            const count = stat._count.id;
            userStat.totalComplaints += count;
            if (stat.status === client_1.ComplaintStatus.RESOLVED) {
                userStat.resolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.PENDING) {
                userStat.pendingComplaints += count;
                userStat.unresolvedComplaints += count;
            }
            else if (stat.status === client_1.ComplaintStatus.IN_PROGRESS) {
                userStat.inProgressComplaints += count;
                userStat.unresolvedComplaints += count;
            }
        });
        // Map users with their statistics
        const usersWithStats = users.map(user => ({
            ...user,
            statistics: statsMap.get(user.id),
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
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
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
    async getUserStatistics(cityCorporationCode, zoneId, wardId, requestingUser) {
        // Build base where clause with cascading filters
        const userWhere = {};
        // Apply city corporation filter
        if (cityCorporationCode) {
            userWhere.cityCorporationCode = cityCorporationCode;
        }
        // Apply zone filter
        // Note: If both zoneId and wardId are provided, wardId takes precedence
        if (zoneId && !wardId) {
            userWhere.zoneId = zoneId;
        }
        // Apply ward filter directly
        if (wardId) {
            userWhere.wardId = wardId;
        }
        // Apply role-based automatic filtering
        if (requestingUser) {
            this.applyRoleBasedFiltering(userWhere, requestingUser);
        }
        // Total citizens
        const totalCitizens = await prisma_1.default.user.count({
            where: {
                ...userWhere,
                role: { in: [client_1.users_role.ADMIN, client_1.users_role.SUPER_ADMIN, client_1.users_role.MASTER_ADMIN] },
            },
        });
        // For complaints, we need to filter by user's location
        const complaintWhere = {};
        if (cityCorporationCode || zoneId || wardId) {
            complaintWhere.user = {};
            if (cityCorporationCode) {
                complaintWhere.user.cityCorporationCode = cityCorporationCode;
            }
            // Filter by zone
            // Note: If both zoneId and wardId are provided, wardId takes precedence
            if (zoneId && !wardId) {
                complaintWhere.user.zoneId = zoneId;
            }
            if (wardId) {
                complaintWhere.user.wardId = wardId;
            }
        }
        // Total complaints
        const totalComplaints = await prisma_1.default.complaint.count({
            where: complaintWhere,
        });
        // Resolved complaints
        const resolvedComplaints = await prisma_1.default.complaint.count({
            where: {
                ...complaintWhere,
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
                ...userWhere,
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
                ...userWhere,
                createdAt: {
                    gte: startOfMonth,
                },
            },
        });
        // Status breakdown
        const statusBreakdown = {
            active: await prisma_1.default.user.count({ where: { ...userWhere, status: client_1.UserStatus.ACTIVE } }),
            inactive: await prisma_1.default.user.count({ where: { ...userWhere, status: client_1.UserStatus.INACTIVE } }),
            suspended: await prisma_1.default.user.count({ where: { ...userWhere, status: client_1.UserStatus.SUSPENDED } }),
            pending: await prisma_1.default.user.count({ where: { ...userWhere, status: client_1.UserStatus.PENDING } }),
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
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                wardImageCount: 0, // Initialize to 0 for new users
                role: data.role || client_1.users_role.ADMIN,
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
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
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
        // Hash password if provided
        let hashedPassword;
        if (data.password) {
            hashedPassword = await (0, bcrypt_1.hash)(data.password, 12);
        }
        // Update user
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                cityCorporationCode: data.cityCorporationCode,
                zoneId: data.zoneId,
                wardId: data.wardId,
                role: data.role,
                status: data.status,
                ...(hashedPassword && { passwordHash: hashedPassword }),
            },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                avatar: true,
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
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
                address: true,
                role: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporationCode: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
                zoneId: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        officerName: true,
                        officerDesignation: true,
                        officerSerialNumber: true,
                        status: true,
                    },
                },
                wardId: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true,
                        inspectorSerialNumber: true,
                        status: true,
                    },
                },
                wardImageCount: true,
            },
        });
        // Get statistics
        const statistics = await this.calculateUserStats(user.id);
        return {
            ...user,
            statistics,
        };
    }
    // Apply role-based automatic filtering
    applyRoleBasedFiltering(where, requestingUser) {
        // MASTER_ADMIN: No filtering - can see all users
        if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
            return;
        }
        // SUPER_ADMIN: Filter by their assigned zone
        if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            if (requestingUser.zoneId) {
                where.zoneId = requestingUser.zoneId;
            }
            return;
        }
        // ADMIN: Filter by their assigned ward
        if (requestingUser.role === client_1.users_role.ADMIN) {
            if (requestingUser.wardId) {
                where.wardId = requestingUser.wardId;
            }
            return;
        }
    }
    // Build search query
    buildSearchQuery(search) {
        const searchTerm = search.toLowerCase();
        return [
            { firstName: { contains: searchTerm } },
            { lastName: { contains: searchTerm } },
            { email: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
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
