"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudinaryEnabled = exports.deleteFile = exports.getFileUrl = exports.validateFile = exports.ALLOWED_TYPES = exports.FILE_LIMITS = exports.voiceUpload = exports.imageUpload = exports.complaintFileUpload = exports.uploadConfig = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const file_security_1 = require("../utils/file-security");
// Check if Cloudinary is enabled via environment variable
const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';
// Ensure upload directories exist (for local storage fallback)
const createUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/complaints',
        'uploads/complaints/images',
        'uploads/complaints/voice',
    ];
    dirs.forEach(dir => {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    });
};
// Initialize upload directories
createUploadDirs();
// File type validation with security checks
const fileFilter = (req, file, cb) => {
    console.log('File filter called:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype
    });
    // Security check: Reject files with dangerous extensions
    if ((0, file_security_1.hasDangerousExtension)(file.originalname)) {
        console.warn(`⚠️  Rejected file with dangerous extension: ${file.originalname}`);
        return cb(new Error('File type not allowed for security reasons'), false);
    }
    // Sanitize filename
    const sanitized = (0, file_security_1.sanitizeFilename)(file.originalname);
    if (!sanitized || sanitized === 'unnamed') {
        console.warn(`⚠️  Rejected file with invalid name: ${file.originalname}`);
        return cb(new Error('Invalid filename'), false);
    }
    // Image files validation
    if (file.fieldname === 'images') {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
        }
    }
    // Audio files validation (voice or audioFiles fieldname)
    else if (file.fieldname === 'voice' || file.fieldname === 'audioFiles') {
        const allowedAudioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mp4'];
        if (allowedAudioTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only MP3, WAV, OGG, M4A, and AAC audio files are allowed'), false);
        }
    }
    else {
        cb(new Error('Invalid file field'), false);
    }
};
// Storage configuration - Hybrid approach
// Use memory storage if Cloudinary is enabled, otherwise use disk storage
const storage = USE_CLOUDINARY
    ? multer_1.default.memoryStorage()
    : multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            let uploadPath = 'uploads/complaints/';
            if (file.fieldname === 'images') {
                uploadPath += 'images/';
            }
            else if (file.fieldname === 'voice' || file.fieldname === 'audioFiles') {
                uploadPath += 'voice/';
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            // Sanitize original filename
            const sanitized = (0, file_security_1.sanitizeFilename)(file.originalname);
            // Generate secure unique filename
            const timestamp = Date.now();
            const randomString = crypto_1.default.randomBytes(16).toString('hex');
            const extension = path_1.default.extname(sanitized);
            const filename = `${timestamp}_${randomString}${extension}`;
            console.log('Generated secure filename:', filename);
            cb(null, filename);
        }
    });
// Multer configuration
exports.uploadConfig = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10, // Maximum 10 files at once
    }
});
// Field configurations for different upload types
// Using .any() to accept all fields including location[address], location[district], etc.
exports.complaintFileUpload = exports.uploadConfig.any();
// Single file upload configurations
exports.imageUpload = exports.uploadConfig.array('images', 5);
exports.voiceUpload = exports.uploadConfig.single('voice');
// File size limits in bytes
exports.FILE_LIMITS = {
    IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    AUDIO_MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_IMAGES: 5,
    MAX_AUDIO_FILES: 1
};
// Allowed file types
exports.ALLOWED_TYPES = {
    IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    AUDIO: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
};
// Helper function to validate file
const validateFile = (file, type) => {
    if (type === 'image') {
        return exports.ALLOWED_TYPES.IMAGES.includes(file.mimetype) && file.size <= exports.FILE_LIMITS.IMAGE_MAX_SIZE;
    }
    else {
        return exports.ALLOWED_TYPES.AUDIO.includes(file.mimetype) && file.size <= exports.FILE_LIMITS.AUDIO_MAX_SIZE;
    }
};
exports.validateFile = validateFile;
// Helper function to get file URL (for local storage)
const getFileUrl = (filename, type) => {
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
    return `${baseUrl}/api/uploads/${type}/${filename}`;
};
exports.getFileUrl = getFileUrl;
// Helper function to delete file (for local storage)
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_1.default.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error deleting file:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
// Export storage mode for other services to check
const isCloudinaryEnabled = () => USE_CLOUDINARY;
exports.isCloudinaryEnabled = isCloudinaryEnabled;
