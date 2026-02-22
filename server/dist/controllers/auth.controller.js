"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.me = me;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.verifyEmail = verifyEmail;
exports.updateProfile = updateProfile;
exports.resendVerificationEmail = resendVerificationEmail;
exports.verifyEmailWithCode = verifyEmailWithCode;
exports.resendVerificationCode = resendVerificationCode;
exports.verifyPhoneWithCode = verifyPhoneWithCode;
exports.resendPhoneVerificationCode = resendPhoneVerificationCode;
exports.verifyRegistration = verifyRegistration;
const auth_service_1 = require("../services/auth.service");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    phone: zod_1.z.string().min(6),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    ward: zod_1.z.string().optional(),
    zone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    cityCorporationCode: zod_1.z.string().optional(),
    thanaId: zod_1.z.number().int().positive().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
});
const loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(6).optional(),
    password: zod_1.z.string(),
    portal: zod_1.z.enum(['ADMIN', 'APP']).optional(),
})
    .refine((data) => !!(data.email || data.phone), {
    message: 'Provide email or phone',
    path: ['email'],
});
async function register(req, res) {
    try {
        const body = registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register({
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
    }
    catch (err) {
        if (err?.name === 'ZodError') {
            return res.status(400).json({ message: 'Validation error', issues: err.issues });
        }
        return res.status(400).json({ message: err?.message ?? 'Registration failed' });
    }
}
async function login(req, res) {
    try {
        const body = loginSchema.parse(req.body);
        const ip = req.ip || req.socket.remoteAddress;
        const result = await auth_service_1.authService.login({
            email: body.email?.toLowerCase(),
            phone: body.phone,
            password: body.password,
            portal: body.portal,
        }, ip);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Login failed' });
    }
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: 'Missing refreshToken' });
        const result = await auth_service_1.authService.refreshTokens(refreshToken);
        return res.status(200).json(result);
    }
    catch (err) {
        return res.status(401).json({ message: err?.message ?? 'Refresh failed' });
    }
}
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        await auth_service_1.authService.logout(refreshToken);
        return res.status(200).json({ message: 'ok' });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Logout failed' });
    }
}
async function me(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await auth_service_1.authService.getProfile(req.user.sub.toString());
        return res.status(200).json({ user });
    }
    catch (err) {
        return res.status(400).json({ message: err?.message ?? 'Failed to load user' });
    }
}
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
async function forgotPassword(req, res) {
    try {
        const body = forgotPasswordSchema.parse(req.body);
        await auth_service_1.authService.forgotPassword(body.email);
        return res.status(200).json({
            success: true,
            message: 'Password reset email sent successfully'
        });
    }
    catch (err) {
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
const resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6),
});
async function resetPassword(req, res) {
    try {
        const body = resetPasswordSchema.parse(req.body);
        await auth_service_1.authService.resetPassword(body.token, body.password);
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }
    catch (err) {
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
const verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
async function verifyEmail(req, res) {
    try {
        const body = verifyEmailSchema.parse(req.body);
        await auth_service_1.authService.verifyEmail(body.token);
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    }
    catch (err) {
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
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().min(2).optional()),
    lastName: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().min(2).optional()),
    phone: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().min(6).optional()),
    email: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().email().optional()),
    address: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().optional()),
    avatar: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().url().optional()),
    ward: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().optional()),
    zone: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().optional()),
    cityCorporationCode: zod_1.z.preprocess((val) => (val === '' ? undefined : val), zod_1.z.string().optional()),
    thanaId: zod_1.z.number().int().positive().optional(),
    zoneId: zod_1.z.number().int().positive().optional(),
    wardId: zod_1.z.number().int().positive().optional(),
});
async function updateProfile(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        const body = updateProfileSchema.parse(req.body);
        const user = await auth_service_1.authService.updateProfile(req.user.sub.toString(), body);
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    }
    catch (err) {
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
async function resendVerificationEmail(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        await auth_service_1.authService.resendVerificationEmail(req.user.sub.toString());
        return res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err?.message ?? 'Failed to resend verification email'
        });
    }
}
// Verification code endpoint schemas
const verifyEmailCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
});
const resendVerificationCodeSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
// 7.2 Verify email with code endpoint
async function verifyEmailWithCode(req, res) {
    try {
        const body = verifyEmailCodeSchema.parse(req.body);
        const result = await auth_service_1.authService.verifyEmailWithCode(body.email, body.code);
        return res.status(200).json(result);
    }
    catch (err) {
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
async function resendVerificationCode(req, res) {
    try {
        const body = resendVerificationCodeSchema.parse(req.body);
        const result = await auth_service_1.authService.resendVerificationEmail(body.email);
        return res.status(200).json(result);
    }
    catch (err) {
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
const verifyPhoneCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().min(11, 'Phone number must be at least 11 digits'),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
});
const resendPhoneVerificationCodeSchema = zod_1.z.object({
    phone: zod_1.z.string().min(11, 'Phone number must be at least 11 digits'),
    method: zod_1.z.enum(['sms', 'whatsapp']).optional().default('sms'),
});
// Verify phone with code endpoint
async function verifyPhoneWithCode(req, res) {
    console.log('--- Verify Phone With Code Request ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    try {
        const body = verifyPhoneCodeSchema.parse(req.body);
        let phone = body.phone;
        console.log(`Verifying phone: ${phone} with code: ${body.code}`);
        try {
            const result = await auth_service_1.authService.verifyPhoneWithCode(phone, body.code);
            console.log('Phone verification successful:', result);
            return res.status(200).json(result);
        }
        catch (primaryError) {
            console.warn(`Primary phone verification failed for ${phone}: ${primaryError.message}`);
            // If user not found, try alternative phone formats
            if (primaryError.message === 'User not found') {
                let alternativePhone = phone;
                if (phone.startsWith('880')) {
                    alternativePhone = phone.substring(2);
                }
                else if (phone.startsWith('01')) {
                    alternativePhone = '88' + phone;
                }
                if (alternativePhone !== phone) {
                    console.log(`Retrying phone verification with alternative phone: ${alternativePhone}`);
                    try {
                        const result = await auth_service_1.authService.verifyPhoneWithCode(alternativePhone, body.code);
                        console.log('Phone verification successful with alternative phone:', result);
                        return res.status(200).json(result);
                    }
                    catch (secondaryError) {
                        console.error(`Secondary phone verification failed for ${alternativePhone}: ${secondaryError.message}`);
                        throw primaryError;
                    }
                }
            }
            throw primaryError;
        }
    }
    catch (err) {
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
async function resendPhoneVerificationCode(req, res) {
    try {
        const body = resendPhoneVerificationCodeSchema.parse(req.body);
        const result = await auth_service_1.authService.resendVerificationPhone(body.phone, body.method);
        return res.status(200).json(result);
    }
    catch (err) {
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
const verifyRegistrationSchema = zod_1.z.object({
    phone: zod_1.z.string().min(11, 'Phone number must be at least 11 digits'),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
});
// Verify Registration OTP and Create User
async function verifyRegistration(req, res) {
    console.log('--- Verify Registration Request ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    try {
        const body = verifyRegistrationSchema.parse(req.body);
        // Normalize phone number if needed (just in case frontend sends without 88)
        let phone = body.phone;
        console.log(`Verifying registration for phone: ${phone} with code: ${body.code}`);
        // Try verifying with the provided phone number
        try {
            const result = await auth_service_1.authService.verifyRegistration({
                phone: phone,
                code: body.code
            });
            console.log('Verification successful:', result);
            return res.status(200).json(result);
        }
        catch (primaryError) {
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
                        const result = await auth_service_1.authService.verifyRegistration({
                            phone: alternativePhone,
                            code: body.code
                        });
                        console.log('Verification successful with alternative phone:', result);
                        return res.status(200).json(result);
                    }
                    catch (secondaryError) {
                        console.error(`Secondary verification failed for ${alternativePhone}: ${secondaryError.message}`);
                        // Throw the original error to the user, or a generic one
                        throw primaryError;
                    }
                }
            }
            throw primaryError;
        }
    }
    catch (err) {
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
