"use strict";
/**
 * Optimized Authentication Service
 * Implements caching and parallel processing for faster login
 */
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
exports.login = login;
exports.refreshAccessToken = refreshAccessToken;
exports.logout = logout;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const redis_cache_production_1 = __importStar(require("../config/redis-cache-production"));
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
/**
 * Optimized login with caching and parallel processing
 */
async function login(credentials, ip) {
    const { email, phone, password, portal } = credentials;
    // Step 1: Get user from cache or database
    const userCacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.USER, 'login', email || phone || 'unknown');
    let user;
    try {
        // Try cache first
        const cachedUser = await redis_cache_production_1.default.get(userCacheKey);
        if (cachedUser) {
            user = JSON.parse(cachedUser);
        }
    }
    catch (error) {
        console.error('Cache error during login:', error);
    }
    // If not in cache, fetch from database
    if (!user) {
        const whereClause = {};
        if (email) {
            whereClause.email = email.toLowerCase();
        }
        else if (phone) {
            whereClause.phone = phone;
        }
        else {
            throw new Error('Email or phone is required');
        }
        user = await prisma.user.findFirst({
            where: whereClause,
            select: {
                id: true,
                email: true,
                phone: true,
                password: true,
                firstName: true,
                lastName: true,
                role: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                avatar: true,
                status: true,
                emailVerified: true,
                phoneVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Cache user for 15 minutes (without password)
        try {
            const userToCache = { ...user };
            delete userToCache.password;
            await redis_cache_production_1.default.setex(userCacheKey, redis_cache_production_1.CACHE_TTL.USER_PROFILE, JSON.stringify(userToCache));
        }
        catch (error) {
            console.error('Error caching user:', error);
        }
    }
    // Step 2: Check user status
    if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
    }
    // Step 3: Verify portal access
    if (portal === 'admin') {
        const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'WARD_INSPECTOR'];
        if (!adminRoles.includes(user.role)) {
            throw new Error('Access denied. Admin portal requires admin privileges.');
        }
    }
    // Step 4: Validate password
    // Note: Password is not cached for security
    if (!user.password) {
        // Fetch password separately if user was from cache
        const userWithPassword = await prisma.user.findUnique({
            where: { id: user.id },
            select: { password: true },
        });
        user.password = userWithPassword?.password;
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }
    // Step 5: Generate tokens in parallel (OPTIMIZED)
    const userPayload = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        cityCorporationCode: user.cityCorporationCode,
        zoneId: user.zoneId,
        wardId: user.wardId,
    };
    const [accessToken, refreshToken] = await Promise.all([
        (0, jwt_1.generateAccessToken)(userPayload),
        (0, jwt_1.generateRefreshToken)(userPayload),
    ]);
    // Step 6: Update last login (async, don't wait)
    prisma.user.update({
        where: { id: user.id },
        data: {
            lastLogin: new Date(),
            lastLoginIp: ip,
        },
    }).catch(error => {
        console.error('Error updating last login:', error);
    });
    // Step 7: Cache user permissions
    try {
        const permissionsCacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.USER, 'permissions', user.id);
        await redis_cache_production_1.default.setex(permissionsCacheKey, redis_cache_production_1.CACHE_TTL.USER_PERMISSIONS, JSON.stringify({
            role: user.role,
            cityCorporationCode: user.cityCorporationCode,
            zoneId: user.zoneId,
            wardId: user.wardId,
        }));
    }
    catch (error) {
        console.error('Error caching permissions:', error);
    }
    // Remove password from response
    delete user.password;
    return {
        success: true,
        accessToken,
        refreshToken,
        user,
    };
}
/**
 * Refresh access token with caching
 */
async function refreshAccessToken(refreshToken) {
    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    // Get user from cache or database
    const userCacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.USER, decoded.id);
    let user;
    try {
        const cachedUser = await redis_cache_production_1.default.get(userCacheKey);
        if (cachedUser) {
            user = JSON.parse(cachedUser);
        }
    }
    catch (error) {
        console.error('Cache error during token refresh:', error);
    }
    if (!user) {
        user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                role: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                avatar: true,
                status: true,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Cache user
        try {
            await redis_cache_production_1.default.setex(userCacheKey, redis_cache_production_1.CACHE_TTL.USER_PROFILE, JSON.stringify(user));
        }
        catch (error) {
            console.error('Error caching user:', error);
        }
    }
    if (user.status !== 'ACTIVE') {
        throw new Error('Account is not active');
    }
    // Generate new tokens
    const userPayload = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        cityCorporationCode: user.cityCorporationCode,
        zoneId: user.zoneId,
        wardId: user.wardId,
    };
    const [newAccessToken, newRefreshToken] = await Promise.all([
        (0, jwt_1.generateAccessToken)(userPayload),
        (0, jwt_1.generateRefreshToken)(userPayload),
    ]);
    return {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user,
    };
}
/**
 * Logout and invalidate cache
 */
async function logout(userId) {
    // Invalidate user cache
    const userCacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.USER, userId);
    const permissionsCacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.USER, 'permissions', userId);
    try {
        await Promise.all([
            (0, redis_cache_production_1.invalidateCache)(userCacheKey),
            (0, redis_cache_production_1.invalidateCache)(permissionsCacheKey),
        ]);
    }
    catch (error) {
        console.error('Error invalidating cache during logout:', error);
    }
}
/**
 * Verify refresh token (placeholder - implement with JWT)
 */
async function verifyRefreshToken(token) {
    // Implement JWT verification
    // This is a placeholder
    return { id: 1 };
}
exports.default = {
    login,
    refreshAccessToken,
    logout,
};
