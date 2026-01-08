import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminUserService } from '../services/admin.user.service';
import { z } from 'zod';
import { users_role, UserStatus } from '@prisma/client';

console.log('🔧 Loading admin.user.controller.ts...');

// Validation schemas
const getUsersQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(users_role).optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    cityCorporationCode: z.string().optional(),
    ward: z.string().optional(),
    thanaId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    zoneId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
    wardId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

const createUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
    whatsapp: z.string().optional(),
    joiningDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    address: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    cityCorporationCode: z.string().optional(),
    ward: z.string().optional(),
    zone: z.string().optional(),
    zoneId: z.number().int().positive().optional(),
    wardId: z.number().int().positive().optional(),
    role: z.nativeEnum(users_role).optional(),
    permissions: z.any().optional(),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10).optional(),
    whatsapp: z.string().optional(),
    joiningDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    address: z.string().optional(),
    cityCorporationCode: z.string().optional(),
    ward: z.string().optional(),
    zone: z.string().optional(),
    zoneId: z.number().int().positive().optional(),
    wardId: z.number().int().positive().optional(),
    role: z.nativeEnum(users_role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    permissions: z.any().optional(),
});

const updateStatusSchema = z.object({
    status: z.nativeEnum(UserStatus),
    reason: z.string().optional(),
});

const bulkDeleteUserSchema = z.object({
    userIds: z.array(z.number().int().positive()).min(1, 'At least one user ID is required'),
});

