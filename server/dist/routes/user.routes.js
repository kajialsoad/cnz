"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
// Get current user profile (alias for /profile)
router.get('/me', auth_middleware_1.authGuard, async (req, res) => {
    try {
        const userId = req.user.sub.toString();
        const profile = await auth_service_1.authService.getProfile(userId);
        res.json({
            success: true,
            user: profile
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Get user profile
router.get('/profile', auth_middleware_1.authGuard, async (req, res) => {
    try {
        const userId = req.user.sub.toString();
        const profile = await auth_service_1.authService.getProfile(userId);
        res.json({
            success: true,
            data: profile
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Update user profile
router.put('/profile', auth_middleware_1.authGuard, async (req, res) => {
    try {
        const userId = req.user.sub.toString();
        const { error, value } = (0, validation_1.validateInput)(validation_2.updateProfileSchema, req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details
            });
        }
        const profile = await auth_service_1.authService.updateProfile(userId, value);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: profile
        });
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Change password
router.post('/change-password', auth_middleware_1.authGuard, async (req, res) => {
    try {
        const userId = req.user.sub.toString();
        const { error, value } = (0, validation_1.validateInput)(validation_2.changePasswordSchema, req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details
            });
        }
        const result = await auth_service_1.authService.changePassword(userId, value.currentPassword, value.newPassword);
        res.json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Admin routes - Get all users
router.get('/admin/users', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), async (req, res) => {
    try {
        const { page = 1, limit = 10, role, status } = req.query;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [users, total] = await Promise.all([
            req.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    status: true,
                    emailVerified: true,
                    createdAt: true,
                    lastLoginAt: true
                },
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            req.prisma.user.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / Number(limit))
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Admin routes - Get user by ID
router.get('/admin/users/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const user = await req.prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                emailVerified: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Admin routes - Update user status
router.put('/admin/users/:id/status', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be ACTIVE, SUSPENDED, or PENDING'
            });
        }
        const user = await req.prisma.user.update({
            where: { id: parseInt(id) },
            data: { status },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                lastLoginAt: true
            }
        });
        res.json({
            success: true,
            message: 'User status updated successfully',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
// Admin routes - Update user role
router.put('/admin/users/:id/role', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }
        const user = await req.prisma.user.update({
            where: { id: parseInt(id) },
            data: { role },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                emailVerified: true,
                createdAt: true,
                lastLoginAt: true
            }
        });
        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
