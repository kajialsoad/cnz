"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const upload_config_1 = require("../config/upload.config");
class UploadService {
    // Process uploaded files and return file information
    async processUploadedFiles(files) {
        try {
            const result = {};
            if (files) {
                // Process multiple images
                if (files.images && Array.isArray(files.images)) {
                    result.images = files.images.map((file) => ({
                        filename: file.filename,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: (0, upload_config_1.getFileUrl)(file.filename, 'image'),
                        fieldName: file.fieldname
                    }));
                }
                // Process single voice file
                if (files.voice && files.voice[0]) {
                    const voiceFile = files.voice[0];
                    result.voice = {
                        filename: voiceFile.filename,
                        originalName: voiceFile.originalname,
                        mimeType: voiceFile.mimetype,
                        size: voiceFile.size,
                        url: (0, upload_config_1.getFileUrl)(voiceFile.filename, 'voice'),
                        fieldName: voiceFile.fieldname
                    };
                }
            }
            return result;
        }
        catch (error) {
            console.error('Error processing uploaded files:', error);
            throw new Error('Failed to process uploaded files');
        }
    }
    // Validate all uploaded files
    async validateFiles(files) {
        const errors = [];
        try {
            if (files) {
                // Validate images
                if (files.images && Array.isArray(files.images)) {
                    if (files.images.length > upload_config_1.FILE_LIMITS.MAX_IMAGES) {
                        errors.push(`Maximum ${upload_config_1.FILE_LIMITS.MAX_IMAGES} images allowed`);
                    }
                    files.images.forEach((file, index) => {
                        if (!(0, upload_config_1.validateFile)(file, 'image')) {
                            errors.push(`Image ${index + 1}: Invalid file type or size`);
                        }
                    });
                }
                // Validate voice file
                if (files.voice && files.voice[0]) {
                    const voiceFile = files.voice[0];
                    if (!(0, upload_config_1.validateFile)(voiceFile, 'audio')) {
                        errors.push('Voice file: Invalid file type or size');
                    }
                }
            }
            return {
                isValid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            console.error('Error validating files:', error);
            return {
                isValid: false,
                errors: ['File validation failed']
            };
        }
    }
    // Delete uploaded files (cleanup on error)
    async cleanupFiles(files) {
        try {
            if (files) {
                // Clean up images
                if (files.images && Array.isArray(files.images)) {
                    for (const file of files.images) {
                        await (0, upload_config_1.deleteFile)(file.path);
                    }
                }
                // Clean up voice file
                if (files.voice && files.voice[0]) {
                    await (0, upload_config_1.deleteFile)(files.voice[0].path);
                }
            }
        }
        catch (error) {
            console.error('Error cleaning up files:', error);
        }
    }
    // Get file information by filename
    async getFileInfo(filename, type) {
        try {
            const filePath = path_1.default.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
            if (!fs_1.default.existsSync(filePath)) {
                return null;
            }
            const stats = fs_1.default.statSync(filePath);
            const extension = path_1.default.extname(filename);
            return {
                filename,
                originalName: filename,
                mimeType: this.getMimeTypeFromExtension(extension),
                size: stats.size,
                url: (0, upload_config_1.getFileUrl)(filename, type),
                fieldName: type === 'image' ? 'images' : 'voice'
            };
        }
        catch (error) {
            console.error('Error getting file info:', error);
            return null;
        }
    }
    // Delete file by filename
    async deleteFileByName(filename, type) {
        try {
            const filePath = path_1.default.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
            await (0, upload_config_1.deleteFile)(filePath);
            return true;
        }
        catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }
    // Extract filenames from URLs for database storage
    extractFilenamesFromUrls(imageUrls, voiceUrl) {
        const imageFilenames = [];
        let voiceFilename;
        if (imageUrls && imageUrls.length > 0) {
            imageUrls.forEach(url => {
                const filename = path_1.default.basename(url);
                if (filename) {
                    imageFilenames.push(filename);
                }
            });
        }
        if (voiceUrl) {
            voiceFilename = path_1.default.basename(voiceUrl);
        }
        return { imageFilenames, voiceFilename };
    }
    // Convert filenames to URLs for API responses
    convertFilenamesToUrls(imageFilenames, voiceFilename) {
        const imageUrls = [];
        let voiceUrl;
        if (imageFilenames) {
            // Assuming comma-separated filenames
            const filenames = imageFilenames.split(',').filter(f => f.trim());
            filenames.forEach(filename => {
                imageUrls.push((0, upload_config_1.getFileUrl)(filename.trim(), 'image'));
            });
        }
        if (voiceFilename) {
            voiceUrl = (0, upload_config_1.getFileUrl)(voiceFilename, 'voice');
        }
        return { imageUrls, voiceUrl };
    }
    // Get MIME type from file extension
    getMimeTypeFromExtension(extension) {
        const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/m4a',
            '.aac': 'audio/aac'
        };
        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }
    // Check if file exists
    fileExists(filename, type) {
        const filePath = path_1.default.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
        return fs_1.default.existsSync(filePath);
    }
    // Get file path
    getFilePath(filename, type) {
        return path_1.default.join('uploads', 'complaints', type === 'image' ? 'images' : 'voice', filename);
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
