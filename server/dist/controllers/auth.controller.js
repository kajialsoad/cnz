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
});
const loginSchema = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().min(6).optional(),
    password: zod_1.z.string(),
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
            email: body.email,
            password: body.password,
            phone: body.phone,
            ward: body.ward,
            zone: body.zone,
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
        const result = await auth_service_1.authService.login({
            email: body.email,
            phone: body.phone,
            password: body.password,
        });
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
    firstName: zod_1.z.string().min(2).optional(),
    lastName: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().min(6).optional(),
    address: zod_1.z.string().optional(),
    avatar: zod_1.z.string().url().optional(),
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
        const result = await auth_service_1.authService.resendVerificationCode(body.email);
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
