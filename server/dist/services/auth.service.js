"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcrypt_1 = require("bcrypt");
const jwt_1 = require("../utils/jwt");
const email_1 = __importDefault(require("../utils/email"));
const env_1 = __importDefault(require("../config/env"));
const client_1 = require("@prisma/client");
class AuthService {
    // User registration
    async register(input) {
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email: input.email }
        });
        if (existingUser) {
            throw new Error('User already exists with this email');
        }
        const hashedPassword = await (0, bcrypt_1.hash)(input.password, 12);
        const verificationToken = (0, jwt_1.generateSecureToken)();
        const user = await prisma_1.default.user.create({
            data: {
                email: input.email,
                passwordHash: hashedPassword,
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone || '',
                role: input.role || client_1.UserRole.CUSTOMER,
                status: client_1.UserStatus.PENDING,
                emailVerified: false,
                phoneVerified: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        // Create email verification token
        await prisma_1.default.emailVerificationToken.create({
            data: {
                token: verificationToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + env_1.default.EMAIL_VERIFICATION_TTL_SECONDS * 1000)
            }
        });
        // Send verification email
        if (user.email) {
            await email_1.default.sendEmailVerificationEmail(user.email, verificationToken);
        }
        return {
            success: true,
            message: 'Registration successful. Please check your email to verify your account.',
            user
        };
    }
    // User login
    async login(input) {
        const user = await prisma_1.default.user.findUnique({
            where: { email: input.email }
        });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (user.status === client_1.UserStatus.SUSPENDED) {
            throw new Error('Account is suspended');
        }
        if (user.status === client_1.UserStatus.PENDING && !user.emailVerified) {
            throw new Error('Please verify your email first');
        }
        const isPasswordValid = await (0, bcrypt_1.compare)(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Generate tokens
        const accessToken = (0, jwt_1.signAccessToken)({
            sub: parseInt(user.id.toString()),
            role: user.role,
            email: user.email || undefined,
            phone: user.phone || undefined
        });
        const refreshToken = (0, jwt_1.signRefreshToken)({
            sub: parseInt(user.id.toString()),
            role: user.role,
            email: user.email || undefined,
            phone: user.phone || undefined
        });
        // Store refresh token
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + env_1.default.REFRESH_TTL_SECONDS * 1000)
            }
        });
        // Update last login
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        return {
            accessToken,
            refreshToken,
            accessExpiresIn: env_1.default.ACCESS_TTL_SECONDS,
            refreshExpiresIn: env_1.default.REFRESH_TTL_SECONDS,
        };
    }
    // Refresh access token
    async refreshTokens(refreshToken) {
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const storedToken = await prisma_1.default.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: payload.sub
            }
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }
        // Generate new tokens
        const newAccessToken = (0, jwt_1.signAccessToken)({
            sub: parseInt(payload.sub.toString()),
            role: payload.role,
            email: payload.email,
            phone: payload.phone
        });
        const newRefreshToken = (0, jwt_1.signRefreshToken)({
            sub: parseInt(payload.sub.toString()),
            role: payload.role,
            email: payload.email,
            phone: payload.phone
        });
        // Update refresh token
        await prisma_1.default.refreshToken.update({
            where: { id: storedToken.id },
            data: {
                token: newRefreshToken,
                expiresAt: new Date(Date.now() + env_1.default.REFRESH_TTL_SECONDS * 1000)
            }
        });
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            accessExpiresIn: env_1.default.ACCESS_TTL_SECONDS,
            refreshExpiresIn: env_1.default.REFRESH_TTL_SECONDS
        };
    }
    // Logout
    async logout(refreshToken) {
        await prisma_1.default.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
        return {
            success: true,
            message: 'Logged out successfully'
        };
    }
    // Forgot password
    async forgotPassword(email) {
        const user = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            // Don't reveal if user exists
            return {
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            };
        }
        const resetToken = (0, jwt_1.generateSecureToken)();
        await prisma_1.default.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + env_1.default.PASSWORD_RESET_TTL_SECONDS * 1000)
            }
        });
        if (user.email) {
            await email_1.default.sendPasswordResetEmail(user.email, resetToken);
        }
        return {
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.'
        };
    }
    // Reset password
    async resetPassword(token, newPassword) {
        const resetToken = await prisma_1.default.passwordResetToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });
        if (!resetToken) {
            throw new Error('Invalid or expired reset token');
        }
        const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: hashedPassword }
        });
        await prisma_1.default.passwordResetToken.delete({
            where: { id: resetToken.id }
        });
        // Invalidate all refresh tokens for this user
        await prisma_1.default.refreshToken.deleteMany({
            where: { userId: resetToken.userId }
        });
        return {
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        };
    }
    // Verify email
    async verifyEmail(token) {
        const verificationToken = await prisma_1.default.emailVerificationToken.findFirst({
            where: {
                token,
                expiresAt: { gt: new Date() },
                used: false
            },
            include: { user: true }
        });
        if (!verificationToken) {
            throw new Error('Invalid or expired verification token');
        }
        await prisma_1.default.user.update({
            where: { id: verificationToken.userId },
            data: {
                emailVerified: true,
                status: client_1.UserStatus.ACTIVE
            }
        });
        await prisma_1.default.emailVerificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true }
        });
        if (verificationToken.user.email) {
            await email_1.default.sendWelcomeEmail(verificationToken.user.email, verificationToken.user.firstName);
        }
        return {
            success: true,
            message: 'Email verified successfully. Welcome to Clean App Bangladesh!'
        };
    }
    // Resend verification email
    async resendVerificationEmail(email) {
        const user = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (!user || user.emailVerified) {
            return {
                success: true,
                message: 'If your email needs verification, a new verification link has been sent.'
            };
        }
        const verificationToken = (0, jwt_1.generateSecureToken)();
        // Create new verification token
        await prisma_1.default.emailVerificationToken.create({
            data: {
                token: verificationToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + env_1.default.EMAIL_VERIFICATION_TTL_SECONDS * 1000)
            }
        });
        if (user.email) {
            await email_1.default.sendEmailVerificationEmail(user.email, verificationToken);
        }
        return {
            success: true,
            message: 'If your email needs verification, a new verification link has been sent.'
        };
    }
    // Get user profile
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: parseInt(userId) },
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
            throw new Error('User not found');
        }
        return user;
    }
    // Update profile
    async updateProfile(userId, data) {
        const user = await prisma_1.default.user.update({
            where: { id: parseInt(userId) },
            data,
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
        return user;
    }
    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const isCurrentPasswordValid = await (0, bcrypt_1.compare)(currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 12);
        await prisma_1.default.user.update({
            where: { id: parseInt(userId) },
            data: { passwordHash: hashedPassword }
        });
        // Invalidate all refresh tokens for this user
        await prisma_1.default.refreshToken.deleteMany({
            where: { userId: parseInt(userId) }
        });
        return {
            success: true,
            message: 'Password changed successfully. Please login again with your new password.'
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
