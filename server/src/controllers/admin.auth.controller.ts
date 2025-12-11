import { Response, Request } from 'express';
import { AuthRequest } from '../types/auth';
import { authService } from '../services/auth.service';
import { z } from 'zod';
import env from '../config/env';

console.log('🔧 Loading admin.auth.controller.ts...');

const adminLoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    rememberMe: z.boolean().optional().default(false),
});

const adminProfileUpdateSchema = z.object({
    firstName: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 2, 'First name must be at least 2 characters')
        .refine(val => !val || val.length <= 50, 'First name must not exceed 50 characters')
        .refine(val => !val || /^[a-zA-Z\s'-]+$/.test(val), 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
    lastName: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 2, 'Last name must be at least 2 characters')
        .refine(val => !val || val.length <= 50, 'Last name must not exceed 50 characters')
        .refine(val => !val || /^[a-zA-Z\s'-]+$/.test(val), 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
    avatar: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || /^https?:\/\/.+/.test(val), 'Avatar must be a valid URL')
        .refine(val => !val || val.length <= 500, 'Avatar URL is too long')
        .optional(),
    ward: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length <= 20, 'Ward must not exceed 20 characters')
        .optional(),
    zone: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length <= 20, 'Zone must not exceed 20 characters')
        .optional(),
    address: z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 10, 'Address must be at least 10 characters')
        .refine(val => !val || val.length <= 200, 'Address must not exceed 200 characters')
        .optional(),
}).refine(
    (data) => {
        // Filter out empty strings and check if we have any real data
        const hasData = Object.entries(data).some(([_, value]) => {
            return value !== undefined && value !== '' && value !== null;
        });
        return hasData;
    },
    {
        message: 'At least one field must be provided for update',
    }
);

// Admin login - only allows ADMIN and SUPER_ADMIN roles
export async function adminLogin(req: AuthRequest, res: Response) {
    console.log('🔐 Admin login attempt:', { email: req.body?.email, hasPassword: !!req.body?.password });

    try {
        const body = adminLoginSchema.parse(req.body);

        // First, verify the user exists and has admin role
        const prisma = (await import('../utils/prisma')).default;
        const user = await prisma.user.findUnique({
            where: { email: body.email },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
            }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user has admin role
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MASTER_ADMIN') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Now proceed with login
        const result = await authService.login({
            email: body.email,
            password: body.password,
            rememberMe: body.rememberMe,
        });

        const cookieOpts = {
            httpOnly: true as const,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/',
        };
        const maxAge = body.rememberMe ? (env.REFRESH_TTL_SECONDS * 1000) : undefined;
        res.cookie('cc_refresh', result.refreshToken, {
            ...cookieOpts,
            ...(maxAge ? { maxAge } : {}),
        });

        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(401).json({ message: err?.message ?? 'Admin login failed' });
    }
}

// Admin profile - returns admin user info with complete profile data
export async function adminMe(req: AuthRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });

        // TEMPORARY: Return mock profile for bypass user
        if (req.user.email === 'bypass@admin.com') {
            console.log('⚠️ Returning mock profile for bypass user');
            return res.status(200).json({
                success: true,
                data: {
                    id: 1,
                    firstName: "Master",
                    lastName: "Admin",
                    email: "bypass@admin.com",
                    phone: "01700000000",
                    role: "MASTER_ADMIN",
                    status: "active",
                    avatar: "https://ui-avatars.com/api/?name=Master+Admin&background=random",
                    ward: "1",
                    zone: "1",
                    address: "Dhaka, Bangladesh",
                    cityCorporationCode: "DNCC",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    emailVerified: true,
                    phoneVerified: true
                }
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MASTER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const user = await authService.getProfile(String(req.user.sub));
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (err: any) {
        return res.status(400).json({
            success: false,
            message: err?.message ?? 'Failed to load admin profile'
        });
    }
}

// Admin logout
export async function adminLogout(req: AuthRequest, res: Response) {
    try {
        const tokenFromCookie = (req as Request & { cookies?: Record<string, string> }).cookies?.cc_refresh;
        const { refreshToken } = req.body as { refreshToken?: string };
        const effectiveToken = tokenFromCookie || refreshToken || '';
        if (effectiveToken) {
            await authService.logout(effectiveToken);
        }
        res.cookie('cc_refresh', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
        return res.status(200).json({ message: 'Admin logged out successfully' });
    } catch (err: any) {
        return res.status(400).json({ message: err?.message ?? 'Logout failed' });
    }
}

// Admin refresh token
export async function adminRefresh(req: AuthRequest, res: Response) {
    try {
        const tokenFromCookie = (req as Request & { cookies?: Record<string, string> }).cookies?.cc_refresh;
        const { refreshToken } = req.body as { refreshToken?: string };
        const effectiveToken = tokenFromCookie || refreshToken;
        if (!effectiveToken) return res.status(400).json({ message: 'Missing refreshToken' });

        const result = await authService.refreshTokens(effectiveToken);

        const cookieOpts = {
            httpOnly: true as const,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict' as const,
            path: '/',
            maxAge: env.REFRESH_TTL_SECONDS * 1000,
        };
        res.cookie('cc_refresh', result.refreshToken, cookieOpts);
        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(401).json({ message: err?.message ?? 'Token refresh failed' });
    }
}

// Admin profile update - allows admins to update their profile
export async function adminUpdateProfile(req: AuthRequest, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Authentication required'
            });
        }

        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MASTER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check if request body is empty
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No data provided for update'
            });
        }

        // Validate request body
        const body = adminProfileUpdateSchema.parse(req.body);

        // Sanitize string inputs
        const sanitizedBody: any = {};
        if (body.firstName) sanitizedBody.firstName = body.firstName.trim();
        if (body.lastName) sanitizedBody.lastName = body.lastName.trim();
        if (body.avatar) sanitizedBody.avatar = body.avatar.trim();
        if (body.ward) sanitizedBody.ward = body.ward.trim();
        if (body.zone) sanitizedBody.zone = body.zone.trim();
        if (body.address) sanitizedBody.address = body.address.trim();

        // Update profile
        const updatedUser = await authService.updateProfile(String(req.user.sub), sanitizedBody);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (err: any) {
        console.error('Profile update error:', err);

        if (err?.name === 'ZodError') {
            // Format Zod validation errors
            const formattedErrors = err.issues.map((issue: any) => ({
                field: issue.path.join('.'),
                message: issue.message
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + formattedErrors[0].message,
                errors: formattedErrors
            });
        }

        // Handle specific error types
        if (err?.message?.includes('email') && err?.message?.includes('already')) {
            return res.status(409).json({
                success: false,
                message: 'Email address is already in use'
            });
        }

        if (err?.message?.includes('phone') && err?.message?.includes('already')) {
            return res.status(409).json({
                success: false,
                message: 'Phone number is already in use'
            });
        }

        return res.status(400).json({
            success: false,
            message: err?.message ?? 'Failed to update profile'
        });
    }
}
