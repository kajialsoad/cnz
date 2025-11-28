/**
 * File Security Utilities
 * 
 * This module provides security utilities for file uploads including:
 * - Filename sanitization
 * - File type validation
 * - File size validation
 * - Malicious content detection
 */

import path from 'path';
import crypto from 'crypto';

/**
 * Allowed MIME types for images
 */
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
];

/**
 * Allowed MIME types for audio files
 */
export const ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/m4a',
    'audio/aac',
    'audio/mp4'
];

/**
 * Maximum file sizes in bytes
 */
export const MAX_FILE_SIZES = {
    IMAGE: 5 * 1024 * 1024,  // 5MB
    AUDIO: 10 * 1024 * 1024, // 10MB
};

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
    '.vbs', '.js', '.jar', '.msi', '.app', '.deb',
    '.rpm', '.dmg', '.pkg', '.sh', '.bash', '.ps1',
    '.php', '.asp', '.aspx', '.jsp', '.cgi'
];

/**
 * Sanitize filename to prevent directory traversal and other attacks
 * 
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
    if (!filename) {
        return 'unnamed';
    }

    // Remove any path components (directory traversal prevention)
    let sanitized = path.basename(filename);

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove or replace dangerous characters
    sanitized = sanitized.replace(/[<>:"|?*]/g, '_');

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');

    // Replace multiple dots with single dot (except before extension)
    sanitized = sanitized.replace(/\.{2,}/g, '.');

    // Limit length
    const maxLength = 255;
    if (sanitized.length > maxLength) {
        const ext = path.extname(sanitized);
        const nameWithoutExt = sanitized.slice(0, maxLength - ext.length);
        sanitized = nameWithoutExt + ext;
    }

    // If filename is empty after sanitization, use a default
    if (!sanitized || sanitized === '.') {
        sanitized = 'unnamed';
    }

    return sanitized;
}

/**
 * Generate a secure random filename
 * 
 * @param originalFilename - Original filename (used for extension)
 * @returns Secure random filename
 */
export function generateSecureFilename(originalFilename: string): string {
    const sanitized = sanitizeFilename(originalFilename);
    const ext = path.extname(sanitized);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');

    return `${timestamp}_${randomString}${ext}`;
}

/**
 * Validate file type against allowed types
 * 
 * @param mimetype - File MIME type
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileType(
    mimetype: string,
    allowedTypes: string[]
): { valid: boolean; error?: string } {
    if (!mimetype) {
        return {
            valid: false,
            error: 'File type is missing'
        };
    }

    const normalizedMimetype = mimetype.toLowerCase().trim();

    if (!allowedTypes.includes(normalizedMimetype)) {
        return {
            valid: false,
            error: `File type '${mimetype}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
    }

    return { valid: true };
}

/**
 * Validate file size against maximum allowed size
 * 
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns Validation result
 */
