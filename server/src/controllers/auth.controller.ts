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
  ward: z.string().optional(),
  zone: z.string().optional(),
  address: z.string().optional(),
  cityCorporationCode: z.string().optional(),
  thanaId: z.number().int().positive().optional(),
  zoneId: z.number().int().positive().optional(),
  wardId: z.number().int().positive().optional(),
});

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(6).optional(),
    password: z.string(),
    portal: z.enum(['ADMIN', 'APP']).optional(),
  })
  .refine((data) => !!(data.email || data.phone), {
    message: 'Provide email or phone',
    path: ['email'],
  });

export async function register(req: AuthRequest, res: Response) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      password: body.password,
      phone: body.phone,
      ward: body.ward,
      zone: body.zone,
      cityCorporationCode: body.cityCorporationCode,
      thanaId: body.thanaId,
      zoneId: body.zoneId,
      wardId: body.wardId,
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
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.login({
      email: body.email?.toLowerCase(),
      phone: body.phone,
      password: body.password,
      portal: body.portal,
    }, ip);
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
    const user = await authService.getProfile(req.user.sub.toString());
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
  firstName: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(2).optional()
  ),
  lastName: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(2).optional()
  ),
  phone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(6).optional()
  ),
  email: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().email().optional()
  ),
  address: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  avatar: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url().optional()
  ),
  ward: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  zone: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  cityCorporationCode: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().optional()
  ),
  thanaId: z.number().int().positive().optional(),
  zoneId: z.number().int().positive().optional(),
  wardId: z.number().int().positive().optional(),
});

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });

    const body = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.sub.toString(), body);
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

    await authService.resendVerificationEmail(req.user.sub.toString());
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

// Verification code endpoint schemas
const verifyEmailCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const resendVerificationCodeSchema = z.object({
  email: z.string().email(),
});

// 7.2 Verify email with code endpoint
export async function verifyEmailWithCode(req: AuthRequest, res: Response) {
  try {
    const body = verifyEmailCodeSchema.parse(req.body);
    const result = await authService.verifyEmailWithCode(body.email, body.code);
    return res.status(200).json(result);
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

// 7.3 Resend verification code endpoint
export async function resendVerificationCode(req: AuthRequest, res: Response) {
  try {
    const body = resendVerificationCodeSchema.parse(req.body);
    const result = await authService.resendVerificationEmail(body.email);
    return res.status(200).json(result);
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
      message: err?.message ?? 'Failed to resend verification code'
    });
  }
}

// Phone Verification Schemas
const verifyPhoneCodeSchema = z.object({
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const resendPhoneVerificationCodeSchema = z.object({
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  method: z.enum(['sms', 'whatsapp']).optional().default('sms'),
});

// Verify phone with code endpoint
export async function verifyPhoneWithCode(req: AuthRequest, res: Response) {
  console.log('--- Verify Phone With Code Request ---');
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    const body = verifyPhoneCodeSchema.parse(req.body);
    let phone = body.phone;
    
    console.log(`Verifying phone: ${phone} with code: ${body.code}`);

    try {
        const result = await authService.verifyPhoneWithCode(phone, body.code);
        console.log('Phone verification successful:', result);
        return res.status(200).json(result);
    } catch (primaryError: any) {
        console.warn(`Primary phone verification failed for ${phone}: ${primaryError.message}`);

        // If user not found, try alternative phone formats
        if (primaryError.message === 'User not found') {
            let alternativePhone = phone;
            if (phone.startsWith('880')) {
                alternativePhone = phone.substring(2);
            } else if (phone.startsWith('01')) {
                alternativePhone = '88' + phone;
            }

            if (alternativePhone !== phone) {
                console.log(`Retrying phone verification with alternative phone: ${alternativePhone}`);
                try {
                    const result = await authService.verifyPhoneWithCode(alternativePhone, body.code);
                    console.log('Phone verification successful with alternative phone:', result);
                    return res.status(200).json(result);
                } catch (secondaryError: any) {
                    console.error(`Secondary phone verification failed for ${alternativePhone}: ${secondaryError.message}`);
                    throw primaryError;
                }
            }
        }
        throw primaryError;
    }
  } catch (err: any) {
    console.error('Phone Verification Error:', err);
    if (err?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        issues: err.issues
      });
    }
    return res.status(400).json({
      success: false,
      message: err?.message ?? 'Phone verification failed'
    });
  }
}

// Resend phone verification code endpoint
export async function resendPhoneVerificationCode(req: AuthRequest, res: Response) {
  try {
    const body = resendPhoneVerificationCodeSchema.parse(req.body);
    const result = await authService.resendVerificationPhone(body.phone, body.method);
    return res.status(200).json(result);
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
      message: err?.message ?? 'Failed to resend verification code'
    });
  }
}

// Verification Registration Schema
const verifyRegistrationSchema = z.object({
  phone: z.string().min(11, 'Phone number must be at least 11 digits'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

// Verify Registration OTP and Create User
export async function verifyRegistration(req: AuthRequest, res: Response) {
  console.log('--- Verify Registration Request ---');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const body = verifyRegistrationSchema.parse(req.body);
    
    // Normalize phone number if needed (just in case frontend sends without 88)
    let phone = body.phone;
    
    console.log(`Verifying registration for phone: ${phone} with code: ${body.code}`);

    // Try verifying with the provided phone number
    try {
        const result = await authService.verifyRegistration({
            phone: phone,
            code: body.code
        });
        console.log('Verification successful:', result);
        return res.status(200).json(result);
    } catch (primaryError: any) {
        console.warn(`Primary verification failed for ${phone}: ${primaryError.message}`);
        
        // If the error is "Registration session not found", try alternative phone formats
        if (primaryError.message.includes('Registration session not found')) {
            let alternativePhone = phone;
            // If starts with 880, try removing 88
            if (phone.startsWith('880')) {
                alternativePhone = phone.substring(2);
            } 
            // If starts with 01, try adding 88
            else if (phone.startsWith('01')) {
                alternativePhone = '88' + phone;
            }
            
            if (alternativePhone !== phone) {
                console.log(`Retrying verification with alternative phone: ${alternativePhone}`);
                try {
                    const result = await authService.verifyRegistration({
                        phone: alternativePhone,
                        code: body.code
                    });
                    console.log('Verification successful with alternative phone:', result);
                    return res.status(200).json(result);
                } catch (secondaryError: any) {
                    console.error(`Secondary verification failed for ${alternativePhone}: ${secondaryError.message}`);
                    // Throw the original error to the user, or a generic one
                    throw primaryError; 
                }
            }
        }
        throw primaryError;
    }

  } catch (err: any) {
    console.error('Verification Error:', err);
    if (err?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        issues: err.issues
      });
    }
    return res.status(400).json({
      success: false,
      message: err?.message ?? 'Verification failed'
    });
  }
}