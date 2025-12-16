import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload, validateUserSession, isTokenExpired } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
  assignedZoneIds?: number[];
}

/**
 * Enhanced authentication guard with session validation
 * Requirements: 12.1, 12.2, 12.3, 12.17
 */
export async function authGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'No authentication token provided'
      }
    });
  }

  const token = auth.slice(7);

  try {
    // Verify token signature and expiration
    const payload = verifyAccessToken(token);

    // Validate user session (check if user still exists and is active)
    const isValidSession = await validateUserSession(payload.sub);
    if (!isValidSession) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User account not found or inactive'
        }
      });
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      // Determine specific error type
      if (error.message === 'Token expired') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_TOKEN_EXPIRED',
            message: 'Token has expired. Please refresh your token.'
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Invalid authentication token'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token'
      }
    });
  }
}

export function rbacGuard(...roles: JwtPayload['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No role found'
      });
    }

    if (!roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions',
        required: roles,
        current: role
      });
    }

    next();
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next();
  }

  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }

  next();
}

// Rate limiting middleware
export function createRateLimiter(windowMs: number, max: number, message: string) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    const current = requests.get(key);
    if (!current || now > current.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }

    current.count++;
    next();
  };
}

// Email-based rate limiting middleware for verification code requests
export function createEmailRateLimiter(windowMs: number, max: number, message: string) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email || req.query?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const key = String(email).toLowerCase();
    const now = Date.now();

    const current = requests.get(key);
    if (!current || now > current.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }

    current.count++;
    next();
  };
}

// Code-based rate limiting middleware for verification attempts
export function createCodeRateLimiter(windowMs: number, max: number, message: string) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const email = req.body?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const key = String(email).toLowerCase();
    const now = Date.now();

    const current = requests.get(key);
    if (!current || now > current.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
    }

    current.count++;
    next();
  };
}

/**
 * City Corporation access validation middleware
 * Requirements: 12.3, 12.4, 12.19
 */
export function cityCorporationGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const requestedCityCorporationCode = req.params.cityCorporationCode || req.query.cityCorporationCode || req.body.cityCorporationCode;
  const userCityCorporationCode = req.user?.cityCorporationCode;
  const userRole = req.user?.role;

  // MASTER_ADMIN can access all City Corporations
  if (userRole === 'MASTER_ADMIN') {
    return next();
  }

  // If no City Corporation is requested, allow (will be filtered by role-based filtering)
  if (!requestedCityCorporationCode) {
    return next();
  }

  // Check if user has access to the requested City Corporation
  if (userCityCorporationCode !== requestedCityCorporationCode) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have access to this City Corporation',
      error: {
        code: 'AUTH_CITY_CORPORATION_MISMATCH',
        message: 'Attempting to access data from different City Corporation',
      },
    });
  }

  next();
}

/**
 * Zone access validation middleware
 * Requirements: 12.3, 12.4
 */
export function zoneGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const requestedZoneId = parseInt(req.params.zoneId || req.query.zoneId || req.body.zoneId);
  const userZoneId = req.user?.zoneId;
  const userRole = req.user?.role;

  // MASTER_ADMIN can access all zones
  if (userRole === 'MASTER_ADMIN') {
    return next();
  }

  // If no zone is requested, allow (will be filtered by role-based filtering)
  if (!requestedZoneId || isNaN(requestedZoneId)) {
    return next();
  }

  // SUPER_ADMIN can only access their assigned zone
  if (userRole === 'SUPER_ADMIN') {
    if (userZoneId !== requestedZoneId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_ZONE_MISMATCH',
          message: 'You do not have access to this zone',
        },
      });
    }
  }

  // ADMIN cannot access zone-level data directly
  if (userRole === 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
        message: 'Admins cannot access zone-level data',
      },
    });
  }

  next();
}

/**
 * Ward access validation middleware
 * Requirements: 12.3, 12.4
 */
export function wardGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const requestedWardId = parseInt(req.params.wardId || req.query.wardId || req.body.wardId);
  const userWardId = req.user?.wardId;
  const userRole = req.user?.role;

  // MASTER_ADMIN can access all wards
  if (userRole === 'MASTER_ADMIN') {
    return next();
  }

  // If no ward is requested, allow (will be filtered by role-based filtering)
  if (!requestedWardId || isNaN(requestedWardId)) {
    return next();
  }

  // ADMIN can only access their assigned ward
  if (userRole === 'ADMIN') {
    if (userWardId !== requestedWardId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_WARD_MISMATCH',
          message: 'You do not have access to this ward',
        },
      });
    }
  }

  next();
}