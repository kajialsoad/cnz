import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { authService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: AuthRequest, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      phone: body.phone,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', issues: err.issues });
    }
    return res.status(400).json({ message: err?.message ?? 'Registration failed' });
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login({
      email: body.email,
      password: body.password,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ message: err?.message ?? 'Login failed' });
  }
}

export async function refresh(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) return res.status(400).json({ message: 'Missing refreshToken' });
    const result = await authService.refreshTokens(refreshToken);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(401).json({ message: err?.message ?? 'Refresh failed' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    await authService.logout(refreshToken);
    return res.status(200).json({ message: 'ok' });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? 'Logout failed' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await authService.getProfile(req.user.sub);
    return res.status(200).json({ user });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message ?? 'Failed to load user' });
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function forgotPassword(req: AuthRequest, res: Response) {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(body.email);
    return res.status(200).json({ 
      success: true,
      message: 'Password reset email sent successfully' 
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        issues: err.issues 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err?.message ?? 'Failed to send password reset email' 
    });
  }
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(body.token, body.password);
    return res.status(200).json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        issues: err.issues 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err?.message ?? 'Failed to reset password' 
    });
  }
}

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function verifyEmail(req: AuthRequest, res: Response) {
  try {
    const body = verifyEmailSchema.parse(req.body);
    await authService.verifyEmail(body.token);
    return res.status(200).json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        issues: err.issues 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err?.message ?? 'Email verification failed' 
    });
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  address: z.string().optional(),
  avatar: z.string().url().optional(),
});

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ 
      success: false,
      message: 'Unauthorized' 
    });
    
    const body = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.sub, body);
    return res.status(200).json({ 
      success: true,
      message: 'Profile updated successfully',
      user 
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        issues: err.issues 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: err?.message ?? 'Failed to update profile' 
    });
  }
}

export async function resendVerificationEmail(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ 
      success: false,
      message: 'Unauthorized' 
    });
    
    await authService.resendVerificationEmail(req.user.sub);
    return res.status(200).json({ 
      success: true,
      message: 'Verification email sent successfully' 
    });
  } catch (err: any) {
    return res.status(400).json({ 
      success: false,
      message: err?.message ?? 'Failed to resend verification email' 
    });
  }
}