export function validateFileSize(
    size: number,
    maxSize: number
): { valid: boolean; error?: string } {
    if (!size || size <= 0) {
        return {
            valid: false,
            error: 'File size is invalid'
        };
    }

    if (size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
        const actualSizeMB = (size / (1024 * 1024)).toFixed(2);
        return {
            valid: false,
            error: `File size (${actualSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
        };
    }

    return { valid: true };
}

/**
 * Check if filename has a dangerous extension
 * 
 * @param filename - Filename to check
 * @returns True if filename has a dangerous extension
 */
export function hasDangerousExtension(filename: string): boolean {
    if (!filename) {
        return false;
    }

    const ext = path.extname(filename).toLowerCase();
    return DANGEROUS_EXTENSIONS.includes(ext);
}

/**
 * Validate image file
 * 
 * @param file - Express.Multer.File object
 * @returns Validation result
 */
export function validateImageFile(
    file: Express.Multer.File
): { valid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
        return {
            valid: false,
            error: 'No file provided'
        };
    }

    // Check for dangerous extension
    if (hasDangerousExtension(file.originalname)) {
        return {
            valid: false,
            error: 'File has a dangerous extension'
        };
    }

    // Validate file type
    const typeValidation = validateFileType(file.mimetype, ALLOWED_IMAGE_TYPES);
    if (!typeValidation.valid) {
        return typeValidation;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.size, MAX_FILE_SIZES.IMAGE);
    if (!sizeValidation.valid) {
        return sizeValidation;
    }

    return { valid: true };
}

/**
 * Validate audio file
 * 
 * @param file - Express.Multer.File object
 * @returns Validation result
 */
export function validateAudioFile(
    file: Express.Multer.File
): { valid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
        return {
            valid: false,
            error: 'No file provided'
        };
    }

    // Check for dangerous extension
    if (hasDangerousExtension(file.originalname)) {
        return {
            valid: false,
            error: 'File has a dangerous extension'
        };
    }

    // Validate file type
    const typeValidation = validateFileType(file.mimetype, ALLOWED_AUDIO_TYPES);
    if (!typeValidation.valid) {
        return typeValidation;
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.size, MAX_FILE_SIZES.AUDIO);
    if (!sizeValidation.valid) {
        return sizeValidation;
    }

    return { valid: true };
}

/**
 * Validate multiple files
 * 
 * @param files - Array of Express.Multer.File objects
 * @param fileType - Type of files ('image' or 'audio')
 * @param maxFiles - Maximum number of files allowed
 * @returns Validation result
 */
export function validateMultipleFiles(
    files: Express.Multer.File[],
    fileType: 'image' | 'audio',
    maxFiles: number
): { valid: boolean; error?: string } {
    if (!files || !Array.isArray(files)) {
        return {
            valid: false,
            error: 'Invalid files array'
        };
    }

    if (files.length === 0) {
        return {
            valid: false,
            error: 'No files provided'
        };
    }

    if (files.length > maxFiles) {
        return {
            valid: false,
            error: `Too many files. Maximum ${maxFiles} files allowed`
        };
    }

    // Validate each file
    const validator = fileType === 'image' ? validateImageFile : validateAudioFile;

    for (let i = 0; i < files.length; i++) {
        const validation = validator(files[i]);
        if (!validation.valid) {
            return {
                valid: false,
                error: `File ${i + 1}: ${validation.error}`
            };
        }
    }

    return { valid: true };
}

/**
 * Check if a URL is a valid Cloudinary URL
 * 
 * @param url - URL to check
 * @returns True if URL is a valid Cloudinary URL
 */
export function isValidCloudinaryUrl(url: string): boolean {
    if (!url) {
        return false;
    }

    try {
        const parsedUrl = new URL(url);

        // Check if it's a Cloudinary URL
        if (!parsedUrl.hostname.includes('cloudinary.com')) {
            return false;
        }

        // Check if it uses HTTPS
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }

        // Check if it has the expected path structure
        // Example: https://res.cloudinary.com/cloud-name/image/upload/...
        const pathParts = parsedUrl.pathname.split('/').filter(p => p);
        if (pathParts.length < 3) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Extract public_id from Cloudinary URL
 * 
 * @param url - Cloudinary URL
 * @returns Public ID or null if invalid
 */
export function extractPublicIdFromUrl(url: string): string | null {
    if (!isValidCloudinaryUrl(url)) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/').filter(p => p);

        // Find the 'upload' part
        const uploadIndex = pathParts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex >= pathParts.length - 1) {
            return null;
        }

        // Everything after 'upload' (and optional version) is the public_id
        const afterUpload = pathParts.slice(uploadIndex + 1);

        // Remove version if present (starts with 'v' followed by numbers)
        if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
            afterUpload.shift();
        }

        // Join remaining parts and remove extension
        const publicIdWithExt = afterUpload.join('/');
        const lastDotIndex = publicIdWithExt.lastIndexOf('.');

        if (lastDotIndex > 0) {
            return publicIdWithExt.substring(0, lastDotIndex);
        }

        return publicIdWithExt;
    } catch (error) {
        return null;
    }
}
