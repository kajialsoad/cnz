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
const auth_service_1 = require("../services/auth.service");
const zod_1 = require("zod");
const env_1 = __importDefault(require("../config/env"));
console.log('🔧 Loading admin.auth.controller.ts...');
const adminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
    rememberMe: zod_1.z.boolean().optional().default(false),
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
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
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
// Admin profile - returns admin user info
async function adminMe(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        // Check if user has admin role
        if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }
        const user = await auth_service_1.authService.getProfile(String(req.user.sub));
        return res.status(200).json({ user });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Failed to load admin profile' });
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
