import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import cloudinaryInstance, { getCloudinaryFolder, isCloudinaryEnabled } from '../config/cloudinary.config';
import { Readable } from 'stream';
import {
    validateImageFile,
    validateAudioFile,
    sanitizeFilename,
    generateSecureFilename
} from '../utils/file-security';
import { uploadMonitoringService } from './upload-monitoring.service';

/**
 * Cloud Upload Service
 * 
 * This service handles file uploads to Cloudinary with retry logic,
 * error handling, and optimization features.
 */

interface UploadOptions {
    folder: string;
    resource_type: 'image' | 'video' | 'raw' | 'auto';
    transformation?: any[];
    public_id?: string;
}

interface UploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
}

interface DeleteResult {
    result: string;
}

/**
 * Custom error class for cloud upload errors
 */
export class CloudUploadError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'CloudUploadError';
    }
}

/**
 * Cloud Upload Service Class
 */
class CloudUploadService {
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // Base delay in milliseconds

    /**
     * Check if Cloudinary is available
     */
    private ensureCloudinaryAvailable(): void {
        if (!isCloudinaryEnabled()) {
            throw new CloudUploadError(
                'Cloudinary is disabled',
                'CLOUDINARY_DISABLED'
            );
        }

        if (!cloudinaryInstance) {
            throw new CloudUploadError(
                'Cloudinary is not initialized',
                'CLOUDINARY_NOT_INITIALIZED'
            );
        }
    }

    /**
     * Convert Express.Multer.File buffer to a readable stream
     */
    private bufferToStream(buffer: Buffer): Readable {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        return readable;
    }

