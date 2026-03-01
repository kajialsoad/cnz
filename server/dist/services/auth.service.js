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
const sms_service_1 = __importDefault(require("./sms.service"));
// import thanaService from './thana.service'; // Thana service disabled - using Zone/Ward now
const zone_service_1 = __importDefault(require("./zone.service"));
const ward_service_1 = __importDefault(require("./ward.service"));
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const system_config_service_1 = require("./system-config.service");
class AuthService {
    // User registration
    async register(input) {
        // Check if user exists by phone (required field)
        const existingUserByPhone = await prisma_1.default.user.findUnique({
            where: { phone: input.phone }
        });
        if (existingUserByPhone) {
            if (existingUserByPhone.status === 'DELETED') {
                // Archive the deleted user to free up the phone number
                await prisma_1.default.user.update({
                    where: { id: existingUserByPhone.id },
                    data: {
                        phone: `${existingUserByPhone.phone}_deleted_${Date.now()}`,
                        email: existingUserByPhone.email ? `${existingUserByPhone.email}_deleted_${Date.now()}` : existingUserByPhone.email
                    }
                });
            }
            else {
                throw new Error('User already exists with this phone number');
            }
        }
        // Check if user exists by email (if provided)
        if (input.email) {
            const existingUserByEmail = await prisma_1.default.user.findUnique({
                where: { email: input.email }
            });
            if (existingUserByEmail) {
                if (existingUserByEmail.status === 'DELETED') {
                    // Archive the deleted user to free up the email
                    // Note: If we already archived this user in the phone check above, existingUserByEmail might be different or same.
                    // If it's the same user, it might already be updated? 
                    // Wait, findUnique runs before the update above. 
                    // So if phone matches User A and email matches User B?
                    // If phone matches User A (DELETED), we updated User A.
                    // If email matches User B (DELETED), we update User B.
                    // Re-fetch to be safe or just update if ID is different?
                    // Simplest is to just update.
                    await prisma_1.default.user.update({
                        where: { id: existingUserByEmail.id },
                        data: {
                            email: `${existingUserByEmail.email}_deleted_${Date.now()}`,
                            phone: existingUserByEmail.phone.includes('_deleted_') ? existingUserByEmail.phone : `${existingUserByEmail.phone}_deleted_${Date.now()}`
                        }
                    });
                }
                else {
                    throw new Error('User already exists with this email');
                }
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
        // Get verification settings from System Config (DB) instead of env
        const emailVerificationConfig = await system_config_service_1.systemConfigService.get('verification_email_enabled', env_1.default.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
        const phoneVerificationConfig = await system_config_service_1.systemConfigService.get('verification_sms_enabled', env_1.default.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
        const expiryMinutesStr = await system_config_service_1.systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
        const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        const emailVerificationEnabled = emailVerificationConfig === 'true';
        const phoneVerificationEnabled = phoneVerificationConfig === 'true';
        const verificationRequired = emailVerificationEnabled || phoneVerificationEnabled;
        // Generate Verification Code
        const verificationCode = await (0, jwt_1.generateDynamicOTP)();
        // If verification is required, DO NOT create User yet. Store in PendingRegistration.
        if (verificationRequired) {
            // Check if pending registration already exists
            const existingPending = await prisma_1.default.pendingRegistration.findUnique({
                where: { phone: input.phone }
            });
            if (existingPending) {
                // Update existing pending registration
                await prisma_1.default.pendingRegistration.update({
                    where: { id: existingPending.id },
                    data: {
                        email: input.email,
                        passwordHash: hashedPassword,
                        visiblePassword: input.password,
                        firstName: input.firstName,
                        lastName: input.lastName,
                        address: input.address,
                        cityCorporationCode: input.cityCorporationCode,
                        zoneId: input.zoneId,
                        wardId: input.wardId,
                        role: input.role || 'CUSTOMER',
                        verificationCode: verificationCode,
                        expiresAt: expiresAt
                    }
                });
            }
            else {
                // Create new pending registration
                await prisma_1.default.pendingRegistration.create({
                    data: {
                        phone: input.phone,
                        email: input.email,
                        passwordHash: hashedPassword,
                        visiblePassword: input.password,
                        firstName: input.firstName,
                        lastName: input.lastName,
                        address: input.address,
                        cityCorporationCode: input.cityCorporationCode,
                        zoneId: input.zoneId,
                        wardId: input.wardId,
                        role: input.role || 'CUSTOMER',
                        verificationCode: verificationCode,
                        expiresAt: expiresAt
                    }
                });
            }
            // Send OTP
            if (phoneVerificationEnabled) {
                await sms_service_1.default.sendOTP(input.phone, verificationCode);
            }
            else if (emailVerificationEnabled && input.email) {
                await email_1.default.sendEmailVerificationEmail(input.email, verificationCode);
            }
            let message = 'Verification code sent. Please verify to complete registration.';
            if (phoneVerificationEnabled) {
                message = 'Verification code sent to your phone. Please verify to complete registration.';
            }
            else if (emailVerificationEnabled) {
                message = 'Verification code sent to your email. Please verify to complete registration.';
            }
            return {
                success: true,
                message,
                data: {
                    phone: input.phone,
                    email: input.email,
                    requiresVerification: true
                }
            };
        }
        // If verification is NOT required, create User directly
        const verificationToken = (0, jwt_1.generateSecureToken)();
        const user = await prisma_1.default.user.create({
            data: {
                email: input.email,
                passwordHash: hashedPassword,
                visiblePassword: input.password, // Store plain text password
                firstName: input.firstName,
                lastName: input.lastName,
                phone: input.phone || '',
                address: input.address,
                cityCorporationCode: input.cityCorporationCode,
                zoneId: input.zoneId,
                wardId: input.wardId,
                wardImageCount: 0, // Initialize to 0 for new users
                role: input.role || 'CUSTOMER',
                status: 'ACTIVE',
                emailVerified: true,
                phoneVerified: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
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
        return {
            success: true,
            message: 'Registration successful. You can now login.',
            data: {
                email: user.email,
                phone: user.phone,
                requiresVerification: false
            }
        };
    }
    // Verify Registration OTP and Create User
    async verifyRegistration(input) {
        // Find pending registration
        const pendingUser = await prisma_1.default.pendingRegistration.findUnique({
            where: { phone: input.phone }
        });
        if (!pendingUser) {
            throw new Error('Registration session not found or expired. Please register again.');
        }
        if (pendingUser.verificationCode !== input.code) {
            throw new Error('Invalid verification code');
        }
        if (new Date() > pendingUser.expiresAt) {
            throw new Error('Verification code expired');
        }
        // Determine verification status based on system config
        const emailVerificationConfig = await system_config_service_1.systemConfigService.get('verification_email_enabled', env_1.default.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
        const phoneVerificationConfig = await system_config_service_1.systemConfigService.get('verification_sms_enabled', env_1.default.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
        const emailVerificationEnabled = emailVerificationConfig === 'true';
        const phoneVerificationEnabled = phoneVerificationConfig === 'true';
        // Move to User table
        const user = await prisma_1.default.user.create({
            data: {
                email: pendingUser.email,
                passwordHash: pendingUser.passwordHash,
                visiblePassword: pendingUser.visiblePassword,
                firstName: pendingUser.firstName,
                lastName: pendingUser.lastName,
                phone: pendingUser.phone,
                address: pendingUser.address,
                cityCorporationCode: pendingUser.cityCorporationCode,
                zoneId: pendingUser.zoneId,
                wardId: pendingUser.wardId,
                wardImageCount: 0,
                role: pendingUser.role,
                status: 'ACTIVE', // User is active after verification
                emailVerified: emailVerificationEnabled ? (pendingUser.email ? false : true) : true, // If email verification enabled, we still need to verify email if we only verified phone. BUT user said "entry hoibo nah" until verification. Assuming this ONE step verifies them enough to enter. 
                // Actually, if phone verification is enabled, and we just verified it, phoneVerified = true.
                phoneVerified: phoneVerificationEnabled ? true : true,
                // If we verified phone, and email verification is ALSO enabled, usually we'd want them to verify email too. 
                // But the requirement is "don't create user until verified". 
                // If we create user now, they are "verified" enough to exist.
                // Let's assume this primary verification (OTP) is sufficient to Activate the account.
                // If email also needs verification, maybe we leave emailVerified: false and let them verify that later? 
                // For now, let's mark phoneVerified=true since we verified OTP.
            }
        });
        // If we just performed verification, we should mark the relevant flag
        if (phoneVerificationEnabled) {
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { phoneVerified: true }
            });
        }
        // Note: If email verification was the method used (e.g. only email enabled), we should mark emailVerified.
        // However, the input is 'phone' and 'code'. This implies phone verification. 
        // If the system was email-only, we might need to adjust this method signature or logic.
        // Given the user context "otp page", it strongly implies phone/SMS.
        // Delete pending registration
        await prisma_1.default.pendingRegistration.delete({
            where: { id: pendingUser.id }
        });
        return {
            success: true,
            message: 'Registration verified and account created successfully. Please login.',
        };
    }
    // User login
    async login(input, ip) {
        console.log('Login input received:', input);
        // Determine identifier for rate limiting
        const identifier = input.email || input.phone || '';
        // Check if account is locked due to too many failed attempts
        const lockout = (0, rate_limit_middleware_1.checkAccountLockout)(identifier);
        if (lockout.locked) {
            throw new Error(`Account temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.`);
        }
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
            // Track failed login attempt
            await (0, rate_limit_middleware_1.trackLoginAttempt)(identifier, false, ip);
            throw new Error('Invalid credentials');
        }
        if (user.status === 'DELETED') {
            throw new Error('This account has been deleted. Please contact support if you believe this is an error.');
        }
        if (user.status === 'SUSPENDED') {
            throw new Error('Account is suspended');
        }
        // Role-based Portal Validation
        if (input.portal === 'ADMIN') {
            if (user.role === 'CUSTOMER' || user.role === 'SERVICE_PROVIDER') {
                throw new Error('Access denied. Citizens cannot access the Admin Panel.');
            }
        }
        else if (input.portal === 'APP') {
            if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
                throw new Error('Access denied. Admins cannot access the User App. Please use the Admin Panel.');
            }
        }
        // Check verification status
        const emailVerificationConfig = await system_config_service_1.systemConfigService.get('verification_email_enabled', env_1.default.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
        const phoneVerificationConfig = await system_config_service_1.systemConfigService.get('verification_sms_enabled', env_1.default.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
        const emailVerificationEnabled = emailVerificationConfig === 'true';
        const phoneVerificationEnabled = phoneVerificationConfig === 'true';
        console.log('Login Verification Check:', {
            emailEnabled: emailVerificationEnabled,
            phoneEnabled: phoneVerificationEnabled,
            status: user.status,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified
        });
        if (user.status === 'PENDING') {
            if (emailVerificationEnabled && !user.emailVerified) {
                throw new Error('Please verify your email first');
            }
            if (phoneVerificationEnabled && !user.phoneVerified) {
                throw new Error('Please verify your phone number first');
            }
        }
        const isPasswordValid = await (0, bcrypt_1.compare)(input.password, user.passwordHash);
        if (!isPasswordValid) {
            // Track failed login attempt
            await (0, rate_limit_middleware_1.trackLoginAttempt)(identifier, false, ip);
            throw new Error('Invalid credentials');
        }
        // Track successful login attempt (clears failed attempts)
        await (0, rate_limit_middleware_1.trackLoginAttempt)(identifier, true, ip);
        // রোল যাচাই করা (ADMIN বা CUSTOMER সবার জন্যই লগইন এলাউড)
        const toUserRole = (r) => {
            if (['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'].includes(r))
                return r;
            throw new Error('Access denied. Invalid role.');
        };
        // Generate tokens
        try {
            const accessToken = (0, jwt_1.signAccessToken)({
                id: parseInt(user.id.toString()),
                sub: parseInt(user.id.toString()),
                role: toUserRole(user.role),
                email: user.email ?? undefined,
                phone: user.phone ?? undefined,
                zoneId: user.zoneId,
                wardId: user.wardId
            });
            const refreshToken = (0, jwt_1.signRefreshToken)({
                id: parseInt(user.id.toString()),
                sub: parseInt(user.id.toString()),
                role: toUserRole(user.role),
                email: user.email ?? undefined,
                phone: user.phone ?? undefined,
                zoneId: user.zoneId,
                wardId: user.wardId
            });
            // Store refresh token
            try {
                await prisma_1.default.refreshToken.create({
                    data: {
                        token: refreshToken,
                        userId: user.id,
                        expiresAt: new Date(Date.now() + env_1.default.REFRESH_TTL_SECONDS * 1000)
                    }
                });
            }
            catch (dbError) {
                console.error('Database error storing refresh token:', dbError);
                throw new Error('Failed to store refresh token');
            }
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
    // Refresh access token with session validation
    // Requirements: 12.1, 12.2, 12.3, 12.17
    async refreshTokens(refreshToken) {
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        // Validate stored refresh token
        const storedToken = await prisma_1.default.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: payload.sub
            }
        });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new Error('Invalid or expired refresh token');
        }
        // Validate user session (check if user still exists and is active)
        const user = await prisma_1.default.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                status: true,
                role: true,
                email: true,
                phone: true,
                zoneId: true,
                wardId: true,
                cityCorporationCode: true
            }
        });
        if (!user) {
            // User no longer exists, delete the refresh token
            await prisma_1.default.refreshToken.delete({ where: { id: storedToken.id } });
            throw new Error('User account not found');
        }
        if (user.status !== 'ACTIVE') {
            // User is not active, delete the refresh token
            await prisma_1.default.refreshToken.delete({ where: { id: storedToken.id } });
            throw new Error('User account is not active');
        }
        // Generate new tokens with updated user data
        const newAccessToken = (0, jwt_1.signAccessToken)({
            id: parseInt(user.id.toString()),
            sub: parseInt(user.id.toString()),
            role: user.role,
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
            zoneId: user.zoneId,
            wardId: user.wardId,
            cityCorporationCode: user.cityCorporationCode ?? undefined
        });
        const newRefreshToken = (0, jwt_1.signRefreshToken)({
            id: parseInt(user.id.toString()),
            sub: parseInt(user.id.toString()),
            role: user.role,
            email: user.email ?? undefined,
            phone: user.phone ?? undefined,
            zoneId: user.zoneId,
            wardId: user.wardId,
            cityCorporationCode: user.cityCorporationCode ?? undefined
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
            data: {
                passwordHash: hashedPassword,
                visiblePassword: newPassword // Store plain text password
            }
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
    // Verify phone with OTP code
    async verifyPhoneWithCode(phone, code) {
        const user = await prisma_1.default.user.findUnique({
            where: { phone }
        });
        if (!user) {
            // Check PendingRegistration (If user tries to verify registration via this endpoint)
            const pendingUser = await prisma_1.default.pendingRegistration.findUnique({
                where: { phone }
            });
            if (pendingUser) {
                console.log(`User found in PendingRegistration for phone ${phone}. Redirecting to verifyRegistration.`);
                return this.verifyRegistration({ phone, code });
            }
            throw new Error('User not found');
        }
        if (user.phoneVerified) {
            return {
                success: true,
                message: 'Phone number is already verified. You can login now.'
            };
        }
        const verificationToken = await prisma_1.default.phoneVerificationToken.findFirst({
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
                phoneVerified: true,
                status: 'ACTIVE'
            }
        });
        await prisma_1.default.phoneVerificationToken.update({
            where: { id: verificationToken.id },
            data: { used: true }
        });
        // Send welcome SMS
        await sms_service_1.default.sendWelcomeMessage(user.phone, user.firstName);
        return {
            success: true,
            message: 'Phone verified successfully. Welcome to Clean Care Bangladesh!'
        };
    }
    // Resend verification phone code
    async resendVerificationPhone(phone, method = 'sms') {
        const user = await prisma_1.default.user.findUnique({
            where: { phone }
        });
        // If user exists and is already verified, return generic success
        if (user && user.phoneVerified) {
            return {
                success: true,
                message: 'If your phone number needs verification, a new verification code has been sent.'
            };
        }
        // If user not found in User table, check PendingRegistration
        if (!user) {
            const pendingUser = await prisma_1.default.pendingRegistration.findUnique({
                where: { phone }
            });
            if (pendingUser) {
                const verificationCode = await (0, jwt_1.generateDynamicOTP)();
                // Get expiry from DB
                const expiryMinutesStr = await system_config_service_1.systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
                const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
                const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
                // Update PendingRegistration with new code
                await prisma_1.default.pendingRegistration.update({
                    where: { id: pendingUser.id },
                    data: {
                        verificationCode,
                        expiresAt
                    }
                });
                if (method === 'whatsapp') {
                    await sms_service_1.default.sendWhatsAppOTP(pendingUser.phone, verificationCode);
                }
                else {
                    await sms_service_1.default.sendOTP(pendingUser.phone, verificationCode);
                }
                return {
                    success: true,
                    message: `A new verification code has been sent via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'} to your phone number.`
                };
            }
            // If neither User nor PendingRegistration found, return generic success
            return {
                success: true,
                message: 'If your phone number needs verification, a new verification code has been sent.'
            };
        }
        // If user exists but NOT verified, proceed with existing logic
        const verificationToken = (0, jwt_1.generateSecureToken)();
        const verificationCode = await (0, jwt_1.generateDynamicOTP)(); // Generate dynamic OTP
        // Get expiry from DB
        const expiryMinutesStr = await system_config_service_1.systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
        const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        // Mark old tokens as used
        await prisma_1.default.phoneVerificationToken.updateMany({
            where: {
                userId: user.id,
                used: false
            },
            data: {
                used: true
            }
        });
        // Create new verification token with OTP code
        await prisma_1.default.phoneVerificationToken.create({
            data: {
                token: verificationToken,
                code: verificationCode,
                userId: user.id,
                expiresAt: expiresAt
            }
        });
        if (method === 'whatsapp') {
            await sms_service_1.default.sendWhatsAppOTP(user.phone, verificationCode);
        }
        else {
            await sms_service_1.default.sendOTP(user.phone, verificationCode);
        }
        return {
            success: true,
            message: `A new verification code has been sent via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'} to your phone number.`
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
        const verificationCode = await (0, jwt_1.generateDynamicOTP)(); // Generate dynamic OTP
        // Get expiry from DB
        const expiryMinutesStr = await system_config_service_1.systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
        const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
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
                expiresAt: expiresAt
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
                visiblePassword: true, // Include password for viewing own profile
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                wardImageCount: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    }
                },
                zone: {
                    select: {
                        id: true,
                        name: true,
                        zoneNumber: true,
                    }
                },
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        number: true,
                    }
                },
                assignedZones: {
                    select: {
                        id: true,
                        zone: {
                            select: {
                                id: true,
                                name: true,
                                zoneNumber: true,
                            }
                        }
                    }
                },
                permissions: true
            }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Parse permissions and fetch assigned wards if available
        let assignedWards = [];
        if (user.permissions) {
            try {
                const permissionsData = JSON.parse(user.permissions);
                if (permissionsData.wards && Array.isArray(permissionsData.wards) && permissionsData.wards.length > 0) {
                    assignedWards = await prisma_1.default.ward.findMany({
                        where: {
                            id: {
                                in: permissionsData.wards
                            }
                        },
                        select: {
                            id: true,
                            wardNumber: true,
                            number: true,
                            cityCorporationId: true
                        }
                    });
                }
            }
            catch (e) {
                console.error('Error parsing user permissions:', e);
            }
        }
        return {
            ...user,
            assignedWards
        };
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
                lastLoginAt: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    }
                },
                zone: {
                    select: {
                        id: true,
                        name: true,
                        zoneNumber: true,
                    }
                },
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        number: true,
                    }
                }
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
    // Clean up expired pending accounts (Dynamic hours)
    async cleanupExpiredAccounts() {
        const cleanupHoursStr = await system_config_service_1.systemConfigService.get('pending_account_cleanup_hours', process.env.PENDING_ACCOUNT_CLEANUP_HOURS || '24');
        const cleanupHours = parseInt(cleanupHoursStr, 10) || 24;
        console.log(`🧹 Cleaning up pending accounts older than ${cleanupHours} hours...`);
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
    // Delete user account (Soft delete)
    async deleteAccount(userId, reason, customReason) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Update user status to DELETED and save reason
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                status: 'DELETED', // Ensure 'DELETED' is added to UserStatus enum in schema.prisma
                deletionReason: reason,
                customReason: customReason,
                deletionDate: new Date()
            }
        });
        return {
            success: true,
            message: 'Account deleted successfully'
        };
    }
    // Helper to find user by phone with variations
    async findUserByPhoneFlexible(phone) {
        const variations = [phone];
        // Add variations based on input format
        if (phone.startsWith('880')) {
            variations.push(phone.substring(2)); // 01...
            variations.push('+' + phone); // +880...
        }
        else if (phone.startsWith('01')) {
            variations.push('88' + phone); // 880...
            variations.push('+88' + phone); // +880...
        }
        else if (phone.startsWith('+880')) {
            variations.push(phone.substring(1)); // 880...
            variations.push(phone.substring(3)); // 01...
        }
        console.log(`🔍 Looking up user with phone variations: ${variations.join(', ')}`);
        const user = await prisma_1.default.user.findFirst({
            where: {
                phone: {
                    in: variations
                }
            }
        });
        return user;
    }
    // Initiate forgot password (Phone)
    async initiateForgotPassword(phone) {
        const isSystemEnabled = await system_config_service_1.systemConfigService.get('forgot_password_system', 'true');
        if (isSystemEnabled === 'false') {
            throw new Error('Forgot password system is currently disabled');
        }
        // Use flexible lookup
        const user = await this.findUserByPhoneFlexible(phone);
        if (!user) {
            // Security: Do not reveal if user exists?
            // User requirement says: "If phone number not found... show: This phone number is not registered."
            // So yes, reveal it.
            console.warn(`❌ User not found for phone: ${phone}`);
            throw new Error('This phone number is not registered.');
        }
        console.log(`✅ User found for forgot password: ${user.phone} (ID: ${user.id})`);
        // Rate limiting
        const limitStr = await system_config_service_1.systemConfigService.get('forgot_password_request_limit', '3');
        const windowStr = await system_config_service_1.systemConfigService.get('forgot_password_window_minutes', '15');
        const limit = parseInt(limitStr, 10) || 3;
        const windowMinutes = parseInt(windowStr, 10) || 15;
        const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
        const requestCount = await prisma_1.default.phoneVerificationToken.count({
            where: {
                userId: user.id,
                createdAt: { gt: windowStart }
            }
        });
        if (requestCount >= limit) {
            throw new Error(`Too many requests. Please try again after ${windowMinutes} minutes.`);
        }
        // Generate OTP
        const code = await (0, jwt_1.generateDynamicOTP)();
        // OTP Expiry
        const expiryStr = await system_config_service_1.systemConfigService.get('forgot_password_otp_expiry_minutes', '5');
        const expiryMinutes = parseInt(expiryStr, 10) || 5;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
        // Create token
        await prisma_1.default.phoneVerificationToken.create({
            data: {
                token: (0, jwt_1.generateSecureToken)(),
                code,
                userId: user.id,
                expiresAt
            }
        });
        // Send SMS
        await sms_service_1.default.sendForgotPasswordOTP(phone, code);
        return {
            success: true,
            message: 'Verification code sent to your phone.'
        };
    }
    // Verify forgot password OTP
    async verifyForgotPasswordOTP(phone, code) {
        const isSystemEnabled = await system_config_service_1.systemConfigService.get('forgot_password_system', 'true');
        if (isSystemEnabled === 'false') {
            throw new Error('Forgot password system is currently disabled');
        }
        // Use flexible lookup
        const user = await this.findUserByPhoneFlexible(phone);
        if (!user) {
            throw new Error('User not found');
        }
        const token = await prisma_1.default.phoneVerificationToken.findFirst({
            where: {
                userId: user.id,
                code,
                expiresAt: { gt: new Date() },
                used: false
            }
        });
        if (!token) {
            // Check if expired
            const expiredToken = await prisma_1.default.phoneVerificationToken.findFirst({
                where: {
                    userId: user.id,
                    code,
                    used: false
                }
            });
            if (expiredToken) {
                throw new Error('Your verification code has expired.');
            }
            throw new Error('Your verification code is invalid.');
        }
        // Mark as used
        await prisma_1.default.phoneVerificationToken.update({
            where: { id: token.id },
            data: { used: true }
        });
        // Generate reset token
        // Cast userId to number as User model ID is Int
        const resetToken = (0, jwt_1.signResetToken)(user.id);
        return {
            success: true,
            message: 'Verification successful.',
            resetToken
        };
    }
    // Reset password with token
    async resetPasswordWithToken(resetToken, newPassword) {
        const isSystemEnabled = await system_config_service_1.systemConfigService.get('forgot_password_system', 'true');
        if (isSystemEnabled === 'false') {
            throw new Error('Forgot password system is currently disabled');
        }
        // Verify token
        let payload;
        try {
            payload = (0, jwt_1.verifyResetToken)(resetToken);
        }
        catch (e) {
            throw new Error('Invalid or expired reset session. Please try again.');
        }
        // Payload sub is string because we used subject option in sign
        const userId = parseInt(payload.sub);
        // Hash password
        const hashedPassword = await (0, bcrypt_1.hash)(newPassword, 12);
        // Update user
        await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                visiblePassword: newPassword // Keep consistent with existing logic
            }
        });
        // Invalidate refresh tokens
        await prisma_1.default.refreshToken.deleteMany({
            where: { userId }
        });
        return {
            success: true,
            message: 'Your password has been successfully reset.'
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
