"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserStatistics = getUserStatistics;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.updateUserStatus = updateUserStatus;
exports.updateUserPermissions = updateUserPermissions;
exports.deleteUser = deleteUser;
exports.bulkDeleteUsers = bulkDeleteUsers;
exports.getUserComplaints = getUserComplaints;
exports.assignZonesToSuperAdmin = assignZonesToSuperAdmin;
exports.getAssignedZones = getAssignedZones;
exports.updateZoneAssignments = updateZoneAssignments;
exports.removeZoneFromSuperAdmin = removeZoneFromSuperAdmin;
exports.changeUserPassword = changeUserPassword;
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
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    sortBy: zod_1.z.string().optional().default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: zod_1.z.string().optional(),
    ward: zod_1.z.string().optional(),
    thanaId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
    zoneId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
    wardId: zod_1.z.string().optional().transform(val => val ? parseInt(val) : undefined),
});
const createUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    designation: zod_1.z.string().optional(), // Add designation field
    phone: zod_1.z.string().min(10, 'Valid phone number is required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    whatsapp: zod_1.z.string().optional(),
    joiningDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional().transform(val => val ? new Date(val) : undefined),
    address: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    cityCorporationCode: zod_1.z.string().optional(),
    ward: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    permissions: zod_1.z.any().optional(),
});
const updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).optional(), // Regex validation handled in frontend, basic length check here
    lastName: zod_1.z.string().min(1).optional(),
    designation: zod_1.z.string().optional(), // Add designation field
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(10).optional().or(zod_1.z.literal('')), // Allow updating phone or keeping it
    whatsapp: zod_1.z.string().optional(),
    joiningDate: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]).optional().transform(val => val ? new Date(val) : undefined),
    address: zod_1.z.string().optional(),
    cityCorporationCode: zod_1.z.string().optional(),
    ward: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
    role: zod_1.z.nativeEnum(client_1.users_role).optional(),
    status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    avatar: zod_1.z.string().optional(),
    permissions: zod_1.z.any().optional(),
});
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.UserStatus),
    reason: zod_1.z.string().optional(),
});
const bulkDeleteUserSchema = zod_1.z.object({
    userIds: zod_1.z.array(zod_1.z.number().int().positive()).min(1, 'At least one user ID is required'),
});
// Get all users with pagination and filters
async function getUsers(req, res) {
    try {
        console.log('📋 Fetching users with query:', req.query);
        // Validate query parameters
        const query = getUsersQuerySchema.parse(req.query);
        // Get requesting user info for role-based filtering
        let requestingUser = req.user ? {
            id: req.user.id,
            role: req.user.role,
            zoneId: req.user.zoneId,
            wardId: req.user.wardId,
        } : undefined;
        // For Super Admins, fetch their assigned zones
        if (requestingUser && requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(requestingUser.id);
            requestingUser = {
                ...requestingUser,
                assignedZoneIds,
            };
        }
        // Fetch users from service with role-based filtering
        const result = await admin_user_service_1.adminUserService.getUsers(query, requestingUser);
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
        const cityCorporationCode = req.query.cityCorporationCode;
        const zoneId = req.query.zoneId ? parseInt(req.query.zoneId) : undefined;
        const wardId = req.query.wardId ? parseInt(req.query.wardId) : undefined;
        const role = req.query.role;
        // Get requesting user info for role-based filtering
        let requestingUser = req.user ? {
            id: req.user.id,
            role: req.user.role,
            zoneId: req.user.zoneId,
            wardId: req.user.wardId,
        } : undefined;
        // For Super Admins, fetch their assigned zones
        if (requestingUser && requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(requestingUser.id);
            requestingUser = {
                ...requestingUser,
                assignedZoneIds,
            };
        }
        console.log('📊 Fetching user statistics', {
            cityCorporationCode,
            zoneId,
            wardId,
            role,
            requestingUser: requestingUser ? `${requestingUser.role} (ID: ${requestingUser.id})` : 'none',
        });
        const statistics = await admin_user_service_1.adminUserService.getUserStatistics(cityCorporationCode, zoneId, wardId, role, requestingUser);
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
        console.log('➕ Creating new user - Raw body:', { ...req.body, password: '***' });
        // Validate request body
        const rawData = createUserSchema.parse(req.body);
        console.log('✅ Validation passed - Parsed data:', { ...rawData, password: '***' });
        const data = { ...rawData, email: rawData.email?.toLowerCase() };
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        // Create user
        const user = await admin_user_service_1.adminUserService.createUser(data, req.user?.id, ipAddress, userAgent);
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    }
    catch (err) {
        console.error('❌ Error creating user:', err);
        console.error('❌ Error stack:', err.stack);
        if (err instanceof zod_1.z.ZodError) {
            console.error('❌ Zod Validation Error Details:', JSON.stringify(err.errors, null, 2));
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
        const rawData = updateUserSchema.parse(req.body);
        const data = { ...rawData, email: rawData.email?.toLowerCase() };
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        // Update user
        const user = await admin_user_service_1.adminUserService.updateUser(userId, data, req.user?.id, ipAddress, userAgent);
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
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        // Update status
        const user = await admin_user_service_1.adminUserService.updateUserStatus(userId, status, req.user?.id, ipAddress, userAgent);
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
// Update user permissions
async function updateUserPermissions(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }
        console.log('🔐 Updating user permissions:', userId, req.body);
        // Validate permissions structure
        const permissions = req.body;
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        // Update permissions
        const user = await admin_user_service_1.adminUserService.updateUserPermissions(userId, permissions, req.user?.id, ipAddress, userAgent);
        return res.status(200).json({
            success: true,
            message: 'User permissions updated successfully',
            data: { user },
        });
    }
    catch (err) {
        console.error('❌ Error updating user permissions:', err);
        if (err.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to update user permissions',
        });
    }
}
// Delete user (soft delete)
async function deleteUser(req, res) {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }
        const deletedBy = req.user?.id || 0;
        console.log('🗑️ Deleting user:', userId, 'by:', deletedBy);
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        // Delete user (soft delete)
        await admin_user_service_1.adminUserService.deleteUser(userId, deletedBy, ipAddress, userAgent);
        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (err) {
        console.error('❌ Error deleting user:', err);
        if (err.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to delete user',
        });
    }
}
// Bulk delete users
async function bulkDeleteUsers(req, res) {
    try {
        console.log('🗑️ Bulk deleting users:', req.body);
        const { userIds } = bulkDeleteUserSchema.parse(req.body);
        const deletedBy = req.user?.id || 0;
        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');
        await admin_user_service_1.adminUserService.bulkDeleteUsers(userIds, deletedBy, ipAddress, userAgent);
        return res.status(200).json({
            success: true,
            message: 'Users deleted successfully',
        });
    }
    catch (err) {
        console.error('❌ Error bulk deleting users:', err);
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors,
            });
        }
        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to delete users',
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
/**
 * Assign zones to Super Admin (Master Admin only)
 */
