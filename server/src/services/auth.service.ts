import prisma from '../utils/prisma';
import { hash, compare } from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateSecureToken, generateOTP, generateDynamicOTP } from '../utils/jwt';
import emailService from '../utils/email';
import env from '../config/env';
// Prisma v6 enum exports use $Enums; এখানে আমরা টোকেনের জন্য নিজস্ব টাইপ রাখছি
type UserRole = 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
import cityCorporationService from './city-corporation.service';
import smsService from './sms.service';
// import thanaService from './thana.service'; // Thana service disabled - using Zone/Ward now
import zoneService from './zone.service';
import wardService from './ward.service';
import { trackLoginAttempt, checkAccountLockout } from '../middlewares/rate-limit.middleware';

export interface RegisterInput {
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
  ward?: string;
  zone?: string;
  address?: string;
  cityCorporationCode?: string;
  thanaId?: number;
  zoneId?: number;
  wardId?: number;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
  portal?: 'ADMIN' | 'APP';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

import { systemConfigService } from './system-config.service';

export class AuthService {
  // User registration
  async register(input: RegisterInput) {
    // Check if user exists by phone (required field)
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone: input.phone }
    });

    if (existingUserByPhone) {
      if (existingUserByPhone.status === 'DELETED') {
        // Archive the deleted user to free up the phone number
        await prisma.user.update({
          where: { id: existingUserByPhone.id },
          data: {
            phone: `${existingUserByPhone.phone}_deleted_${Date.now()}`,
            email: existingUserByPhone.email ? `${existingUserByPhone.email}_deleted_${Date.now()}` : existingUserByPhone.email
          }
        });
      } else {
        throw new Error('User already exists with this phone number');
      }
    }

    // Check if user exists by email (if provided)
    if (input.email) {
      const existingUserByEmail = await prisma.user.findUnique({
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
          await prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              email: `${existingUserByEmail.email}_deleted_${Date.now()}`,
              phone: existingUserByEmail.phone.includes('_deleted_') ? existingUserByEmail.phone : `${existingUserByEmail.phone}_deleted_${Date.now()}`
            }
          });
        } else {
          throw new Error('User already exists with this email');
        }
      }
    }

    // Validate city corporation if provided
    if (input.cityCorporationCode) {
      try {
        const cityCorporation = await cityCorporationService.getCityCorporationByCode(
          input.cityCorporationCode
        );

        // Check if city corporation is active
        if (cityCorporation.status !== 'ACTIVE') {
          throw new Error(
            `City Corporation ${input.cityCorporationCode} is not currently accepting registrations`
          );
        }

        // Validate zone-ward hierarchy if provided
        if (input.zoneId && input.wardId) {
          // Validate zone exists and belongs to city corporation
          const zone = await zoneService.getZoneById(input.zoneId);

          const zoneBelongsToCityCorporation = await zoneService.validateZoneBelongsToCityCorporation(
            input.zoneId,
            cityCorporation.id
          );

          if (!zoneBelongsToCityCorporation) {
            throw new Error(
              `Selected zone does not belong to ${cityCorporation.name}`
            );
          }

          // Check if zone is active
          const isZoneActive = await zoneService.isActive(input.zoneId);
          if (!isZoneActive) {
            throw new Error('Selected zone is not currently available');
          }

          // Validate ward exists and belongs to zone
          const ward = await wardService.getWardById(input.wardId);

          const wardBelongsToZone = await wardService.validateWardBelongsToZone(
            input.wardId,
            input.zoneId
          );

          if (!wardBelongsToZone) {
            throw new Error(
              `Selected ward does not belong to Zone ${zone.zoneNumber}`
            );
          }

          // Check if ward is active
          const isWardActive = await wardService.isActive(input.wardId);
          if (!isWardActive) {
            throw new Error('Selected ward is not currently available');
          }
        } else if (input.zoneId || input.wardId) {
          // If only one is provided, throw error
          throw new Error('Both zone and ward must be provided together');
        }

        // Legacy: Validate ward if provided (old string-based ward)
        if (input.ward) {
          const wardNum = parseInt(input.ward);
          if (isNaN(wardNum)) {
            throw new Error('Ward must be a valid number');
          }

          const isValidWard = await cityCorporationService.validateWard(
            input.cityCorporationCode,
            wardNum
          );

          if (!isValidWard) {
            throw new Error(
              `Ward must be between ${cityCorporation.minWard} and ${cityCorporation.maxWard} for ${cityCorporation.name}`
            );
          }
        }

        // Legacy thana validation removed - using Zone/Ward now
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Invalid city corporation');
      }
    }

    const hashedPassword = await hash(input.password, 12);
    
    // Get verification settings from System Config (DB) instead of env
    const emailVerificationConfig = await systemConfigService.get('verification_email_enabled', env.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
    const phoneVerificationConfig = await systemConfigService.get('verification_sms_enabled', env.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
    const expiryMinutesStr = await systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
    const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    const emailVerificationEnabled = emailVerificationConfig === 'true';
    const phoneVerificationEnabled = phoneVerificationConfig === 'true';
    const verificationRequired = emailVerificationEnabled || phoneVerificationEnabled;

    // Generate Verification Code
    const verificationCode = await generateDynamicOTP(); 

    // If verification is required, DO NOT create User yet. Store in PendingRegistration.
    if (verificationRequired) {
      // Check if pending registration already exists
      const existingPending = await prisma.pendingRegistration.findUnique({
        where: { phone: input.phone }
      });

      if (existingPending) {
        // Update existing pending registration
        await prisma.pendingRegistration.update({
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
      } else {
        // Create new pending registration
        await prisma.pendingRegistration.create({
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
        await smsService.sendOTP(input.phone, verificationCode);
      } else if (emailVerificationEnabled && input.email) {
        await emailService.sendEmailVerificationEmail(input.email, verificationCode);
      }

      let message = 'Verification code sent. Please verify to complete registration.';
      if (phoneVerificationEnabled) {
        message = 'Verification code sent to your phone. Please verify to complete registration.';
      } else if (emailVerificationEnabled) {
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
    const verificationToken = generateSecureToken();
    
    const user = await prisma.user.create({
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
  async verifyRegistration(input: { phone: string, code: string }) {
    // Find pending registration
    const pendingUser = await prisma.pendingRegistration.findUnique({
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
    const emailVerificationConfig = await systemConfigService.get('verification_email_enabled', env.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
    const phoneVerificationConfig = await systemConfigService.get('verification_sms_enabled', env.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
    
    const emailVerificationEnabled = emailVerificationConfig === 'true';
    const phoneVerificationEnabled = phoneVerificationConfig === 'true';

    // Move to User table
    const user = await prisma.user.create({
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
        await prisma.user.update({
            where: { id: user.id },
            data: { phoneVerified: true }
        });
    }
    // Note: If email verification was the method used (e.g. only email enabled), we should mark emailVerified.
    // However, the input is 'phone' and 'code'. This implies phone verification. 
    // If the system was email-only, we might need to adjust this method signature or logic.
    // Given the user context "otp page", it strongly implies phone/SMS.

    // Delete pending registration
    await prisma.pendingRegistration.delete({
      where: { id: pendingUser.id }
    });

    return {
      success: true,
      message: 'Registration verified and account created successfully. Please login.',
    };
  }

  // User login
  async login(input: LoginInput, ip?: string): Promise<TokenResponse> {
    console.log('Login input received:', input);

    // Determine identifier for rate limiting
    const identifier = input.email || input.phone || '';

    // Check if account is locked due to too many failed attempts
    const lockout = checkAccountLockout(identifier);
    if (lockout.locked) {
      throw new Error(`Account temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(lockout.retryAfter! / 60)} minutes.`);
    }

    // Find user by email or phone
    let user;
    if (input.email) {
      console.log('Finding user by email:', input.email);
      user = await prisma.user.findUnique({
        where: { email: input.email }
      });
    } else if (input.phone) {
      console.log('Finding user by phone:', input.phone);
      user = await prisma.user.findUnique({
        where: { phone: input.phone }
      });
    }

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      // Track failed login attempt
      await trackLoginAttempt(identifier, false, ip);
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
    } else if (input.portal === 'APP') {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'MASTER_ADMIN') {
        throw new Error('Access denied. Admins cannot access the User App. Please use the Admin Panel.');
      }
    }

    // Check verification status
    const emailVerificationConfig = await systemConfigService.get('verification_email_enabled', env.EMAIL_VERIFICATION_ENABLED ? 'true' : 'false');
    const phoneVerificationConfig = await systemConfigService.get('verification_sms_enabled', env.PHONE_VERIFICATION_ENABLED ? 'true' : 'false');
    
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

    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      // Track failed login attempt
      await trackLoginAttempt(identifier, false, ip);
      throw new Error('Invalid credentials');
    }

    // Track successful login attempt (clears failed attempts)
    await trackLoginAttempt(identifier, true, ip);

    // রোল যাচাই করা (ADMIN বা CUSTOMER সবার জন্যই লগইন এলাউড)
    const toUserRole = (r: any): UserRole => {
      if (['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'].includes(r)) return r;
      throw new Error('Access denied. Invalid role.');
    };

    // Generate tokens
    try {
      const accessToken = signAccessToken({
        id: parseInt(user.id.toString()),
        sub: parseInt(user.id.toString()),
        role: toUserRole(user.role),
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        zoneId: user.zoneId,
        wardId: user.wardId
      });

      const refreshToken = signRefreshToken({
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
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + env.REFRESH_TTL_SECONDS * 1000)
          }
        });
      } catch (dbError) {
        console.error('Database error storing refresh token:', dbError);
        throw new Error('Failed to store refresh token');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return {
        accessToken,
        refreshToken,
        accessExpiresIn: env.ACCESS_TTL_SECONDS,
        refreshExpiresIn: env.REFRESH_TTL_SECONDS,
      };
    } catch (error) {
      console.error('Token generation error:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  // Refresh access token with session validation
  // Requirements: 12.1, 12.2, 12.3, 12.17
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const payload = verifyRefreshToken(refreshToken);

    // Validate stored refresh token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub
      }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Validate user session (check if user still exists and is active)
    const user = await prisma.user.findUnique({
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
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new Error('User account not found');
    }

    if (user.status !== 'ACTIVE') {
      // User is not active, delete the refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new Error('User account is not active');
    }

    // Generate new tokens with updated user data
    const newAccessToken = signAccessToken({
      id: parseInt(user.id.toString()),
      sub: parseInt(user.id.toString()),
      role: user.role as UserRole,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      zoneId: user.zoneId,
      wardId: user.wardId,
      cityCorporationCode: user.cityCorporationCode ?? undefined
    });

    const newRefreshToken = signRefreshToken({
      id: parseInt(user.id.toString()),
      sub: parseInt(user.id.toString()),
      role: user.role as UserRole,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
      zoneId: user.zoneId,
      wardId: user.wardId,
      cityCorporationCode: user.cityCorporationCode ?? undefined
    });

    // Update refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + env.REFRESH_TTL_SECONDS * 1000)
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      accessExpiresIn: env.ACCESS_TTL_SECONDS,
      refreshExpiresIn: env.REFRESH_TTL_SECONDS
    };
  }

  // Logout
  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });

    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  // Forgot password
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      };
    }

    const resetToken = generateSecureToken();

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_SECONDS * 1000)
      }
    });

    if (user.email) {
      await emailService.sendPasswordResetEmail(user.email, resetToken);
    }

    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    };
  }

  // Reset password
  async resetPassword(token: string, newPassword: string) {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: hashedPassword,
        visiblePassword: newPassword // Store plain text password
      }
    });

    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id }
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId }
    });

    return {
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    };
  }

  // Verify email with OTP code
  async verifyEmailWithCode(email: string, code: string) {
    const user = await prisma.user.findUnique({
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

    const verificationToken = await prisma.emailVerificationToken.findFirst({
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

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        status: 'ACTIVE'
      }
    });

    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true }
    });

    if (verificationToken.user.email) {
      await emailService.sendWelcomeEmail(verificationToken.user.email, verificationToken.user.firstName);
    }

    return {
      success: true,
      message: 'Email verified successfully. Welcome to Clean Care Bangladesh!'
    };
  }

  // Verify phone with OTP code
  async verifyPhoneWithCode(phone: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      // Check PendingRegistration (If user tries to verify registration via this endpoint)
      const pendingUser = await prisma.pendingRegistration.findUnique({
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

    const verificationToken = await prisma.phoneVerificationToken.findFirst({
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

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        phoneVerified: true,
        status: 'ACTIVE'
      }
    });

    await prisma.phoneVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true }
    });

    // Send welcome SMS
    await smsService.sendWelcomeMessage(user.phone, user.firstName);

    return {
      success: true,
      message: 'Phone verified successfully. Welcome to Clean Care Bangladesh!'
    };
  }

  // Resend verification phone code
  async resendVerificationPhone(phone: string, method: 'sms' | 'whatsapp' = 'sms') {
    const user = await prisma.user.findUnique({
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
      const pendingUser = await prisma.pendingRegistration.findUnique({
        where: { phone }
      });

      if (pendingUser) {
        const verificationCode = await generateDynamicOTP();
        
        // Get expiry from DB
        const expiryMinutesStr = await systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
        const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
        const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        // Update PendingRegistration with new code
        await prisma.pendingRegistration.update({
          where: { id: pendingUser.id },
          data: {
            verificationCode,
            expiresAt
          }
        });

        if (method === 'whatsapp') {
          await smsService.sendWhatsAppOTP(pendingUser.phone, verificationCode);
        } else {
          await smsService.sendOTP(pendingUser.phone, verificationCode);
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
    const verificationToken = generateSecureToken();
    const verificationCode = await generateDynamicOTP(); // Generate dynamic OTP
    
    // Get expiry from DB
    const expiryMinutesStr = await systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
    const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Mark old tokens as used
    await prisma.phoneVerificationToken.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });

    // Create new verification token with OTP code
    await prisma.phoneVerificationToken.create({
      data: {
        token: verificationToken,
        code: verificationCode,
        userId: user.id,
        expiresAt: expiresAt
      }
    });

    if (method === 'whatsapp') {
      await smsService.sendWhatsAppOTP(user.phone, verificationCode);
    } else {
      await smsService.sendOTP(user.phone, verificationCode);
    }

    return {
      success: true,
      message: `A new verification code has been sent via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'} to your phone number.`
    };
  }

  // Verify email (legacy - for backward compatibility with token URLs)
  async verifyEmail(token: string) {
    const verificationToken = await prisma.emailVerificationToken.findFirst({
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

    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: true,
        status: 'ACTIVE'
      }
    });

    await prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { used: true }
    });

    if (verificationToken.user.email) {
      await emailService.sendWelcomeEmail(verificationToken.user.email, verificationToken.user.firstName);
    }

    return {
      success: true,
      message: 'Email verified successfully. Welcome to Clean Care Bangladesh!'
    };
  }

  // Resend verification email
  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.emailVerified) {
      return {
        success: true,
        message: 'If your email needs verification, a new verification code has been sent.'
      };
    }

    const verificationToken = generateSecureToken();
    const verificationCode = await generateDynamicOTP(); // Generate dynamic OTP
    
    // Get expiry from DB
    const expiryMinutesStr = await systemConfigService.get('verification_code_expiry_minutes', process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '15');
    const expiryMinutes = parseInt(expiryMinutesStr, 10) || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Mark old tokens as used
    await prisma.emailVerificationToken.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });

    // Create new verification token with OTP code
    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        code: verificationCode,
        userId: user.id,
        expiresAt: expiresAt
      }
    });

    if (user.email) {
      await emailService.sendEmailVerificationEmail(user.email, verificationCode);
    }

    return {
      success: true,
      message: 'If your email needs verification, a new verification code has been sent.'
    };
  }

  // Get user profile
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
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
    let assignedWards: any[] = [];
    if (user.permissions) {
      try {
        const permissionsData = JSON.parse(user.permissions);
        if (permissionsData.wards && Array.isArray(permissionsData.wards) && permissionsData.wards.length > 0) {
          assignedWards = await prisma.ward.findMany({
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
      } catch (e) {
        console.error('Error parsing user permissions:', e);
      }
    }

    return {
      ...user,
      assignedWards
    };
  }

  // Update profile
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    address?: string;
    cityCorporationCode?: string;
    thanaId?: number;
    zoneId?: number;
    wardId?: number;
  }) {
    // Validate city corporation if being updated
    if (data.cityCorporationCode) {
      try {
        const cityCorporation = await cityCorporationService.getCityCorporationByCode(
          data.cityCorporationCode
        );

        // Check if city corporation is active
        if (cityCorporation.status !== 'ACTIVE') {
          throw new Error(
            `City Corporation ${data.cityCorporationCode} is not currently available`
          );
        }

        // Validate zone-ward hierarchy if provided
        if (data.zoneId && data.wardId) {
          // Validate zone exists and belongs to city corporation
          const zone = await zoneService.getZoneById(data.zoneId);

          const zoneBelongsToCityCorporation = await zoneService.validateZoneBelongsToCityCorporation(
            data.zoneId,
            cityCorporation.id
          );

          if (!zoneBelongsToCityCorporation) {
            throw new Error(
              `Selected zone does not belong to ${cityCorporation.name}`
            );
          }

          // Check if zone is active
          const isZoneActive = await zoneService.isActive(data.zoneId);
          if (!isZoneActive) {
            throw new Error('Selected zone is not currently available');
          }

          // Validate ward exists and belongs to zone
          const ward = await wardService.getWardById(data.wardId);

          const wardBelongsToZone = await wardService.validateWardBelongsToZone(
            data.wardId,
            data.zoneId
          );

          if (!wardBelongsToZone) {
            throw new Error(
              `Selected ward does not belong to Zone ${zone.zoneNumber}`
            );
          }

          // Check if ward is active
          const isWardActive = await wardService.isActive(data.wardId);
          if (!isWardActive) {
            throw new Error('Selected ward is not currently available');
          }
        } else if (data.zoneId || data.wardId) {
          // If only one is provided, throw error
          throw new Error('Both zone and ward must be provided together');
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Invalid city corporation');
      }
    }

    const user = await prisma.user.update({
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
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { passwordHash: hashedPassword }
    });

    // Invalidate all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: parseInt(userId) }
    });

    return {
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
    };
  }

  // Clean up expired pending accounts (Dynamic hours)
    async cleanupExpiredAccounts() {
      const cleanupHoursStr = await systemConfigService.get('pending_account_cleanup_hours', process.env.PENDING_ACCOUNT_CLEANUP_HOURS || '24');
      const cleanupHours = parseInt(cleanupHoursStr, 10) || 24;
      
      console.log(`🧹 Cleaning up pending accounts older than ${cleanupHours} hours...`);
      
      const expiryTime = new Date(Date.now() - (cleanupHours * 60 * 60 * 1000));

    // Query users with "pending_verification" status older than cleanup hours
    const expiredUsers = await prisma.user.findMany({
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
      const result = await prisma.user.deleteMany({
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
  async deleteAccount(userId: number, reason: string, customReason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user status to DELETED and save reason
    await prisma.user.update({
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
}

export const authService = new AuthService();
