"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintQuerySchema = exports.updateComplaintSchema = exports.createComplaintSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.emailLoginSchema = exports.loginSchema = exports.registerSchema = void 0;
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
    zone: joi_1.default.string().valid('DSCC', 'DNCC').optional()
        .messages({
        'any.only': 'জোন DSCC বা DNCC হতে হবে',
    }),
    cityCorporationCode: joi_1.default.string().valid('DSCC', 'DNCC').optional()
        .messages({
        'any.only': 'সিটি কর্পোরেশন DSCC বা DNCC হতে হবে',
    }),
    ward: joi_1.default.string().optional()
        .messages({
        'string.base': 'ওয়ার্ড নম্বর প্রয়োজন',
    }),
    thanaId: joi_1.default.number().integer().positive().optional()
        .messages({
        'number.base': 'বৈধ থানা আইডি প্রয়োজন',
    }),
    zoneId: joi_1.default.number().integer().positive().optional(),
    wardId: joi_1.default.number().integer().positive().optional(),
    address: joi_1.default.string().max(255).optional()
        .messages({
        'string.max': 'ঠিকানা সর্বোচ্চ ২৫৫ অক্ষরের হতে হবে',
    }),
    role: joi_1.default.string().valid('CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN').optional()
        .messages({
        'any.only': 'রোল CUSTOMER, SERVICE_PROVIDER, ADMIN, SUPER_ADMIN অথবা MASTER_ADMIN হতে হবে',
    }),
}).rename('CityCorporationCode', 'cityCorporationCode', { ignoreUndefined: true });
exports.loginSchema = joi_1.default.object({
    phone: joi_1.default.string().pattern(/^01[3-9]\d{8}$/).optional()
        .messages({
        'string.pattern.base': 'বৈধ বাংলাদেশি ফোন নম্বর প্রয়োজন (01XXXXXXXXX)',
    }),
    email: joi_1.default.string().email().optional()
        .messages({
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
    password: joi_1.default.string().required()
        .messages({
        'string.empty': 'পাসওয়ার্ড প্রয়োজন',
    }),
    portal: joi_1.default.string().valid('ADMIN', 'APP').required()
        .messages({
        'any.only': 'পোর্টাল ADMIN অথবা APP হতে হবে',
        'any.required': 'পোর্টাল তথ্য প্রয়োজন',
    }),
}).or('phone', 'email')
    .messages({
    'object.missing': 'ফোন নম্বর অথবা ইমেইল প্রয়োজন',
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
    phone: joi_1.default.string().min(6).max(20).optional()
        .messages({
        'string.min': 'ফোন নম্বর কমপক্ষে ৬ অক্ষরের হতে হবে',
        'string.max': 'ফোন নম্বর সর্বোচ্চ ২০ অক্ষরের হতে হবে',
    }),
    email: joi_1.default.string().email().optional()
        .messages({
        'string.email': 'বৈধ ইমেইল ঠিকানা প্রয়োজন',
    }),
    avatar: joi_1.default.string().uri().optional()
        .messages({
        'string.uri': 'বৈধ ইমেজ URL প্রয়োজন',
    }),
    zone: joi_1.default.string().valid('DSCC', 'DNCC').optional()
        .messages({
        'any.only': 'জোন DSCC বা DNCC হতে হবে',
    }),
    ward: joi_1.default.string().optional()
        .messages({
        'string.base': 'ওয়ার্ড নম্বর প্রয়োজন',
    }),
    zoneId: joi_1.default.number().integer().positive().optional()
        .messages({
        'number.base': 'জোন আইডি একটি সংখ্যা হতে হবে',
        'number.positive': 'জোন আইডি পজিটিভ হতে হবে',
    }),
    wardId: joi_1.default.number().integer().positive().optional()
        .messages({
        'number.base': 'ওয়ার্ড আইডি একটি সংখ্যা হতে হবে',
        'number.positive': 'ওয়ার্ড আইডি পজিটিভ হতে হবে',
    }),
    cityCorporationCode: joi_1.default.string().optional()
        .messages({
        'string.base': 'সিটি কর্পোরেশন কোড প্রয়োজন',
    }),
    address: joi_1.default.string().max(255).optional()
        .messages({
        'string.max': 'ঠিকানা সর্বোচ্চ ২৫৫ অক্ষরের হতে হবে',
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
// Complaint validation schemas
exports.createComplaintSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(200).optional() // Optional - will be auto-generated
        .messages({
        'string.min': 'অভিযোগের শিরোনাম কমপক্ষে ৫ অক্ষরের হতে হবে',
        'string.max': 'অভিযোগের শিরোনাম সর্বোচ্চ ২০০ অক্ষরের হতে হবে',
    }),
    description: joi_1.default.string().min(3).max(2000).required() // Reduced to 3 for testing
        .messages({
        'string.empty': 'অভিযোগের বর্ণনা প্রয়োজন',
        'string.min': 'অভিযোগের বর্ণনা কমপক্ষে ৩ অক্ষরের হতে হবে',
        'string.max': 'অভিযোগের বর্ণনা সর্বোচ্চ ২০০০ অক্ষরের হতে হবে',
    }),
    category: joi_1.default.string().required()
        .messages({
        'string.empty': 'অভিযোগের ধরন নির্বাচন করুন',
        'any.required': 'অভিযোগের ধরন নির্বাচন করুন',
    }),
    subcategory: joi_1.default.string().required()
        .messages({
        'string.empty': 'নির্দিষ্ট সমস্যা নির্বাচন করুন',
        'any.required': 'নির্দিষ্ট সমস্যা নির্বাচন করুন',
    }),
    priority: joi_1.default.number().integer().min(1).max(4).optional()
        .messages({
        'number.base': 'বৈধ অগ্রাধিকার নির্বাচন করুন',
        'number.min': 'অগ্রাধিকার ১-৪ এর মধ্যে হতে হবে',
        'number.max': 'অগ্রাধিকার ১-৪ এর মধ্যে হতে হবে',
    }),
    forSomeoneElse: joi_1.default.boolean().optional(), // Flag for nullable userId
    // NEW: Geographical ID fields for dynamic system
    cityCorporationCode: joi_1.default.string().optional()
        .messages({
        'string.empty': 'সিটি কর্পোরেশন নির্বাচন করুন',
    }),
    zoneId: joi_1.default.alternatives().try(joi_1.default.number().integer().positive(), joi_1.default.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))).optional()
        .messages({
        'number.base': 'বৈধ জোন নির্বাচন করুন',
        'number.positive': 'বৈধ জোন নির্বাচন করুন',
    }),
    wardId: joi_1.default.alternatives().try(joi_1.default.number().integer().positive(), joi_1.default.string().pattern(/^\d+$/).custom((value, helpers) => parseInt(value, 10))).optional()
        .messages({
        'number.base': 'বৈধ ওয়ার্ড নির্বাচন করুন',
        'number.positive': 'বৈধ ওয়ার্ড নির্বাচন করুন',
    }),
    // Location object - when using new geographical IDs, only address is required
    location: joi_1.default.alternatives().try(joi_1.default.object({
        address: joi_1.default.string().min(3).max(500).required()
            .messages({
            'string.empty': 'সম্পূর্ণ ঠিকানা প্রয়োজন',
            'string.min': 'ঠিকানা কমপক্ষে ৩ অক্ষরের হতে হবে',
            'string.max': 'ঠিকানা সর্বোচ্চ ৫০০ অক্ষরের হতে হবে',
        }),
        district: joi_1.default.string().optional().allow('').default(''),
        thana: joi_1.default.string().optional().allow('').default(''),
        ward: joi_1.default.string().optional().allow('').default(''),
        latitude: joi_1.default.number().min(-90).max(90).optional()
            .messages({
            'number.min': 'বৈধ অক্ষাংশ প্রয়োজন',
            'number.max': 'বৈধ অক্ষাংশ প্রয়োজন',
        }),
        longitude: joi_1.default.number().min(-180).max(180).optional()
            .messages({
            'number.min': 'বৈধ দ্রাঘিমাংশ প্রয়োজন',
            'number.max': 'বৈধ দ্রাঘিমাংশ প্রয়োজন',
        }),
    }), joi_1.default.string().min(3).max(500)).optional(),
    imageUrls: joi_1.default.array().items(joi_1.default.string().uri()).optional()
        .messages({
        'string.uri': 'বৈধ ছবির URL প্রয়োজন',
    }),
    voiceNoteUrl: joi_1.default.string().uri().optional()
        .messages({
        'string.uri': 'বৈধ ভয়েস নোট URL প্রয়োজন',
    }),
}).custom((value, helpers) => {
    // Custom validation: Ensure either geographical IDs or full location is provided
    const hasGeographicalIds = value.cityCorporationCode && value.zoneId && value.wardId;
    const hasFullLocation = value.location &&
        value.location.address &&
        value.location.district &&
        value.location.thana &&
        value.location.ward;
    // If geographical IDs are provided, location fields are optional
    if (hasGeographicalIds) {
        return value;
    }
    // If no geographical IDs, require full location
    if (!hasFullLocation) {
        return helpers.error('custom.locationRequired', {
            message: 'জোন নির্বাচন করুন, ওয়ার্ড নির্বাচন করুন, ওয়ার্ড নম্বর প্রয়োজন'
        });
    }
    return value;
}, 'Location or Geographical IDs validation');
exports.updateComplaintSchema = joi_1.default.object({
    title: joi_1.default.string().min(5).max(200).optional(),
    description: joi_1.default.string().min(10).max(2000).optional(),
    category: joi_1.default.string().optional(),
    subcategory: joi_1.default.string().optional(),
    priority: joi_1.default.number().integer().min(1).max(4).optional(),
    status: joi_1.default.string().valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED').optional(),
    location: joi_1.default.object({
        address: joi_1.default.string().min(10).max(500).optional(),
        district: joi_1.default.string().optional(),
        thana: joi_1.default.string().optional(),
        ward: joi_1.default.string().optional(),
        latitude: joi_1.default.number().min(-90).max(90).optional(),
        longitude: joi_1.default.number().min(-180).max(180).optional(),
    }).optional(),
    imageUrls: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    voiceNoteUrl: joi_1.default.string().uri().optional(),
});
exports.complaintQuerySchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(50).optional(),
    status: joi_1.default.string().valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED').optional(),
    category: joi_1.default.string().optional(),
    subcategory: joi_1.default.string().optional(),
    priority: joi_1.default.number().integer().min(1).max(4).optional(),
    sortBy: joi_1.default.string().valid('createdAt', 'updatedAt', 'priority', 'status').optional(),
    sortOrder: joi_1.default.string().valid('asc', 'desc').optional(),
});
// Validation helper function
function validateInput(schema, data) {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(detail => detail.message).join(', ');
        throw new Error(errorMessage);
    }
    return value;
}
