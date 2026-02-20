"use strict";
/**
 * File Access Middleware
 *
 * This middleware provides authorization checks before allowing access to file URLs.
 * It ensures users can only access files they have permission to view.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkComplaintFileAccess = checkComplaintFileAccess;
exports.checkChatFileAccess = checkChatFileAccess;
exports.validateCloudinaryUrls = validateCloudinaryUrls;
exports.ensureHttpsUrls = ensureHttpsUrls;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Check if user has access to a complaint's files
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
async function checkComplaintFileAccess(req, res, next) {
    try {
        const complaintId = parseInt(req.params.id || req.params.complaintId);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to access complaint files'
            });
        }
        // Admins and super admins can access all files
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
            return next();
        }
        // Regular users can only access their own complaint files
        const complaint = await prisma_1.default.complaint.findUnique({
            where: { id: complaintId },
            select: { userId: true }
        });
        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }
        if (complaint.userId !== req.user.sub) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access these files'
            });
        }
        next();
    }
    catch (error) {
        console.error('Error in checkComplaintFileAccess:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify file access permissions'
        });
    }
}
/**
 * Check if user has access to a chat message's files
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
async function checkChatFileAccess(req, res, next) {
    try {
        const messageId = parseInt(req.params.messageId);
        if (isNaN(messageId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message ID'
            });
        }
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required to access chat files'
            });
        }
        // Admins and super admins can access all files
        if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
            return next();
        }
        // Regular users can only access files from their own complaints
        const message = await prisma_1.default.complaintChatMessage.findUnique({
            where: { id: messageId },
            include: {
                complaint: {
                    select: { userId: true }
                }
            }
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        if (message.complaint.userId !== req.user.sub) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access these files'
            });
        }
        next();
    }
    catch (error) {
        console.error('Error in checkChatFileAccess:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify file access permissions'
        });
    }
}
/**
 * Validate that URLs in request are HTTPS Cloudinary URLs
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
function validateCloudinaryUrls(req, res, next) {
    try {
        const { imageUrls, audioUrls, imageUrl, voiceUrl } = req.body;
        // Check imageUrls array
        if (imageUrls && Array.isArray(imageUrls)) {
            for (const url of imageUrls) {
                if (!isSecureCloudinaryUrl(url)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid or insecure image URL detected'
                    });
                }
            }
        }
        // Check audioUrls array
        if (audioUrls && Array.isArray(audioUrls)) {
            for (const url of audioUrls) {
                if (!isSecureCloudinaryUrl(url)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid or insecure audio URL detected'
                    });
                }
            }
        }
        // Check single imageUrl
        if (imageUrl && !isSecureCloudinaryUrl(imageUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or insecure image URL'
            });
        }
        // Check single voiceUrl
        if (voiceUrl && !isSecureCloudinaryUrl(voiceUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or insecure voice URL'
            });
        }
        next();
    }
    catch (error) {
        console.error('Error in validateCloudinaryUrls:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate URLs'
        });
    }
}
/**
 * Check if a URL is a secure Cloudinary URL (HTTPS)
 *
 * @param url - URL to check
 * @returns True if URL is a secure Cloudinary URL
 */
function isSecureCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    try {
        const parsedUrl = new URL(url);
        // Must use HTTPS
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }
        // Must be a Cloudinary domain
        if (!parsedUrl.hostname.includes('cloudinary.com')) {
            return false;
        }
        return true;
    }
    catch (error) {
        return false;
    }
}
/**
 * Ensure all returned URLs are HTTPS
 * This middleware transforms any HTTP URLs to HTTPS in the response
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Next middleware function
 */
function ensureHttpsUrls(req, res, next) {
    // Store original json method
    const originalJson = res.json.bind(res);
    // Override json method to transform URLs
    res.json = function (body) {
        if (body && typeof body === 'object') {
            transformUrlsToHttps(body);
        }
        return originalJson(body);
    };
    next();
}
/**
 * Recursively transform all HTTP URLs to HTTPS in an object
 *
 * @param obj - Object to transform
 */
function transformUrlsToHttps(obj) {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string' && value.startsWith('http://')) {
                // Transform HTTP to HTTPS
                obj[key] = value.replace('http://', 'https://');
            }
            else if (Array.isArray(value)) {
                // Process array items
                value.forEach((item, index) => {
                    if (typeof item === 'string' && item.startsWith('http://')) {
                        value[index] = item.replace('http://', 'https://');
                    }
                    else if (typeof item === 'object') {
                        transformUrlsToHttps(item);
                    }
                });
            }
            else if (typeof value === 'object') {
                // Recursively process nested objects
                transformUrlsToHttps(value);
            }
        }
    }
}
