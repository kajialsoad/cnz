"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authController = __importStar(require("../controllers/auth.controller"));
const router = (0, express_1.Router)();
// Rate limiters (increased for development)
const authRateLimiter = (0, auth_middleware_1.createRateLimiter)(15 * 60 * 1000, 50, 'Too many authentication attempts. Please try again later.');
const registrationRateLimiter = (0, auth_middleware_1.createRateLimiter)(60 * 60 * 1000, 50, 'Too many registration attempts. Please try again later.');
// Email verification rate limiters
// 3 requests per 15 minutes per email for resend verification
const resendVerificationRateLimiter = (0, auth_middleware_1.createEmailRateLimiter)(15 * 60 * 1000, 3, 'Too many verification code requests. Please try again in 15 minutes.');
// 5 attempts per 15 minutes per email for verification
const verifyEmailRateLimiter = (0, auth_middleware_1.createCodeRateLimiter)(15 * 60 * 1000, 5, 'Too many verification attempts. Please try again in 15 minutes.');
// Register endpoint
router.post('/register', registrationRateLimiter, async (req, res) => {
    try {
        console.log('Register endpoint hit with body:', req.body);
        const value = (0, validation_1.validateInput)(validation_2.registerSchema, req.body);
        console.log('Validation passed, value object:', value);
        console.log('Calling authService.register');
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
        const result = await auth_service_1.authService.verifyEmailWithCode(email, code);
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
// Verify email with code endpoint (new verification flow)
router.post('/verify-email-code', verifyEmailRateLimiter, authController.verifyEmailWithCode);
// Resend verification code endpoint
router.post('/resend-verification-code', resendVerificationRateLimiter, authController.resendVerificationCode);
// Test email service connection endpoint (for development/testing)
router.get('/test-email', async (req, res) => {
    try {
        const emailService = (await Promise.resolve().then(() => __importStar(require('../services/email.service')))).default;
        const isConnected = await emailService.testConnection();
        if (isConnected) {
            res.json({
                success: true,
                message: 'Email service is configured correctly and ready to send emails'
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Email service connection failed. Please check your SMTP configuration.'
            });
        }
    }
    catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing email service',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
