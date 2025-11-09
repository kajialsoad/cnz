"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.emailLoginSchema = exports.loginSchema = exports.registerSchema = void 0;
exports.validateInput = validateInput;
const joi_1 = __importDefault(require("joi"));
// User validation schemas
exports.registerSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).required()
        .messages({
        'string.empty': 'প্রথম নাম প্রয়োজন',
        'string.min': 'প্রথম নাম কমপক্ষে ২ অক্ষরের হতে হবে',
        'string.max': 'প্রথম নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
    lastName: joi_1.default.string().min(2).max(50).required()
        .messages({
        'string.empty': 'শেষ নাম প্রয়োজন',
        'string.min': 'শেষ নাম কমপক্ষে ২ অক্ষরের হতে হবে',
        'string.max': 'শেষ নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
    email: joi_1.default.string().email().optional()
        .messages({
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
    phone: joi_1.default.string().pattern(/^01[3-9]\d{8}$/).required()
        .messages({
        'string.empty': 'ফোন নম্বর প্রয়োজন',
        'string.pattern.base': 'বৈধ বাংলাদেশি ফোন নম্বর প্রয়োজন (01XXXXXXXXX)',
    }),
    password: joi_1.default.string().min(6).max(128).required()
        .messages({
        'string.empty': 'পাসওয়ার্ড প্রয়োজন',
        'string.min': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
        'string.max': 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
    role: joi_1.default.string().valid('CUSTOMER', 'SERVICE_PROVIDER').optional()
        .messages({
        'any.only': 'রোল কাস্টমার অথবা সার্ভিস প্রোভাইডার হতে হবে',
    }),
});
exports.loginSchema = joi_1.default.object({
    phone: joi_1.default.string().pattern(/^01[3-9]\d{8}$/).required()
        .messages({
        'string.empty': 'ফোন নম্বর প্রয়োজন',
        'string.pattern.base': 'বৈধ বাংলাদেশি ফোন নম্বর প্রয়োজন (01XXXXXXXXX)',
    }),
    password: joi_1.default.string().required()
        .messages({
        'string.empty': 'পাসওয়ার্ড প্রয়োজন',
    }),
});
exports.emailLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required()
        .messages({
        'string.empty': 'ইমেইল প্রয়োজন',
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
    password: joi_1.default.string().required()
        .messages({
        'string.empty': 'পাসওয়ার্ড প্রয়োজন',
    }),
});
exports.forgotPasswordSchema = joi_1.default.object({
    email: joi_1.default.string().email().required()
        .messages({
        'string.empty': 'ইমেইল প্রয়োজন',
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
});
exports.resetPasswordSchema = joi_1.default.object({
    token: joi_1.default.string().required()
        .messages({
        'string.empty': 'টোকেন প্রয়োজন',
    }),
    password: joi_1.default.string().min(6).max(128).required()
        .messages({
        'string.empty': 'নতুন পাসওয়ার্ড প্রয়োজন',
        'string.min': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
        'string.max': 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
});
exports.updateProfileSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50).optional()
        .messages({
        'string.min': 'প্রথম নাম কমপক্ষে ২ অক্ষরের হতে হবে',
        'string.max': 'প্রথম নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
    lastName: joi_1.default.string().min(2).max(50).optional()
        .messages({
        'string.min': 'শেষ নাম কমপক্ষে ২ অক্ষরের হতে হবে',
        'string.max': 'শেষ নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
    email: joi_1.default.string().email().optional()
        .messages({
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
    avatar: joi_1.default.string().uri().optional()
        .messages({
        'string.uri': 'বৈধ ইমেজ URL প্রয়োজন',
    }),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required()
        .messages({
        'string.empty': 'বর্তমান পাসওয়ার্ড প্রয়োজন',
    }),
    newPassword: joi_1.default.string().min(6).max(128).required()
        .messages({
        'string.empty': 'নতুন পাসওয়ার্ড প্রয়োজন',
        'string.min': 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
        'string.max': 'নতুন পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
});
// Validation helper function
function validateInput(schema, data) {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        const errors = {};
        error.details.forEach((detail) => {
            if (detail.path.length > 0) {
                errors[detail.path[0].toString()] = detail.message;
            }
        });
        throw {
            name: 'ValidationError',
            message: 'ইনপুট ভ্যালিডেশন ত্রুটি',
            errors,
        };
    }
    return value;
}
