import prisma from '../utils/prisma';
import { hash, compare } from 'bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken, generateSecureToken, generateOTP } from '../utils/jwt';
import emailService from '../utils/email';
import env from '../config/env';
import { UserRole, UserStatus } from '@prisma/client';
import cityCorporationService from './city-corporation.service';
import thanaService from './thana.service';

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
}

export interface LoginInput {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export class AuthService {
  // User registration
  async register(input: RegisterInput) {
    // Check if user exists by phone (required field)
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone: input.phone }
    });

    if (existingUserByPhone) {
      throw new Error('User already exists with this phone number');
    }

    // Check if user exists by email (if provided)
    if (input.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existingUserByEmail) {
        throw new Error('User already exists with this email');
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

        // Validate ward if provided
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

        // Validate thana if provided
        if (input.thanaId) {
          try {
            const thana = await thanaService.getThanaById(input.thanaId);

            // Check if thana belongs to selected city corporation
            const belongsToCityCorporation = await thanaService.validateThanaBelongsToCityCorporation(
              input.thanaId,
              input.cityCorporationCode
            );

            if (!belongsToCityCorporation) {
              throw new Error(
                `Selected thana does not belong to ${cityCorporation.name}`
              );
            }

            // Check if thana is active
            if (thana.status !== 'ACTIVE') {
              throw new Error('Selected thana is not currently available');
            }
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid thana selected');
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Invalid city corporation');
      }
    }

    const hashedPassword = await hash(input.password, 12);
    const verificationToken = generateSecureToken();
    const verificationCode = generateOTP(6); // Generate 6-digit OTP
    const emailVerificationEnabled = env.EMAIL_VERIFICATION_ENABLED;

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || '',
        ward: input.ward,
        zone: input.zone,
        address: input.address,
        cityCorporationCode: input.cityCorporationCode,
        thanaId: input.thanaId,
        role: input.role || UserRole.CUSTOMER,
        status: emailVerificationEnabled ? UserStatus.PENDING : UserStatus.ACTIVE,
        emailVerified: !emailVerificationEnabled, // Mark as verified if verification is disabled
        phoneVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        ward: true,
        zone: true,
        address: true,
        cityCorporationCode: true,
        thanaId: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    // Only create verification token and send email if verification is enabled
    if (emailVerificationEnabled) {
      // Create email verification token with OTP code
      await prisma.emailVerificationToken.create({
        data: {
          token: verificationToken,
          code: verificationCode,
          userId: user.id,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry for OTP
        }
      });

      // Send verification email with OTP code
      if (user.email) {
        await emailService.sendEmailVerificationEmail(user.email, verificationCode);
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
  async login(input: LoginInput): Promise<TokenResponse> {
    console.log('Login input received:', input);

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
      throw new Error('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account is suspended');
    }

    // Check if email verification is enabled and if email is verified for pending accounts
    const emailVerificationEnabled = env.EMAIL_VERIFICATION_ENABLED;
    console.log('Login - Email verification enabled:', emailVerificationEnabled);

    if (emailVerificationEnabled && user.status === UserStatus.PENDING && !user.emailVerified) {
      throw new Error('Please verify your email first');
    }

    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    try {
      const accessToken = signAccessToken({
        sub: parseInt(user.id.toString()),
        role: user.role,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined
      });

      const refreshToken = signRefreshToken({
        sub: parseInt(user.id.toString()),
        role: user.role,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined
      });

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + env.REFRESH_TTL_SECONDS * 1000)
        }
      });

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

  // Refresh access token
  async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    const payload = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.sub
      }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens
    const newAccessToken = signAccessToken({
      sub: parseInt(payload.sub.toString()),
      role: payload.role,
      email: payload.email,
      phone: payload.phone
    });

    const newRefreshToken = signRefreshToken({
      sub: parseInt(payload.sub.toString()),
      role: payload.role,
      email: payload.email,
      phone: payload.phone
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
      data: { passwordHash: hashedPassword }
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
        status: UserStatus.ACTIVE
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
        status: UserStatus.ACTIVE
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
    const verificationCode = generateOTP(6); // Generate 6-digit OTP

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
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry for OTP
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
        zone: true,
        ward: true,
        address: true,
        cityCorporationCode: true,
        thanaId: true,
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
  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    zone?: string;
    ward?: string;
    address?: string;
    cityCorporationCode?: string;
    thanaId?: number;
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

        // Validate ward if provided
        if (data.ward) {
          const wardNum = parseInt(data.ward);
          if (isNaN(wardNum)) {
            throw new Error('Ward must be a valid number');
          }

          const isValidWard = await cityCorporationService.validateWard(
            data.cityCorporationCode,
            wardNum
          );

          if (!isValidWard) {
            throw new Error(
              `Ward must be between ${cityCorporation.minWard} and ${cityCorporation.maxWard} for ${cityCorporation.name}`
            );
          }
        }

        // Validate thana if provided
        if (data.thanaId) {
          try {
            const thana = await thanaService.getThanaById(data.thanaId);

            // Check if thana belongs to selected city corporation
            const belongsToCityCorporation = await thanaService.validateThanaBelongsToCityCorporation(
              data.thanaId,
              data.cityCorporationCode
            );

            if (!belongsToCityCorporation) {
              throw new Error(
                `Selected thana does not belong to ${cityCorporation.name}`
              );
            }

            // Check if thana is active
            if (thana.status !== 'ACTIVE') {
              throw new Error('Selected thana is not currently available');
            }
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid thana selected');
          }
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
        zone: true,
        ward: true,
        address: true,
        cityCorporationCode: true,
        thanaId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
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

  // Clean up expired pending accounts (24 hours)
  async cleanupExpiredAccounts() {
    const cleanupHours = parseInt(process.env.PENDING_ACCOUNT_CLEANUP_HOURS || '24');
    const expiryTime = new Date(Date.now() - (cleanupHours * 60 * 60 * 1000));

    // Query users with "pending_verification" status older than cleanup hours
    const expiredUsers = await prisma.user.findMany({
      where: {
        createdAt: { lt: expiryTime },
        emailVerified: false,
        status: UserStatus.PENDING
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
}

export const authService = new AuthService();