"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserStatistics = getUserStatistics;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.updateUserStatus = updateUserStatus;
exports.getUserComplaints = getUserComplaints;
const admin_user_service_1 = require("../services/admin.user.service");
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
console.log('🔧 Loading admin.user.controller.ts...');
// Validation schemas
const getUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: zod_1.z.string().optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    sortBy: zod_1.z.string().optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
const createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().min(10, 'Valid phone number is required'),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    ward: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
});
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(10).optional(),
    ward: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
    role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus),
    reason: zod_1.z.string().optional(),
});
// Get all users with pagination and filters
async function getUsers(req, res) {
    try {
        console.log('📋 Fetching users with query:', req.query);
        // Validate query parameters
        const query = getUsersQuerySchema.parse(req.query);
        // Fetch users from service
        const result = await admin_user_service_1.adminUserService.getUsers(query);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        console.error('❌ Error fetching users:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: err.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to fetch users',
        });
    }
}
// Get single user by ID
async function getUserById(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }
        console.log('👤 Fetching user details for ID:', userId);
        const result = await admin_user_service_1.adminUserService.getUserById(userId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        console.error('❌ Error fetching user:', err);
        if (err.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to fetch user',
        });
    }
}
// Get user statistics
async function getUserStatistics(req, res) {
    try {
        console.log('📊 Fetching user statistics');
        const statistics = await admin_user_service_1.adminUserService.getUserStatistics();
        return res.status(200).json({
            success: true,
            data: statistics,
        });
    }
    catch (err) {
        console.error('❌ Error fetching statistics:', err);
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to fetch statistics',
        });
    }
}
// Create new user
async function createUser(req, res) {
    try {
        console.log('➕ Creating new user:', { ...req.body, password: '***' });
        // Validate request body
        const data = createUserSchema.parse(req.body);
        // Create user
        const user = await admin_user_service_1.adminUserService.createUser(data);
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    }
    catch (err) {
        console.error('❌ Error creating user:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors,
            });
        }
        if (err.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: err.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to create user',
        });
    }
}
// Update user
async function updateUser(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }
        console.log('✏️ Updating user:', userId, req.body);
        // Validate request body
        const data = updateUserSchema.parse(req.body);
        // Update user
        const user = await admin_user_service_1.adminUserService.updateUser(userId, data);
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user },
        });
    }
    catch (err) {
        console.error('❌ Error updating user:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors,
            });
        }
        if (err.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        if (err.message.includes('already in use')) {
            return res.status(409).json({
                success: false,
                message: err.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to update user',
        });
    }
}
// Update user status
async function updateUserStatus(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }
        console.log('🔄 Updating user status:', userId, req.body);
        // Validate request body
        const { status, reason } = updateStatusSchema.parse(req.body);
        // Update status
        const user = await admin_user_service_1.adminUserService.updateUserStatus(userId, status);
        return res.status(200).json({
            success: true,
            message: `User status updated to ${status}${reason ? `: ${reason}` : ''}`,
            data: { user },
        });
    }
    catch (err) {
        console.error('❌ Error updating user status:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors,
            });
        }
        if (err.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to update user status',
        });
    }
}
// Import admin complaint service
const admin_complaint_service_1 = require("../services/admin-complaint.service");
/**
 * Get complaints for a specific user
 */
async function getUserComplaints(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const { page, limit } = req.query;
        const result = await admin_complaint_service_1.adminComplaintService.getComplaintsByUser(userId, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getUserComplaints:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch user complaints'
        });
    }
}
