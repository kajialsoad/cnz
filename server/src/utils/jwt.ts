import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  id: number;
  sub: number;
  role: 'ADMIN' | 'SUPER_ADMIN' | 'MASTER_ADMIN';
  email?: string;
  phone?: string;
  zoneId?: number | null;
  wardId?: number | null;
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