    /**
     * Generate folder path with date structure
     * Format: clean-care/{type}/{YYYY-MM-DD}/
     */
    private generateFolderPath(type: string): string {
        const baseFolder = getCloudinaryFolder();
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
    private async uploadWithRetry(
        stream: Readable,
        options: UploadOptions,
        attempt: number = 1
    ): Promise<UploadApiResponse> {
        try {
            return await new Promise<UploadApiResponse>((resolve, reject) => {
                const uploadStream = cloudinaryInstance!.uploader.upload_stream(
                    options,
                    (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                        if (error) {
                            reject(error);
                        } else if (result) {
                            resolve(result);
                        } else {
                            reject(new Error('Upload failed with no error or result'));
                        }
                    }
                );

                stream.pipe(uploadStream);
            });
        } catch (error: any) {
            // Check if we should retry
            const isNetworkError = this.isNetworkError(error);
            const shouldRetry = isNetworkError && attempt < this.maxRetries;

            if (shouldRetry) {
                // Calculate exponential backoff delay
                const delay = this.retryDelay * Math.pow(2, attempt - 1);

                console.log(
                    `⚠️  Upload attempt ${attempt} failed. Retrying in ${delay}ms...`,
                    error.message
                );

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
    private isNetworkError(error: any): boolean {
        if (!error) return false;

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
    async uploadImage(
        file: Express.Multer.File,
        folder: string
    ): Promise<UploadResult> {
        try {
            this.ensureCloudinaryAvailable();

            // Validate file using security utilities
            const validation = validateImageFile(file);
            if (!validation.valid) {
                throw new CloudUploadError(
                    validation.error || 'Invalid image file',
                    'INVALID_FILE'
                );
            }

            // Sanitize filename for logging purposes
            const sanitizedFilename = sanitizeFilename(file.originalname);

            // Generate folder path with date
            const folderPath = this.generateFolderPath(folder);

            // Prepare upload options
            const options: UploadOptions = {
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
            console.log(
                `✅ Image uploaded successfully: ${sanitizedFilename}`,
                `(${(file.size / 1024).toFixed(2)} KB, ${duration}ms)`
            );

            // Log to monitoring service
            uploadMonitoringService.logSuccess(
                'image',
                sanitizedFilename,
                file.size,
                duration,
                result.secure_url,
                result.public_id
            );

            return {
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
                width: result.width,
                height: result.height
            };
        } catch (error: any) {
            // Log error (use sanitized filename if available)
            const filename = file?.originalname ? sanitizeFilename(file.originalname) : 'unknown';
            console.error(
                `❌ Failed to upload image: ${filename}`,
                error.message
            );

            // Log to monitoring service
            uploadMonitoringService.logFailure(
                'image',
                filename,
                file?.size || 0,
                error.message || 'Unknown error'
            );

            // Throw custom error
            if (error instanceof CloudUploadError) {
                throw error;
            }

            throw new CloudUploadError(
                `Failed to upload image: ${error.message}`,
                'UPLOAD_FAILED',
                error
            );
        }
    }

    /**
     * Upload an audio file to Cloudinary
     */
    async uploadAudio(
        file: Express.Multer.File,
        folder: string
    ): Promise<UploadResult> {
        try {
            this.ensureCloudinaryAvailable();

            // Validate file using security utilities
            const validation = validateAudioFile(file);
            if (!validation.valid) {
                throw new CloudUploadError(
                    validation.error || 'Invalid audio file',
                    'INVALID_FILE'
                );
            }

            // Sanitize filename for logging purposes
            const sanitizedFilename = sanitizeFilename(file.originalname);

            // Generate folder path with date
            const folderPath = this.generateFolderPath(folder);

            // Prepare upload options
            const options: UploadOptions = {
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
            console.log(
                `✅ Audio uploaded successfully: ${sanitizedFilename}`,
                `(${(file.size / 1024).toFixed(2)} KB, ${duration}ms)`
            );

            // Log to monitoring service
            uploadMonitoringService.logSuccess(
                'audio',
                sanitizedFilename,
                file.size,
                duration,
                result.secure_url,
                result.public_id
            );

            return {
                secure_url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes
            };
        } catch (error: any) {
            // Log error (use sanitized filename if available)
            const filename = file?.originalname ? sanitizeFilename(file.originalname) : 'unknown';
            console.error(
                `❌ Failed to upload audio: ${filename}`,
                error.message
            );

            // Log to monitoring service
            uploadMonitoringService.logFailure(
                'audio',
                filename,
                file?.size || 0,
                error.message || 'Unknown error'
            );

            // Throw custom error
            if (error instanceof CloudUploadError) {
                throw error;
            }

            throw new CloudUploadError(
                `Failed to upload audio: ${error.message}`,
                'UPLOAD_FAILED',
                error
            );
        }
    }

    /**
     * Delete a file from Cloudinary
     */
    async deleteFile(publicId: string): Promise<void> {
        try {
            this.ensureCloudinaryAvailable();

            if (!publicId) {
                throw new CloudUploadError(
                    'Invalid public_id: public_id is required',
                    'INVALID_PUBLIC_ID'
                );
            }

            const result = await cloudinaryInstance!.uploader.destroy(publicId);

            if (result.result === 'ok') {
                console.log(`✅ File deleted successfully: ${publicId}`);
            } else {
                console.warn(`⚠️  File deletion result: ${result.result} for ${publicId}`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to delete file: ${publicId}`, error.message);

            throw new CloudUploadError(
                `Failed to delete file: ${error.message}`,
                'DELETE_FAILED',
                error
            );
        }
    }

    /**
     * Get optimized URL with transformations
     * 
     * @param publicId - The Cloudinary public_id
     * @param transformation - Transformation string (e.g., 'w_200,h_200,c_fill')
     * @returns Optimized Cloudinary URL
     */
    getOptimizedUrl(publicId: string, transformation: string): string {
        if (!publicId) {
            throw new CloudUploadError(
                'Invalid public_id: public_id is required',
                'INVALID_PUBLIC_ID'
            );
        }

        try {
            this.ensureCloudinaryAvailable();

            const config = cloudinaryInstance!.config();
            const cloudName = config.cloud_name;

            // Build the optimized URL
            const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
            const transformedUrl = `${baseUrl}/${transformation}/${publicId}`;

            return transformedUrl;
        } catch (error: any) {
            console.error(`❌ Failed to generate optimized URL: ${publicId}`, error.message);

            throw new CloudUploadError(
                `Failed to generate optimized URL: ${error.message}`,
                'URL_GENERATION_FAILED',
                error
            );
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
    getThumbnailUrl(publicId: string, width: number = 200, height: number = 200): string {
        const transformation = `w_${width},h_${height},c_fill,q_auto,f_auto`;
        return this.getOptimizedUrl(publicId, transformation);
    }

    /**
     * Get medium-sized URL for an image (800x600)
     * 
     * @param publicId - The Cloudinary public_id
     * @returns Medium-sized image URL with automatic format and quality optimization
     */
    getMediumUrl(publicId: string): string {
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
    transformUrl(url: string, transformation: string): string {
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
    getThumbnailFromUrl(url: string, width: number = 200, height: number = 200): string {
        const transformation = `w_${width},h_${height},c_fill,q_auto,f_auto`;
        return this.transformUrl(url, transformation);
    }

    /**
     * Get medium-sized URL from a full Cloudinary URL
     * 
     * @param url - Full Cloudinary URL
     * @returns Medium-sized image URL
     */
    getMediumFromUrl(url: string): string {
        const transformation = 'w_800,h_600,c_limit,q_auto,f_auto';
        return this.transformUrl(url, transformation);
    }

    /**
     * Get optimized URL from a full Cloudinary URL with automatic format and quality
     * 
     * @param url - Full Cloudinary URL
     * @returns Optimized URL with WebP format and automatic quality
     */
    getOptimizedFromUrl(url: string): string {
        const transformation = 'q_auto,f_auto';
        return this.transformUrl(url, transformation);
    }
}

// Export singleton instance
export const cloudUploadService = new CloudUploadService();
export default cloudUploadService;
