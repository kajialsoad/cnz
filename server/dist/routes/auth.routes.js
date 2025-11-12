"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rate limiters (increased for development)
const authRateLimiter = (0, auth_middleware_1.createRateLimiter)(15 * 60 * 1000, 50, 'Too many authentication attempts. Please try again later.');
const registrationRateLimiter = (0, auth_middleware_1.createRateLimiter)(60 * 60 * 1000, 50, 'Too many registration attempts. Please try again later.');
// Register endpoint
router.post('/register', registrationRateLimiter, async (req, res) => {
    try {
        console.log('Register endpoint hit with body:', req.body);
        const { error, value } = (0, validation_1.validateInput)(validation_2.registerSchema, req.body);
        if (error) {
            console.log('Validation error:', error.details);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details
            });
        }
        console.log('Validation passed, calling authService.register');
        const result = await auth_service_1.authService.register(value);
        console.log('Registration result:', result);
        res.status(201).json(result);
    }
    catch (error) {
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
        const value = (0, validation_1.validateInput)(validation_2.loginSchema, req.body);
        const tokens = await auth_service_1.authService.login(value);
        res.json({
            success: true,
            message: 'Login successful',
            data: tokens
        });
    }
    catch (error) {
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
        const tokens = await auth_service_1.authService.refreshTokens(refreshToken);
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokens
        });
    }
    catch (error) {
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
        const result = await auth_service_1.authService.logout(refreshToken);
        res.json(result);
    }
    catch (error) {
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
        const { error, value } = (0, validation_1.validateInput)(validation_2.forgotPasswordSchema, req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details
            });
        }
        const result = await auth_service_1.authService.forgotPassword(value.email);
        res.json(result);
    }
    catch (error) {
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
        const { error, value } = (0, validation_1.validateInput)(validation_2.resetPasswordSchema, req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details
            });
        }
        const result = await auth_service_1.authService.resetPassword(value.token, value.password);
        res.json(result);
    }
    catch (error) {
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
        const result = await auth_service_1.authService.verifyEmail(token);
        res.json(result);
    }
    catch (error) {
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
        const result = await auth_service_1.authService.resendVerificationEmail(email);
        res.json(result);
    }
    catch (error) {
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
exports.default = router;
