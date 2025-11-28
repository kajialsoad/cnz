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
exports.cloudUploadService = exports.CloudUploadError = void 0;
const cloudinary_config_1 = __importStar(require("../config/cloudinary.config"));
const stream_1 = require("stream");
const file_security_1 = require("../utils/file-security");
const upload_monitoring_service_1 = require("./upload-monitoring.service");
/**
 * Custom error class for cloud upload errors
 */
class CloudUploadError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'CloudUploadError';
    }
}
exports.CloudUploadError = CloudUploadError;
/**
 * Cloud Upload Service Class
 */
class CloudUploadService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // Base delay in milliseconds
    }
    /**
     * Check if Cloudinary is available
     */
    ensureCloudinaryAvailable() {
        if (!(0, cloudinary_config_1.isCloudinaryEnabled)()) {
            throw new CloudUploadError('Cloudinary is disabled', 'CLOUDINARY_DISABLED');
        }
        if (!cloudinary_config_1.default) {
            throw new CloudUploadError('Cloudinary is not initialized', 'CLOUDINARY_NOT_INITIALIZED');
        }
    }
    /**
     * Convert Express.Multer.File buffer to a readable stream
     */
    bufferToStream(buffer) {
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        return readable;
    }
    /**
     * Generate folder path with date structure
     * Format: clean-care/{type}/{YYYY-MM-DD}/
     */
    generateFolderPath(type) {
        const baseFolder = (0, cloudinary_config_1.getCloudinaryFolder)();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateFolder = `${year}-${month}-${day}`;
        return `${baseFolder}/${type}/${dateFolder}`;
    }
    /**
     * Upload file to Cloudinary with retry logic
     */
    async uploadWithRetry(stream, options, attempt = 1) {
        try {
            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_config_1.default.uploader.upload_stream(options, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else if (result) {
                        resolve(result);
                    }
                    else {
                        reject(new Error('Upload failed with no error or result'));
                    }
                });
                stream.pipe(uploadStream);
            });
        }
        catch (error) {
            // Check if we should retry
            const isNetworkError = this.isNetworkError(error);
            const shouldRetry = isNetworkError && attempt < this.maxRetries;
            if (shouldRetry) {
                // Calculate exponential backoff delay
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`⚠️  Upload attempt ${attempt} failed. Retrying in ${delay}ms...`, error.message);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                // Retry the upload
                return this.uploadWithRetry(stream, options, attempt + 1);
            }
            // No more retries or non-network error
            throw error;
        }
    }
    /**
     * Check if error is a network error that should be retried
     */
    isNetworkError(error) {
        if (!error)
            return false;
        const networkErrorCodes = [
            'ECONNRESET',
            'ENOTFOUND',
            'ESOCKETTIMEDOUT',
            'ETIMEDOUT',
            'ECONNREFUSED',
            'EHOSTUNREACH',
            'EPIPE',
            'EAI_AGAIN'
        ];
        const networkErrorMessages = [
            'network',
            'timeout',
            'socket',
            'connection',
            'ECONNRESET'
        ];
        // Check error code
        if (error.code && networkErrorCodes.includes(error.code)) {
            return true;
        }
        // Check error message
        if (error.message) {
            const message = error.message.toLowerCase();
            return networkErrorMessages.some(keyword => message.includes(keyword));
        }
        // Check HTTP status code (5xx errors are retriable)
        if (error.http_code && error.http_code >= 500) {
            return true;
        }
        return false;
    }
    /**
     * Upload an image file to Cloudinary
     */
    async uploadImage(file, folder) {
        try {
            this.ensureCloudinaryAvailable();
            // Validate file using security utilities
            const validation = (0, file_security_1.validateImageFile)(file);
            if (!validation.valid) {
                throw new CloudUploadError(validation.error || 'Invalid image file', 'INVALID_FILE');
            }
            // Sanitize filename for logging purposes
            const sanitizedFilename = (0, file_security_1.sanitizeFilename)(file.originalname);
            // Generate folder path with date
            const folderPath = this.generateFolderPath(folder);
            // Prepare upload options
            const options = {
                folder: folderPath,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            };
            // Convert buffer to stream
            const stream = this.bufferToStream(file.buffer);
            // Upload with retry logic
            const startTime = Date.now();
            const result = await this.uploadWithRetry(stream, options);
            const duration = Date.now() - startTime;
            // Log successful upload (use sanitized filename)
            console.log(`✅ Image uploaded successfully: ${sanitizedFilename}`, `(${(file.size / 1024).toFixed(2)} KB, ${duration}ms)`);
            // Log to monitoring service
            upload_monitoring_service_1.uploadMonitoringService.logSuccess('image', sanitizedFilename, file.size, duration, result.secure_url, result.public_id);
            return {
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
                width: result.width,
                height: result.height
            };
        }
        catch (error) {
            // Log error (use sanitized filename if available)
            const filename = file?.originalname ? (0, file_security_1.sanitizeFilename)(file.originalname) : 'unknown';
            console.error(`❌ Failed to upload image: ${filename}`, error.message);
            // Log to monitoring service
            upload_monitoring_service_1.uploadMonitoringService.logFailure('image', filename, file?.size || 0, error.message || 'Unknown error');
            // Throw custom error
            if (error instanceof CloudUploadError) {
                throw error;
            }
            throw new CloudUploadError(`Failed to upload image: ${error.message}`, 'UPLOAD_FAILED', error);
        }
    }
    /**
     * Upload an audio file to Cloudinary
     */
    async uploadAudio(file, folder) {
        try {
            this.ensureCloudinaryAvailable();
            // Validate file using security utilities
            const validation = (0, file_security_1.validateAudioFile)(file);
            if (!validation.valid) {
                throw new CloudUploadError(validation.error || 'Invalid audio file', 'INVALID_FILE');
            }
            // Sanitize filename for logging purposes
            const sanitizedFilename = (0, file_security_1.sanitizeFilename)(file.originalname);
            // Generate folder path with date
            const folderPath = this.generateFolderPath(folder);
            // Prepare upload options
            const options = {
                folder: folderPath,
                resource_type: 'video', // Cloudinary uses 'video' for audio files
            };
            // Convert buffer to stream
            const stream = this.bufferToStream(file.buffer);
            // Upload with retry logic
            const startTime = Date.now();
            const result = await this.uploadWithRetry(stream, options);
            const duration = Date.now() - startTime;
            // Log successful upload (use sanitized filename)
            console.log(`✅ Audio uploaded successfully: ${sanitizedFilename}`, `(${(file.size / 1024).toFixed(2)} KB, ${duration}ms)`);
            // Log to monitoring service
            upload_monitoring_service_1.uploadMonitoringService.logSuccess('audio', sanitizedFilename, file.size, duration, result.secure_url, result.public_id);
            return {
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes
            };
        }
        catch (error) {
            // Log error (use sanitized filename if available)
            const filename = file?.originalname ? (0, file_security_1.sanitizeFilename)(file.originalname) : 'unknown';
            console.error(`❌ Failed to upload audio: ${filename}`, error.message);
            // Log to monitoring service
            upload_monitoring_service_1.uploadMonitoringService.logFailure('audio', filename, file?.size || 0, error.message || 'Unknown error');
            // Throw custom error
            if (error instanceof CloudUploadError) {
                throw error;
            }
            throw new CloudUploadError(`Failed to upload audio: ${error.message}`, 'UPLOAD_FAILED', error);
        }
    }
    /**
     * Delete a file from Cloudinary
     */
    async deleteFile(publicId) {
        try {
            this.ensureCloudinaryAvailable();
            if (!publicId) {
                throw new CloudUploadError('Invalid public_id: public_id is required', 'INVALID_PUBLIC_ID');
            }
            const result = await cloudinary_config_1.default.uploader.destroy(publicId);
            if (result.result === 'ok') {
                console.log(`✅ File deleted successfully: ${publicId}`);
            }
            else {
                console.warn(`⚠️  File deletion result: ${result.result} for ${publicId}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to delete file: ${publicId}`, error.message);
            throw new CloudUploadError(`Failed to delete file: ${error.message}`, 'DELETE_FAILED', error);
        }
    }
    /**
     * Get optimized URL with transformations
     *
     * @param publicId - The Cloudinary public_id
     * @param transformation - Transformation string (e.g., 'w_200,h_200,c_fill')
     * @returns Optimized Cloudinary URL
     */
    getOptimizedUrl(publicId, transformation) {
        if (!publicId) {
            throw new CloudUploadError('Invalid public_id: public_id is required', 'INVALID_PUBLIC_ID');
        }
        try {
            this.ensureCloudinaryAvailable();
            const config = cloudinary_config_1.default.config();
            const cloudName = config.cloud_name;
            // Build the optimized URL
            const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
            const transformedUrl = `${baseUrl}/${transformation}/${publicId}`;
            return transformedUrl;
        }
        catch (error) {
            console.error(`❌ Failed to generate optimized URL: ${publicId}`, error.message);
            throw new CloudUploadError(`Failed to generate optimized URL: ${error.message}`, 'URL_GENERATION_FAILED', error);
        }
    }
    /**
     * Get thumbnail URL for an image (200x200)
     *
     * @param publicId - The Cloudinary public_id
     * @param width - Thumbnail width (default: 200)
     * @param height - Thumbnail height (default: 200)
     * @returns Thumbnail URL with automatic format and quality optimization
     */
    getThumbnailUrl(publicId, width = 200, height = 200) {
        const transformation = `w_${width},h_${height},c_fill,q_auto,f_auto`;
        return this.getOptimizedUrl(publicId, transformation);
    }
    /**
     * Get medium-sized URL for an image (800x600)
     *
     * @param publicId - The Cloudinary public_id
     * @returns Medium-sized image URL with automatic format and quality optimization
     */
    getMediumUrl(publicId) {
        const transformation = 'w_800,h_600,c_limit,q_auto,f_auto';
        return this.getOptimizedUrl(publicId, transformation);
    }
    /**
     * Transform a full Cloudinary URL to include optimizations
     *
     * @param url - Full Cloudinary URL
     * @param transformation - Transformation string (e.g., 'w_200,h_200,c_fill')
     * @returns Transformed URL
     */
    transformUrl(url, transformation) {
        if (!url || !url.includes('cloudinary.com')) {
            return url; // Return original URL if not a Cloudinary URL
        }
        // Insert transformation into the URL
        // Example: https://res.cloudinary.com/demo/image/upload/v123/sample.jpg
        // Becomes: https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v123/sample.jpg
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) {
            return url; // Return original if upload path not found
        }
        const beforeUpload = url.substring(0, uploadIndex + 8); // Include '/upload/'
        const afterUpload = url.substring(uploadIndex + 8);
        return `${beforeUpload}${transformation}/${afterUpload}`;
    }
    /**
     * Get thumbnail URL from a full Cloudinary URL
     *
     * @param url - Full Cloudinary URL
     * @param width - Thumbnail width (default: 200)
     * @param height - Thumbnail height (default: 200)
     * @returns Thumbnail URL
     */
    getThumbnailFromUrl(url, width = 200, height = 200) {
        const transformation = `w_${width},h_${height},c_fill,q_auto,f_auto`;
        return this.transformUrl(url, transformation);
    }
    /**
     * Get medium-sized URL from a full Cloudinary URL
     *
     * @param url - Full Cloudinary URL
     * @returns Medium-sized image URL
     */
    getMediumFromUrl(url) {
        const transformation = 'w_800,h_600,c_limit,q_auto,f_auto';
        return this.transformUrl(url, transformation);
    }
    /**
     * Get optimized URL from a full Cloudinary URL with automatic format and quality
     *
     * @param url - Full Cloudinary URL
     * @returns Optimized URL with WebP format and automatic quality
     */
    getOptimizedFromUrl(url) {
        const transformation = 'q_auto,f_auto';
        return this.transformUrl(url, transformation);
    }
}
// Export singleton instance
exports.cloudUploadService = new CloudUploadService();
exports.default = exports.cloudUploadService;
