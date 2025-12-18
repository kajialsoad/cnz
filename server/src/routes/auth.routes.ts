import { Router } from 'express';
import { authService } from '../services/auth.service';
import { validateInput } from '../utils/validation';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import { createRateLimiter, createEmailRateLimiter, createCodeRateLimiter } from '../middlewares/auth.middleware';
import { loginRateLimit } from '../middlewares/rate-limit.middleware';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Rate limiters (increased for development)
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 50, 'Too many authentication attempts. Please try again later.');
const registrationRateLimiter = createRateLimiter(60 * 60 * 1000, 50, 'Too many registration attempts. Please try again later.');

// Email verification rate limiters
// 3 requests per 15 minutes per email for resend verification
const resendVerificationRateLimiter = createEmailRateLimiter(15 * 60 * 1000, 3, 'Too many verification code requests. Please try again in 15 minutes.');

// 5 attempts per 15 minutes per email for verification
const verifyEmailRateLimiter = createCodeRateLimiter(15 * 60 * 1000, 5, 'Too many verification attempts. Please try again in 15 minutes.');

// Register endpoint
router.post('/register', registrationRateLimiter, async (req, res) => {
  try {
    console.log('Register endpoint hit with body:', req.body);
    const value = validateInput(registerSchema, req.body);
    console.log('Validation passed. resolving names for logging...');

    // Helper to fetch names for better logging
    if (value.zoneId || value.wardId) {
      try {
        const { PrismaClient } = require('@prisma/client');
        // Note: In a real app we might reuse the global prisma instance, 
        // but here we just want a quick lookup for logging without refactoring imports significantly if not needed.
        // Better to use req.prisma if available.
        const prisma = req.prisma;
        if (prisma) {
          const zone = value.zoneId ? await prisma.zone.findUnique({ where: { id: value.zoneId } }) : null;
          const ward = value.wardId ? await prisma.ward.findUnique({ where: { id: value.wardId } }) : null;
          console.log('------------------------------------------------');
          console.log('Registration Request Details:');
          console.log(`User: ${value.firstName} ${value.lastName} (${value.phone})`);
          console.log(`Zone: ${zone ? `${zone.name} (ID: ${zone.id})` : value.zoneId}`);
          console.log(`Ward: ${ward ? `Ward ${ward.wardNumber} (ID: ${ward.id})` : value.wardId}`);
          console.log('------------------------------------------------');
        }
      } catch (e) {
        console.log('Error resolving names for log:', e);
      }
    }

    console.log('Calling authService.register');
    const result = await authService.register(value);
    console.log('Registration result:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login endpoint with account lockout protection
router.post('/login', loginRateLimit, authRateLimiter, async (req, res) => {
  try {
    const value = validateInput(loginSchema, req.body);
    const ip = req.ip || req.socket.remoteAddress;
    const tokens = await authService.login(value, ip);
    res.json({
      success: true,
      message: 'Login successful',
      data: tokens
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const tokens = await authService.refreshTokens(refreshToken);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const result = await authService.logout(refreshToken);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password endpoint
router.post('/forgot-password', authRateLimiter, async (req, res) => {
  try {
    const { error, value } = validateInput(forgotPasswordSchema, req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details
      });
    }

    const result = await authService.forgotPassword(value.email);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = validateInput(resetPasswordSchema, req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details
      });
    }

    const result = await authService.resetPassword(value.token, value.password);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email with OTP code endpoint
router.post('/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const result = await authService.verifyEmailWithCode(email, code);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email endpoint (legacy - for backward compatibility)
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Resend verification email endpoint
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await authService.resendVerificationEmail(email);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email with code endpoint (new verification flow)
router.post('/verify-email-code', verifyEmailRateLimiter, authController.verifyEmailWithCode);

// Resend verification code endpoint
router.post('/resend-verification-code', resendVerificationRateLimiter, authController.resendVerificationCode);

// Test email service connection endpoint (for development/testing)
router.get('/test-email', async (req, res) => {
  try {
    const emailService = (await import('../services/email.service')).default;
    const isConnected = await emailService.testConnection();

    if (isConnected) {
      res.json({
        success: true,
        message: 'Email service is configured correctly and ready to send emails'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Email service connection failed. Please check your SMTP configuration.'
      });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing email service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;