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
const city_corporation_service_1 = __importDefault(require("./city-corporation.service"));
// import thanaService from './thana.service'; // Thana service disabled - using Zone/Ward now
const zone_service_1 = __importDefault(require("./zone.service"));
const ward_service_1 = __importDefault(require("./ward.service"));
class AuthService {
    // User registration
    async register(input) {
        // Check if user exists by phone (required field)
        const existingUserByPhone = await prisma_1.default.user.findUnique({
            where: { phone: input.phone }
        });
        if (existingUserByPhone) {
            throw new Error('User already exists with this phone number');
        }
        // Check if user exists by email (if provided)
        if (input.email) {
            const existingUserByEmail = await prisma_1.default.user.findUnique({
                where: { email: input.email }
            });
            if (existingUserByEmail) {
                throw new Error('User already exists with this email');
            }
        }
        // Validate city corporation if provided
        if (input.cityCorporationCode) {
            try {
                const cityCorporation = await city_corporation_service_1.default.getCityCorporationByCode(input.cityCorporationCode);
                // Check if city corporation is active
                if (cityCorporation.status !== 'ACTIVE') {
                    throw new Error(`City Corporation ${input.cityCorporationCode} is not currently accepting registrations`);
                }
                // Validate zone-ward hierarchy if provided
                if (input.zoneId && input.wardId) {
                    // Validate zone exists and belongs to city corporation
                    const zone = await zone_service_1.default.getZoneById(input.zoneId);
                    const zoneBelongsToCityCorporation = await zone_service_1.default.validateZoneBelongsToCityCorporation(input.zoneId, cityCorporation.id);
                    if (!zoneBelongsToCityCorporation) {
                        throw new Error(`Selected zone does not belong to ${cityCorporation.name}`);
                    }
                    // Check if zone is active
                    const isZoneActive = await zone_service_1.default.isActive(input.zoneId);
                    if (!isZoneActive) {
                        throw new Error('Selected zone is not currently available');
                    }
                    // Validate ward exists and belongs to zone
                    const ward = await ward_service_1.default.getWardById(input.wardId);
                    const wardBelongsToZone = await ward_service_1.default.validateWardBelongsToZone(input.wardId, input.zoneId);
                    if (!wardBelongsToZone) {
                        throw new Error(`Selected ward does not belong to Zone ${zone.zoneNumber}`);
                    }
                    // Check if ward is active
                    const isWardActive = await ward_service_1.default.isActive(input.wardId);
                    if (!isWardActive) {
                        throw new Error('Selected ward is not currently available');
                    }
                }
                else if (input.zoneId || input.wardId) {
                    // If only one is provided, throw error
                    throw new Error('Both zone and ward must be provided together');
                }
                // Legacy: Validate ward if provided (old string-based ward)
                if (input.ward) {
                    const wardNum = parseInt(input.ward);
                    if (isNaN(wardNum)) {
                        throw new Error('Ward must be a valid number');
                    }
                    const isValidWard = await city_corporation_service_1.default.validateWard(input.cityCorporationCode, wardNum);
                    if (!isValidWard) {
                        throw new Error(`Ward must be between ${cityCorporation.minWard} and ${cityCorporation.maxWard} for ${cityCorporation.name}`);
                    }
                }
                // Legacy thana validation removed - using Zone/Ward now
            }
            catch (error) {
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error('Invalid city corporation');
            }
        }
        const hashedPassword = await (0, bcrypt_1.hash)(input.password, 12);
        const verificationToken = (0, jwt_1.generateSecureToken)();
        const verificationCode = (0, jwt_1.generateOTP)(6); // Generate 6-digit OTP
        const emailVerificationEnabled = env_1.default.EMAIL_VERIFICATION_ENABLED;
        const user = await prisma_1.default.user.create({
            data: {
                email: input.email,
                passwordHash: hashedPassword,
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone || '',
                address: input.address,
                cityCorporationCode: input.cityCorporationCode,
                zoneId: input.zoneId,
                wardId: input.wardId,
                wardImageCount: 0, // Initialize to 0 for new users
                role: input.role || 'ADMIN',
                status: emailVerificationEnabled ? 'PENDING' : 'ACTIVE',
                emailVerified: !emailVerificationEnabled, // Mark as verified if verification is disabled
                phoneVerified: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                address: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                wardImageCount: true,
                role: true,
                status: true,
                createdAt: true
            }
        });
        // Only create verification token and send email if verification is enabled
        if (emailVerificationEnabled) {
            // Create email verification token with OTP code
            await prisma_1.default.emailVerificationToken.create({
                data: {
                    token: verificationToken,
                    code: verificationCode,
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry for OTP
                }
            });
            // Send verification email with OTP code
            if (user.email) {
                await email_1.default.sendEmailVerificationEmail(user.email, verificationCode);
            }
        }
        return {
            success: true,
            message: emailVerificationEnabled
                ? 'Registration successful. Please verify your email.'
                : 'Registration successful. You can now login.',
            data: {
                email: user.email,
                requiresVerification: emailVerificationEnabled
            }
        };
    }
    // User login
    async login(input) {
        console.log('Login input received:', input);
        // Find user by email or phone
        let user;
        if (input.email) {
            console.log('Finding user by email:', input.email);
            user = await prisma_1.default.user.findUnique({
                where: { email: input.email }
            });
        }
        else if (input.phone) {
            console.log('Finding user by phone:', input.phone);
            user = await prisma_1.default.user.findUnique({
                where: { phone: input.phone }
            });
        }
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (user.status === 'SUSPENDED') {
            throw new Error('Account is suspended');
        }
        // Check if email verification is enabled and if email is verified for pending accounts
        const emailVerificationEnabled = env_1.default.EMAIL_VERIFICATION_ENABLED;
        console.log('Login - Email verification enabled:', emailVerificationEnabled);
        if (emailVerificationEnabled && user.status === 'PENDING' && !user.emailVerified) {
            throw new Error('Please verify your email first');
        }
        const isPasswordValid = await (0, bcrypt_1.compare)(input.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }
        // Admin রোল ন্যারো করা
        const toAdminRole = (r) => {
            if (r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'MASTER_ADMIN')
                return r;
            throw new Error('Access denied. Admin privileges required.');
        };
        // Generate tokens
        try {
            const accessToken = (0, jwt_1.signAccessToken)({
                id: parseInt(user.id.toString()),
                sub: parseInt(user.id.toString()),
                role: toAdminRole(user.role),
                email: user.email ?? undefined,
                phone: user.phone ?? undefined,
                zoneId: user.zoneId,
                wardId: user.wardId
            });
            const refreshToken = (0, jwt_1.signRefreshToken)({
                id: parseInt(user.id.toString()),
                sub: parseInt(user.id.toString()),
                role: toAdminRole(user.role),
                email: user.email ?? undefined,
                phone: user.phone ?? undefined,
                zoneId: user.zoneId,
                wardId: user.wardId
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
        catch (error) {
            console.error('Token generation error:', error);
            throw new Error('Failed to generate authentication tokens');
        }
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
            id: parseInt(payload.sub.toString()),
            sub: parseInt(payload.sub.toString()),
            role: payload.role,
            email: payload.email,
            phone: payload.phone,
            zoneId: payload.zoneId,
            wardId: payload.wardId
        });
        const newRefreshToken = (0, jwt_1.signRefreshToken)({
            id: parseInt(payload.sub.toString()),
            sub: parseInt(payload.sub.toString()),
            role: payload.role,
            email: payload.email,
            phone: payload.phone,
            zoneId: payload.zoneId,
            wardId: payload.wardId
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
    // Verify email with OTP code
    async verifyEmailWithCode(email, code) {
        const user = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.emailVerified) {
            return {
                success: true,
                message: 'Email is already verified. You can login now.'
            };
        }
        const verificationToken = await prisma_1.default.emailVerificationToken.findFirst({
            where: {
                userId: user.id,
                code: code,
                expiresAt: { gt: new Date() },
                used: false
            },
            include: { user: true }
        });
        if (!verificationToken) {
            throw new Error('Invalid or expired verification code');
        }
        await prisma_1.default.user.update({
            where: { id: verificationToken.userId },
            data: {
                emailVerified: true,
                status: 'ACTIVE'
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
            message: 'Email verified successfully. Welcome to Clean Care Bangladesh!'
        };
    }
    // Verify email (legacy - for backward compatibility with token URLs)
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
                status: 'ACTIVE'
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
            message: 'Email verified successfully. Welcome to Clean Care Bangladesh!'
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
                message: 'If your email needs verification, a new verification code has been sent.'
            };
        }
        const verificationToken = (0, jwt_1.generateSecureToken)();
        const verificationCode = (0, jwt_1.generateOTP)(6); // Generate 6-digit OTP
        // Mark old tokens as used
        await prisma_1.default.emailVerificationToken.updateMany({
            where: {
                userId: user.id,
                used: false
            },
            data: {
                used: true
            }
        });
        // Create new verification token with OTP code
        await prisma_1.default.emailVerificationToken.create({
            data: {
                token: verificationToken,
                code: verificationCode,
                userId: user.id,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry for OTP
            }
        });
        if (user.email) {
            await email_1.default.sendEmailVerificationEmail(user.email, verificationCode);
        }
        return {
            success: true,
            message: 'If your email needs verification, a new verification code has been sent.'
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
                phoneVerified: true,
                avatar: true,
                address: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                wardImageCount: true,
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
        // Validate city corporation if being updated
        if (data.cityCorporationCode) {
            try {
                const cityCorporation = await city_corporation_service_1.default.getCityCorporationByCode(data.cityCorporationCode);
                // Check if city corporation is active
                if (cityCorporation.status !== 'ACTIVE') {
                    throw new Error(`City Corporation ${data.cityCorporationCode} is not currently available`);
                }
                // Validate zone-ward hierarchy if provided
                if (data.zoneId && data.wardId) {
                    // Validate zone exists and belongs to city corporation
                    const zone = await zone_service_1.default.getZoneById(data.zoneId);
                    const zoneBelongsToCityCorporation = await zone_service_1.default.validateZoneBelongsToCityCorporation(data.zoneId, cityCorporation.id);
                    if (!zoneBelongsToCityCorporation) {
                        throw new Error(`Selected zone does not belong to ${cityCorporation.name}`);
                    }
                    // Check if zone is active
                    const isZoneActive = await zone_service_1.default.isActive(data.zoneId);
                    if (!isZoneActive) {
                        throw new Error('Selected zone is not currently available');
                    }
                    // Validate ward exists and belongs to zone
                    const ward = await ward_service_1.default.getWardById(data.wardId);
                    const wardBelongsToZone = await ward_service_1.default.validateWardBelongsToZone(data.wardId, data.zoneId);
                    if (!wardBelongsToZone) {
                        throw new Error(`Selected ward does not belong to Zone ${zone.zoneNumber}`);
                    }
                    // Check if ward is active
                    const isWardActive = await ward_service_1.default.isActive(data.wardId);
                    if (!isWardActive) {
                        throw new Error('Selected ward is not currently available');
                    }
                }
                else if (data.zoneId || data.wardId) {
                    // If only one is provided, throw error
                    throw new Error('Both zone and ward must be provided together');
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error('Invalid city corporation');
            }
        }
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
                phoneVerified: true,
                avatar: true,
                address: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                wardImageCount: true,
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
    // Clean up expired pending accounts (24 hours)
    async cleanupExpiredAccounts() {
        const cleanupHours = parseInt(process.env.PENDING_ACCOUNT_CLEANUP_HOURS || '24');
        const expiryTime = new Date(Date.now() - (cleanupHours * 60 * 60 * 1000));
        // Query users with "pending_verification" status older than cleanup hours
        const expiredUsers = await prisma_1.default.user.findMany({
            where: {
                createdAt: { lt: expiryTime },
                emailVerified: false,
                status: 'PENDING'
            },
            select: {
                id: true
            }
        });
        // Delete expired pending accounts
        if (expiredUsers.length > 0) {
            const result = await prisma_1.default.user.deleteMany({
                where: {
                    id: {
                        in: expiredUsers.map(u => u.id)
                    }
                }
            });
            console.log(`Cleaned up ${result.count} expired pending accounts`);
            return result;
        }
        return { count: 0 };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
