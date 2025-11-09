import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    accessExpiresIn: number;
    refreshExpiresIn: number;
  };
  user?: any;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}