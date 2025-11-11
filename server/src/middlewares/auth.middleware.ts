import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authGuard(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    // Debug: log missing/invalid authorization header
    try {
      console.warn('[authGuard] Missing or invalid Authorization header', {
        path: req.path,
        method: req.method,
        origin: req.headers.origin,
      });
    } catch {}
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: No token provided' 
    });
  }
  
  const token = auth.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof Error) {
      // Debug: log token verification error
      try {
        console.warn('[authGuard] Token verification failed', {
          path: req.path,
          method: req.method,
          origin: req.headers.origin,
          error: error.message,
        });
      } catch {}
      return res.status(401).json({ 
        success: false,
        message: `Unauthorized: ${error.message}` 
      });
    }
    return res.status(401).json({ 
      success: false,
      message: 'Unauthorized: Invalid token' 
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