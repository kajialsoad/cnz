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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLogin = adminLogin;
exports.adminMe = adminMe;
exports.adminLogout = adminLogout;
exports.adminRefresh = adminRefresh;
exports.adminUpdateProfile = adminUpdateProfile;
const auth_service_1 = require("../services/auth.service");
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
console.log('🔧 Loading admin.auth.controller.ts...');
const adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    rememberMe: zod_1.z.boolean().optional().default(false),
});
const adminProfileUpdateSchema = zod_1.z.object({
    firstName: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 2, 'First name must be at least 2 characters')
        .refine(val => !val || val.length <= 50, 'First name must not exceed 50 characters')
        .refine(val => !val || /^[a-zA-Z\s'-]+$/.test(val), 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
    lastName: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 2, 'Last name must be at least 2 characters')
        .refine(val => !val || val.length <= 50, 'Last name must not exceed 50 characters')
        .refine(val => !val || /^[a-zA-Z\s'-]+$/.test(val), 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
    avatar: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || /^https?:\/\/.+/.test(val), 'Avatar must be a valid URL')
        .refine(val => !val || val.length <= 500, 'Avatar URL is too long')
        .optional(),
    ward: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length <= 20, 'Ward must not exceed 20 characters')
        .optional(),
    zone: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length <= 20, 'Zone must not exceed 20 characters')
        .optional(),
    address: zod_1.z.string()
        .transform(val => val?.trim())
        .refine(val => !val || val.length >= 10, 'Address must be at least 10 characters')
        .refine(val => !val || val.length <= 200, 'Address must not exceed 200 characters')
        .optional(),
}).refine((data) => {
    // Filter out empty strings and check if we have any real data
    const hasData = Object.entries(data).some(([_, value]) => {
        return value !== undefined && value !== '' && value !== null;
    });
    return hasData;
}, {
    message: 'At least one field must be provided for update',
});
// Admin login - only allows ADMIN and SUPER_ADMIN roles
async function adminLogin(req, res) {
    console.log('🔐 Admin login attempt:', { email: req.body?.email, hasPassword: !!req.body?.password });
    try {
        const body = adminLoginSchema.parse(req.body);
        // First, verify the user exists and has admin role
        const prisma = (await Promise.resolve().then(() => __importStar(require('../utils/prisma')))).default;
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
        const result = await auth_service_1.authService.login({
            email: body.email,
            password: body.password,
            rememberMe: body.rememberMe,
        });
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        };
        const maxAge = body.rememberMe ? (env_1.default.REFRESH_TTL_SECONDS * 1000) : undefined;
        res.cookie('cc_refresh', result.refreshToken, {
            ...cookieOpts,
            ...(maxAge ? { maxAge } : {}),
        });
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Admin login failed' });
    }
}
// Admin profile - returns admin user info with complete profile data
async function adminMe(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MASTER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        const user = await auth_service_1.authService.getProfile(String(req.user.sub));
        return res.status(200).json({
            success: true,
            data: user
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err?.message ?? 'Failed to load admin profile'
        });
    }
}
// Admin logout
async function adminLogout(req, res) {
    try {
        const tokenFromCookie = req.cookies?.cc_refresh;
        const { refreshToken } = req.body;
        const effectiveToken = tokenFromCookie || refreshToken || '';
        if (effectiveToken) {
            await auth_service_1.authService.logout(effectiveToken);
        }
        res.cookie('cc_refresh', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
        return res.status(200).json({ message: 'Admin logged out successfully' });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Logout failed' });
    }
}
// Admin refresh token
async function adminRefresh(req, res) {
    try {
        const tokenFromCookie = req.cookies?.cc_refresh;
        const { refreshToken } = req.body;
        const effectiveToken = tokenFromCookie || refreshToken;
        if (!effectiveToken)
            return res.status(400).json({ message: 'Missing refreshToken' });
        const result = await auth_service_1.authService.refreshTokens(effectiveToken);
        const cookieOpts = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: env_1.default.REFRESH_TTL_SECONDS * 1000,
        };
        res.cookie('cc_refresh', result.refreshToken, cookieOpts);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Token refresh failed' });
    }
}
// Admin profile update - allows admins to update their profile
async function adminUpdateProfile(req, res) {
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
        const sanitizedBody = {};
        if (body.firstName)
            sanitizedBody.firstName = body.firstName.trim();
        if (body.lastName)
            sanitizedBody.lastName = body.lastName.trim();
        if (body.avatar)
            sanitizedBody.avatar = body.avatar.trim();
        if (body.ward)
            sanitizedBody.ward = body.ward.trim();
        if (body.zone)
            sanitizedBody.zone = body.zone.trim();
        if (body.address)
            sanitizedBody.address = body.address.trim();
        // Update profile
        const updatedUser = await auth_service_1.authService.updateProfile(String(req.user.sub), sanitizedBody);
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    }
    catch (err) {
        console.error('Profile update error:', err);
        if (err?.name === 'ZodError') {
            // Format Zod validation errors
            const formattedErrors = err.issues.map((issue) => ({
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
