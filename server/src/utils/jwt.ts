import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import env from '../config/env';
import prisma from './prisma';
import { systemConfigService } from '../services/system-config.service';

export interface JwtPayload {
  id: number;
  sub: number;
  role: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
  email?: string;
  phone?: string;
  permissions?: string;
  zoneId?: number | null;
  wardId?: number | null;
  cityCorporationCode?: string | null;
  sessionId?: string; // Add session tracking
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: JwtPayload) {
  const secret: Secret = env.JWT_ACCESS_SECRET as Secret;
  const options: SignOptions = {
    expiresIn: env.ACCESS_TTL as unknown as SignOptions['expiresIn'],
    issuer: 'clean-care-app',
    audience: 'clean-care-users'
  };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: JwtPayload) {
  const secret: Secret = env.JWT_REFRESH_SECRET as Secret;
  const options: SignOptions = {
    expiresIn: env.REFRESH_TTL as unknown as SignOptions['expiresIn'],
    issuer: 'clean-care-app',
    audience: 'clean-care-users',
    jwtid: generateSecureToken(16) // Add unique ID to ensure token uniqueness
  };
  return jwt.sign(payload, secret, options);
}

export function signResetToken(userId: number) {
  const secret: Secret = env.JWT_ACCESS_SECRET as Secret; 
  const options: SignOptions = {
    expiresIn: '5m', 
    issuer: 'clean-care-app',
    audience: 'clean-care-users',
    subject: userId.toString(),
  };
  return jwt.sign({ purpose: 'password_reset' }, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'clean-care-app',
      audience: 'clean-care-users'
    }) as unknown as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'clean-care-app',
      audience: 'clean-care-users'
    }) as unknown as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

export function verifyResetToken(token: string): JwtPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'clean-care-app',
      audience: 'clean-care-users'
    }) as any;
    
    if (payload.purpose !== 'password_reset') {
      throw new Error('Invalid token purpose');
    }
    
    return payload as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Reset token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid reset token');
    }
    throw error;
  }
}

export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

export function generateOTP(length: number = 6): string {
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
export async function generateDynamicOTP(): Promise<string> {
  let length = 6;
  try {
    const lengthStr = await systemConfigService.get('verification_code_length', process.env.VERIFICATION_CODE_LENGTH || '6');
    length = parseInt(lengthStr, 10);
    if (isNaN(length) || length < 4 || length > 10) length = 6;
  } catch (e) {
    console.warn('Failed to fetch OTP length config, using default 6');
  }
  return generateOTP(length);
}

/**
 * Validate user session and check if user is still active
 * Requirements: 12.1, 12.2, 12.3
 */
export async function validateUserSession(userId: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Error validating user session:', error);
    return false;
  }
}

/**
 * Generate session ID for tracking
 */
export function generateSessionId(): string {
  return generateSecureToken(32);
}

/**
 * Decode token without verification (for inspection)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      return null;
    }
    return decoded as unknown as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || typeof decoded === 'string') {
      return true;
    }
    const payload = decoded as unknown as JwtPayload;
    if (!payload.exp) {
      return true;
    }
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
}
