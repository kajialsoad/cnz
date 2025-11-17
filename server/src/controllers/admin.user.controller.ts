import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminUserService } from '../services/admin.user.service';
import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

console.log('🔧 Loading admin.user.controller.ts...');

// Validation schemas
const getUsersQuerySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    search: z.string().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(UserRole).optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const createUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    ward: z.string().optional(),
    zone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
    ward: z.string().optional(),
    zone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
});

const updateStatusSchema = z.object({
    status: z.nativeEnum(UserStatus),
    reason: z.string().optional(),
});

// Get all users with pagination and filters
export async function getUsers(req: AuthRequest, res: Response) {
    try {
        console.log('📋 Fetching users with query:', req.query);

        // Validate query parameters
        const query = getUsersQuerySchema.parse(req.query);

        // Fetch users from service
        const result = await adminUserService.getUsers(query);

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
        console.log('📊 Fetching user statistics');

        const statistics = await adminUserService.getUserStatistics();

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
        const data = createUserSchema.parse(req.body);

        // Create user
        const user = await adminUserService.createUser(data);

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    } catch (err: any) {
        console.error('❌ Error creating user:', err);

        if (err instanceof z.ZodError) {
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
        const data = updateUserSchema.parse(req.body);

        // Update user
        const user = await adminUserService.updateUser(userId, data);

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

        // Update status
        const user = await adminUserService.updateUserStatus(userId, status);

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
