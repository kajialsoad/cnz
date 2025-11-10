import { Router } from 'express';
import { authService } from '../services/auth.service';
import { validateInput } from '../utils/validation';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validation';
import { createRateLimiter } from '../middlewares/auth.middleware';

const router = Router();

// Rate limiters (increased for development)
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 50, 'Too many authentication attempts. Please try again later.');
const registrationRateLimiter = createRateLimiter(60 * 60 * 1000, 50, 'Too many registration attempts. Please try again later.');

// Register endpoint
router.post('/register', registrationRateLimiter, async (req, res) => {
  try {
    console.log('Register endpoint hit with body:', req.body);
    const { error, value } = validateInput(registerSchema, req.body);
    if (error) {
      console.log('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details
      });
    }

    console.log('Validation passed, calling authService.register');
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

// Login endpoint
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const value = validateInput(loginSchema, req.body);
    const tokens = await authService.login(value);
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

// Verify email endpoint
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

export default router;