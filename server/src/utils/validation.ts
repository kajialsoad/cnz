import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required()
    .messages({
      'string.empty': 'প্রথম নাম প্রয়োজন',
      'string.min': 'প্রথম নাম কমপক্ষে ২ অক্ষরের হতে হবে',
      'string.max': 'প্রথম নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
  lastName: Joi.string().min(2).max(50).required()
    .messages({
      'string.empty': 'শেষ নাম প্রয়োজন',
      'string.min': 'শেষ নাম কমপক্ষে ২ অক্ষরের হতে হবে',
      'string.max': 'শেষ নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
  email: Joi.string().email().optional()
    .messages({
      'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
  phone: Joi.string().pattern(/^01[3-9]\d{8}$/).required()
    .messages({
      'string.empty': 'ফোন নম্বর প্রয়োজন',
      'string.pattern.base': 'বৈধ বাংলাদেশি ফোন নম্বর প্রয়োজন (01XXXXXXXXX)',
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.empty': 'পাসওয়ার্ড প্রয়োজন',
      'string.min': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      'string.max': 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
  role: Joi.string().valid('CUSTOMER', 'SERVICE_PROVIDER').optional()
    .messages({
      'any.only': 'রোল কাস্টমার অথবা সার্ভিস প্রোভাইডার হতে হবে',
    }),
});

export const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^01[3-9]\d{8}$/).optional()
    .messages({
      'string.pattern.base': 'বৈধ বাংলাদেশি ফোন নম্বর প্রয়োজন (01XXXXXXXXX)',
    }),
  email: Joi.string().email().optional()
    .messages({
      'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'পাসওয়ার্ড প্রয়োজন',
    }),
}).or('phone', 'email')
  .messages({
    'object.missing': 'ফোন নম্বর অথবা ইমেইল প্রয়োজন',
  });

export const emailLoginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'ইমেইল প্রয়োজন',
      'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'পাসওয়ার্ড প্রয়োজন',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'ইমেইল প্রয়োজন',
      'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'টোকেন প্রয়োজন',
    }),
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.empty': 'নতুন পাসওয়ার্ড প্রয়োজন',
      'string.min': 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      'string.max': 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional()
    .messages({
      'string.min': 'প্রথম নাম কমপক্ষে ২ অক্ষরের হতে হবে',
      'string.max': 'প্রথম নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
  lastName: Joi.string().min(2).max(50).optional()
    .messages({
      'string.min': 'শেষ নাম কমপক্ষে ২ অক্ষরের হতে হবে',
      'string.max': 'শেষ নাম সর্বোচ্চ ৫০ অক্ষরের হতে হবে',
    }),
  email: Joi.string().email().optional()
    .messages({
      'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
  avatar: Joi.string().uri().optional()
    .messages({
      'string.uri': 'বৈধ ইমেজ URL প্রয়োজন',
    }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'বর্তমান পাসওয়ার্ড প্রয়োজন',
    }),
  newPassword: Joi.string().min(6).max(128).required()
    .messages({
      'string.empty': 'নতুন পাসওয়ার্ড প্রয়োজন',
      'string.min': 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে',
      'string.max': 'নতুন পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে হবে',
    }),
});

// Validation helper function
export function validateInput(schema: Joi.Schema, data: any) {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const errors: Record<string, string> = {};
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