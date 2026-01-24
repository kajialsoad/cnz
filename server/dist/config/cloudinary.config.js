"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudinaryConfig = getCloudinaryConfig;
exports.initializeCloudinary = initializeCloudinary;
exports.isCloudinaryEnabled = isCloudinaryEnabled;
exports.getCloudinaryFolder = getCloudinaryFolder;
const cloudinary_1 = require("cloudinary");
/**
 * Validate that all required Cloudinary environment variables are present
 */
function validateCloudinaryConfig() {
    const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}\n` +
            'Please add them to your .env file.');
    }
}
/**
 * Get Cloudinary configuration from environment variables
 */
function getCloudinaryConfig() {
    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true, // Always use HTTPS
    };
}
/**
 * Initialize Cloudinary with configuration from environment variables
 */
function initializeCloudinary() {
    try {
        // Validate configuration
        validateCloudinaryConfig();
        // Get configuration
        const config = getCloudinaryConfig();
        // Configure Cloudinary
        cloudinary_1.v2.config({
            cloud_name: config.cloud_name,
            api_key: config.api_key,
            api_secret: config.api_secret,
            secure: config.secure,
        });
        console.log('✅ Cloudinary initialized successfully');
        console.log(`   Cloud Name: ${config.cloud_name}`);
        return cloudinary_1.v2;
    }
    catch (error) {
        console.error('❌ Failed to initialize Cloudinary:', error);
        throw error;
    }
}
/**
 * Check if Cloudinary is enabled
 */
function isCloudinaryEnabled() {
    const enabled = process.env.CLOUDINARY_ENABLED !== 'false';
    if (!enabled) {
        console.log('⚠️  Cloudinary is disabled via CLOUDINARY_ENABLED environment variable');
    }
    return enabled;
}
/**
 * Get the base folder for Cloudinary uploads
 */
function getCloudinaryFolder() {
    return process.env.CLOUDINARY_FOLDER || 'clean-care';
}
// Initialize Cloudinary on module load
let cloudinaryInstance = null;
try {
    if (isCloudinaryEnabled()) {
        cloudinaryInstance = initializeCloudinary();
    }
}
catch (error) {
    console.error('Failed to initialize Cloudinary on startup:', error);
}
// Export the configured Cloudinary instance
exports.default = cloudinaryInstance;