// Get all users with pagination and filters
export async function getUsers(req: AuthRequest, res: Response) {
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
        if (requestingUser && requestingUser.role === users_role.SUPER_ADMIN) {
            const { multiZoneService } = await import('../services/multi-zone.service');
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(requestingUser.id);
            requestingUser = {
                ...requestingUser,
                assignedZoneIds,
            } as any;
        }

        // Fetch users from service with role-based filtering
        const result = await adminUserService.getUsers(query, requestingUser);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        console.error('❌ Error fetching users:', err);

        if (err instanceof z.ZodError) {
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
export async function getUserById(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID',
            });
        }

        console.log('👤 Fetching user details for ID:', userId);

        const result = await adminUserService.getUserById(userId);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err: any) {
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
export async function getUserStatistics(req: AuthRequest, res: Response) {
    try {
        const cityCorporationCode = req.query.cityCorporationCode as string | undefined;
        const zoneId = req.query.zoneId ? parseInt(req.query.zoneId as string) : undefined;
        const wardId = req.query.wardId ? parseInt(req.query.wardId as string) : undefined;
        const role = req.query.role as users_role | undefined;

        // Get requesting user info for role-based filtering
        let requestingUser = req.user ? {
            id: req.user.id,
            role: req.user.role,
            zoneId: req.user.zoneId,
            wardId: req.user.wardId,
        } : undefined;

        // For Super Admins, fetch their assigned zones
        if (requestingUser && requestingUser.role === users_role.SUPER_ADMIN) {
            const { multiZoneService } = await import('../services/multi-zone.service');
            const assignedZoneIds = await multiZoneService.getAssignedZoneIds(requestingUser.id);
            requestingUser = {
                ...requestingUser,
                assignedZoneIds,
            } as any;
        }

        console.log('📊 Fetching user statistics', {
            cityCorporationCode,
            zoneId,
            wardId,
            role,
            requestingUser: requestingUser ? `${requestingUser.role} (ID: ${requestingUser.id})` : 'none',
        });

        const statistics = await adminUserService.getUserStatistics(
            cityCorporationCode,
            zoneId,
            wardId,
            role,
            requestingUser
        );

        return res.status(200).json({
            success: true,
            data: statistics,
        });
    } catch (err: any) {
        console.error('❌ Error fetching statistics:', err);

        return res.status(500).json({
            success: false,
            message: err?.message ?? 'Failed to fetch statistics',
        });
    }
}

// Create new user
export async function createUser(req: AuthRequest, res: Response) {
    try {
        console.log('➕ Creating new user:', { ...req.body, password: '***' });

        // Validate request body
        const rawData = createUserSchema.parse(req.body);
        const data = { ...rawData, email: rawData.email?.toLowerCase() };

        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        // Create user
        const user = await adminUserService.createUser(
            data,
            req.user?.id,
            ipAddress,
            userAgent
        );

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    } catch (err: any) {
        console.error('❌ Error creating user:', err);

        if (err instanceof z.ZodError) {
            console.error('❌ Zod Validation Error:', JSON.stringify(err.errors, null, 2));
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
export async function updateUser(req: AuthRequest, res: Response) {
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
        const user = await adminUserService.updateUser(
            userId,
            data,
            req.user?.id,
            ipAddress,
            userAgent
        );

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: { user },
        });
    } catch (err: any) {
        console.error('❌ Error updating user:', err);

        if (err instanceof z.ZodError) {
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
export async function updateUserStatus(req: AuthRequest, res: Response) {
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
        const user = await adminUserService.updateUserStatus(
            userId,
            status,
            req.user?.id,
            ipAddress,
            userAgent
        );

        return res.status(200).json({
            success: true,
            message: `User status updated to ${status}${reason ? `: ${reason}` : ''}`,
            data: { user },
        });
    } catch (err: any) {
        console.error('❌ Error updating user status:', err);

        if (err instanceof z.ZodError) {
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
export async function updateUserPermissions(req: AuthRequest, res: Response) {
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
        const user = await adminUserService.updateUserPermissions(
            userId,
            permissions,
            req.user?.id,
            ipAddress,
            userAgent
        );

        return res.status(200).json({
            success: true,
            message: 'User permissions updated successfully',
            data: { user },
        });
    } catch (err: any) {
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
export async function deleteUser(req: AuthRequest, res: Response) {
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
        await adminUserService.deleteUser(userId, deletedBy, ipAddress, userAgent);

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (err: any) {
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
export async function bulkDeleteUsers(req: AuthRequest, res: Response) {
    try {
        console.log('🗑️ Bulk deleting users:', req.body);

        const { userIds } = bulkDeleteUserSchema.parse(req.body);
        const deletedBy = req.user?.id || 0;

        // Get IP address and user agent for activity logging
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.get('user-agent');

        await adminUserService.bulkDeleteUsers(userIds, deletedBy, ipAddress, userAgent);

        return res.status(200).json({
            success: true,
            message: 'Users deleted successfully',
        });
    } catch (err: any) {
        console.error('❌ Error bulk deleting users:', err);

        if (err instanceof z.ZodError) {
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
import { adminComplaintService } from '../services/admin-complaint.service';

/**
 * Get complaints for a specific user
 */
export async function getUserComplaints(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const { page, limit } = req.query;

        const result = await adminComplaintService.getComplaintsByUser(
            userId,
            page ? parseInt(page as string) : undefined,
            limit ? parseInt(limit as string) : undefined
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
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
export async function assignZonesToSuperAdmin(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);
        const { zoneIds } = req.body;

        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Zone IDs array is required',
            });
        }

        const { multiZoneService } = await import('../services/multi-zone.service');

        await multiZoneService.assignZonesToSuperAdmin(
            { userId, zoneIds },
            req.user!.id,
            req.ip,
            req.get('user-agent')
        );

        res.status(200).json({
            success: true,
            message: 'Zones assigned successfully',
        });
    } catch (error) {
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
export async function getAssignedZones(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);

        // Authorization: Master Admin can view any, Super Admin can only view their own
        if (req.user!.role === 'SUPER_ADMIN' && req.user!.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own assigned zones',
            });
        }

        const { multiZoneService } = await import('../services/multi-zone.service');
        const zones = await multiZoneService.getAssignedZones(userId);

        res.status(200).json({
            success: true,
            data: zones,
        });
    } catch (error) {
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
export async function updateZoneAssignments(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);
        const { zoneIds } = req.body;

        if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Zone IDs array is required',
            });
        }

        const { multiZoneService } = await import('../services/multi-zone.service');

        await multiZoneService.updateZoneAssignments(
            userId,
            zoneIds,
            req.user!.id,
            req.ip,
            req.get('user-agent')
        );

        res.status(200).json({
            success: true,
            message: 'Zone assignments updated successfully',
        });
    } catch (error) {
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
export async function removeZoneFromSuperAdmin(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id);
        const zoneId = parseInt(req.params.zoneId);

        const { multiZoneService } = await import('../services/multi-zone.service');

        await multiZoneService.removeZoneFromSuperAdmin(
            userId,
            zoneId,
            req.user!.id,
            req.ip,
            req.get('user-agent')
        );

        res.status(200).json({
            success: true,
            message: 'Zone removed successfully',
        });
    } catch (error) {
        console.error('Error in removeZoneFromSuperAdmin:', error);
        const message = error instanceof Error ? error.message : 'Failed to remove zone';
        res.status(400).json({
            success: false,
            message,
        });
    }
}
