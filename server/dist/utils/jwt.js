"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.signResetToken = signResetToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.verifyResetToken = verifyResetToken;
exports.generateSecureToken = generateSecureToken;
exports.generateOTP = generateOTP;
exports.generateDynamicOTP = generateDynamicOTP;
exports.validateUserSession = validateUserSession;
exports.generateSessionId = generateSessionId;
exports.decodeToken = decodeToken;
exports.isTokenExpired = isTokenExpired;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const prisma_1 = __importDefault(require("./prisma"));
const system_config_service_1 = require("../services/system-config.service");
function signAccessToken(payload) {
    const secret = env_1.default.JWT_ACCESS_SECRET;
    const options = {
        expiresIn: env_1.default.ACCESS_TTL,
        issuer: 'clean-care-app',
        audience: 'clean-care-users'
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function signRefreshToken(payload) {
    const secret = env_1.default.JWT_REFRESH_SECRET;
    const options = {
        expiresIn: env_1.default.REFRESH_TTL,
        issuer: 'clean-care-app',
        audience: 'clean-care-users',
        jwtid: generateSecureToken(16) // Add unique ID to ensure token uniqueness
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function signResetToken(userId) {
    const secret = env_1.default.JWT_ACCESS_SECRET;
    const options = {
        expiresIn: '5m',
        issuer: 'clean-care-app',
        audience: 'clean-care-users',
        subject: userId.toString(),
    };
    return jsonwebtoken_1.default.sign({ purpose: 'password_reset' }, secret, options);
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET, {
            issuer: 'clean-care-app',
            audience: 'clean-care-users'
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw error;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.default.JWT_REFRESH_SECRET, {
            issuer: 'clean-care-app',
            audience: 'clean-care-users'
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Refresh token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid refresh token');
        }
        throw error;
    }
}
function verifyResetToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.default.JWT_ACCESS_SECRET, {
            issuer: 'clean-care-app',
            audience: 'clean-care-users'
        });
        if (payload.purpose !== 'password_reset') {
            throw new Error('Invalid token purpose');
        }
        return payload;
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new Error('Reset token expired');
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new Error('Invalid reset token');
        }
        throw error;
    }
}
function generateSecureToken(length = 32) {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
}
function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}
/**
 * Async wrapper for generating OTP to support dynamic length from DB
 */
async function generateDynamicOTP() {
    let length = 6;
    try {
        const lengthStr = await system_config_service_1.systemConfigService.get('verification_code_length', process.env.VERIFICATION_CODE_LENGTH || '6');
        length = parseInt(lengthStr, 10);
        if (isNaN(length) || length < 4 || length > 10)
            length = 6;
    }
    catch (e) {
        console.warn('Failed to fetch OTP length config, using default 6');
    }
    return generateOTP(length);
}
/**
 * Validate user session and check if user is still active
 * Requirements: 12.1, 12.2, 12.3
 */
async function validateUserSession(userId) {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                status: true,
                role: true
            }
        });
        // Check if user exists and is active
        if (!user) {
            return false;
        }
        // Check if user status is ACTIVE
        if (user.status !== 'ACTIVE') {
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error validating user session:', error);
        return false;
    }
}
/**
 * Generate session ID for tracking
 */
function generateSessionId() {
    return generateSecureToken(32);
}
/**
 * Decode token without verification (for inspection)
 */
function decodeToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || typeof decoded === 'string') {
            return null;
        }
        return decoded;
    }
    catch (error) {
        return null;
    }
}
/**
 * Check if token is expired
 */
function isTokenExpired(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded || typeof decoded === 'string') {
            return true;
        }
        const payload = decoded;
        if (!payload.exp) {
            return true;
        }
        return payload.exp * 1000 < Date.now();
    }
    catch (error) {
        return true;
    }
}
