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
  zone: Joi.string().valid('DSCC', 'DNCC').optional()
    .messages({
      'any.only': 'জোন DSCC বা DNCC হতে হবে',
    }),
  ward: Joi.string().optional()
    .messages({
      'string.base': 'ওয়ার্ড নম্বর প্রয়োজন',
    }),
  address: Joi.string().max(255).optional()
    .messages({
      'string.max': 'ঠিকানা সর্বোচ্চ ২৫৫ অক্ষরের হতে হবে',
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
  zone: Joi.string().valid('DSCC', 'DNCC').optional()
    .messages({
      'any.only': 'জোন DSCC বা DNCC হতে হবে',
    }),
  ward: Joi.string().optional()
    .messages({
      'string.base': 'ওয়ার্ড নম্বর প্রয়োজন',
    }),
  address: Joi.string().max(255).optional()
    .messages({
      'string.max': 'ঠিকানা সর্বোচ্চ ২৫৫ অক্ষরের হতে হবে',
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

// Complaint validation schemas
export const createComplaintSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional() // Optional - will be auto-generated
    .messages({
      'string.min': 'অভিযোগের শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে',
      'string.max': 'অভিযোগের শিরোনাম সর্বোচ্চ ২০০ অক্ষরের হতে হবে',
    }),
  description: Joi.string().min(3).max(2000).required() // Reduced to 3 for testing
    .messages({
      'string.empty': 'অভিযোগের বর্ণনা প্রয়োজন',
      'string.min': 'অভিযোগের বর্ণনা কমপক্ষে ৩ অক্ষরের হতে হবে',
      'string.max': 'অভিযোগের বর্ণনা সর্বোচ্চ ২০০০ অক্ষরের হতে হবে',
    }),
  category: Joi.string().required()
    .messages({
      'string.empty': 'অভিযোগের ধরন নির্বাচন করুন',
      'any.required': 'অভিযোগের ধরন নির্বাচন করুন',
    }),
  subcategory: Joi.string().required()
    .messages({
      'string.empty': 'নির্দিষ্ট সমস্যা নির্বাচন করুন',
      'any.required': 'নির্দিষ্ট সমস্যা নির্বাচন করুন',
    }),
  priority: Joi.number().integer().min(1).max(4).optional()
    .messages({
      'number.base': 'বৈধ অগ্রাধিকার নির্বাচন করুন',
      'number.min': 'অগ্রাধিকার ১-৪ এর মধ্যে হতে হবে',
      'number.max': 'অগ্রাধিকার ১-৪ এর মধ্যে হতে হবে',
    }),
  forSomeoneElse: Joi.boolean().optional(), // Flag for nullable userId
  location: Joi.object({
    address: Joi.string().min(10).max(500).required()
      .messages({
        'string.empty': 'সম্পূর্ণ ঠিকানা প্রয়োজন',
        'string.min': 'ঠিকানা কমপক্ষে ১০ অক্ষরের হতে হবে',
        'string.max': 'ঠিকানা সর্বোচ্চ ৫০০ অক্ষরের হতে হবে',
      }),
    district: Joi.string().required()
      .messages({
        'string.empty': 'জেলা নির্বাচন করুন',
      }),
    thana: Joi.string().required()
      .messages({
        'string.empty': 'থানা নির্বাচন করুন',
      }),
    ward: Joi.string().required()
      .messages({
        'string.empty': 'ওয়ার্ড নম্বর প্রয়োজন',
      }),
    latitude: Joi.number().min(-90).max(90).optional()
      .messages({
        'number.min': 'বৈধ অক্ষাংশ প্রয়োজন',
        'number.max': 'বৈধ অক্ষাংশ প্রয়োজন',
      }),
    longitude: Joi.number().min(-180).max(180).optional()
      .messages({
        'number.min': 'বৈধ দ্রাঘিমাংশ প্রয়োজন',
        'number.max': 'বৈধ দ্রাঘিমাংশ প্রয়োজন',
      }),
  }).required(),
  imageUrls: Joi.array().items(Joi.string().uri()).optional()
    .messages({
      'string.uri': 'বৈধ ছবির URL প্রয়োজন',
    }),
  voiceNoteUrl: Joi.string().uri().optional()
    .messages({
      'string.uri': 'বৈধ ভয়েস নোট URL প্রয়োজন',
    }),
});

export const updateComplaintSchema = Joi.object({
  title: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  priority: Joi.number().integer().min(1).max(4).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED').optional(),
  location: Joi.object({
    address: Joi.string().min(10).max(500).optional(),
    district: Joi.string().optional(),
    thana: Joi.string().optional(),
    ward: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
  }).optional(),
  imageUrls: Joi.array().items(Joi.string().uri()).optional(),
  voiceNoteUrl: Joi.string().uri().optional(),
});

export const complaintQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED').optional(),
  category: Joi.string().optional(),
  subcategory: Joi.string().optional(),
  priority: Joi.number().integer().min(1).max(4).optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'priority', 'status').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

// Validation helper function
export function validateInput(schema: Joi.Schema, data: any) {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(errorMessage);
  }
  return value;
}