async function assignZonesToSuperAdmin(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { zoneIds } = req.body;
        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Zone IDs array is required',
            });
        }
        const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
        await multiZoneService.assignZonesToSuperAdmin({ userId, zoneIds }, req.user.id, req.ip, req.get('user-agent'));
        res.status(200).json({
            success: true,
            message: 'Zones assigned successfully',
        });
    }
    catch (error) {
        console.error('Error in assignZonesToSuperAdmin:', error);
        const message = error instanceof Error ? error.message : 'Failed to assign zones';
        res.status(400).json({
            success: false,
            message,
        });
    }
}
/**
 * Get assigned zones for a Super Admin
 */
async function getAssignedZones(req, res) {
    try {
        const userId = parseInt(req.params.id);
        // Authorization: Master Admin can view any, Super Admin can only view their own
        if (req.user.role === 'SUPER_ADMIN' && req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own assigned zones',
            });
        }
        const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
        const zones = await multiZoneService.getAssignedZones(userId);
        res.status(200).json({
            success: true,
            data: zones,
        });
    }
    catch (error) {
        console.error('Error in getAssignedZones:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned zones',
        });
    }
}
/**
 * Update zone assignments for a Super Admin (Master Admin only)
 */
async function updateZoneAssignments(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { zoneIds } = req.body;
        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Zone IDs array is required',
            });
        }
        const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
        await multiZoneService.updateZoneAssignments(userId, zoneIds, req.user.id, req.ip, req.get('user-agent'));
        res.status(200).json({
            success: true,
            message: 'Zone assignments updated successfully',
        });
    }
    catch (error) {
        console.error('Error in updateZoneAssignments:', error);
        const message = error instanceof Error ? error.message : 'Failed to update zone assignments';
        res.status(400).json({
            success: false,
            message,
        });
    }
}
/**
 * Remove a specific zone from a Super Admin (Master Admin only)
 */
async function removeZoneFromSuperAdmin(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const zoneId = parseInt(req.params.zoneId);
        const { multiZoneService } = await Promise.resolve().then(() => __importStar(require('../services/multi-zone.service')));
        await multiZoneService.removeZoneFromSuperAdmin(userId, zoneId, req.user.id, req.ip, req.get('user-agent'));
        res.status(200).json({
            success: true,
            message: 'Zone removed successfully',
        });
    }
    catch (error) {
        console.error('Error in removeZoneFromSuperAdmin:', error);
        const message = error instanceof Error ? error.message : 'Failed to remove zone';
        res.status(400).json({
            success: false,
            message,
        });
    }
}
/**
 * Change user password
 * - Users can change their own password
 * - Master Admin can change any user's password
 */
async function changeUserPassword(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;
        // Validate input
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters',
            });
        }
        // Check permissions:
        // 1. User can change their own password
        // 2. MASTER_ADMIN can change any user's password
        const isOwnPassword = req.user.id === userId;
        const isMasterAdmin = req.user.role === client_1.users_role.MASTER_ADMIN;
        if (!isOwnPassword && !isMasterAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions',
            });
        }
        await admin_user_service_1.adminUserService.changePassword(userId, newPassword, req.user.id, req.ip, req.get('user-agent'));
        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        console.error('Error in changeUserPassword:', error);
        const message = error instanceof Error ? error.message : 'Failed to change password';
        res.status(400).json({
            success: false,
            message,
        });
    }
}
