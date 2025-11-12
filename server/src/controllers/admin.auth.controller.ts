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
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
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

// Admin profile - returns admin user info
export async function adminMe(req: AuthRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        const user = await authService.getProfile(String(req.user.sub));
        return res.status(200).json({ user });
    } catch (err: any) {
        return res.status(400).json({ message: err?.message ?? 'Failed to load admin profile' });
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
