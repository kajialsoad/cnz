"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = exports.UploadController = void 0;
const upload_service_1 = require("../services/upload.service");
const cloud_upload_service_1 = require("../services/cloud-upload.service");
const cloudinary_config_1 = require("../config/cloudinary.config");
const upload_config_1 = require("../config/upload.config");
const path_1 = __importDefault(require("path"));
class UploadController {
    constructor() {
        // Upload files with validation
        this.uploadFiles = async (req, res) => {
            try {
                console.log('📤 Upload files called, Cloudinary enabled:', (0, cloudinary_config_1.isCloudinaryEnabled)());
                console.log('📤 Files received:', req.files);
                // Check if Cloudinary is enabled
                if ((0, cloudinary_config_1.isCloudinaryEnabled)()) {
                    // Upload to Cloudinary
                    const files = req.files;
                    const fileUrls = [];
                    const imageUrls = [];
                    let voiceUrl = null;
                    if (files && Array.isArray(files)) {
                        // Handle files as array (from multer.any())
                        for (const file of files) {
                            if (file.fieldname === 'images' || file.fieldname === 'image') {
                                try {
                                    const result = await cloud_upload_service_1.cloudUploadService.uploadImage(file, 'complaints');
                                    fileUrls.push(result.secure_url);
                                    imageUrls.push(result.secure_url);
                                    console.log('✅ Uploaded image to Cloudinary:', result.secure_url);
                                }
                                catch (error) {
                                    console.error('❌ Cloudinary image upload failed:', error);
                                    throw error;
                                }
                            }
                            else if (file.fieldname === 'voice' || file.fieldname === 'audioFiles') {
                                try {
                                    const result = await cloud_upload_service_1.cloudUploadService.uploadAudio(file, 'complaints/voice');
                                    voiceUrl = result.secure_url;
                                    fileUrls.push(result.secure_url);
                                    console.log('✅ Uploaded voice to Cloudinary:', result.secure_url);
                                }
                                catch (error) {
                                    console.error('❌ Cloudinary voice upload failed:', error);
                                    throw error;
                                }
                            }
                        }
                    }
                    if (fileUrls.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'No files found to upload'
                        });
                    }
                    return res.status(200).json({
                        success: true,
                        message: 'Files uploaded successfully',
                        data: {
                            fileUrls: fileUrls,
                            images: imageUrls.map(url => ({ url, filename: url.split('/').pop() })),
                            ...(voiceUrl && { voice: { url: voiceUrl, filename: voiceUrl.split('/').pop() } })
                        }
                    });
                }
                else {
                    // Fallback to local storage
                    const validation = await upload_service_1.uploadService.validateFiles(req.files);
                    if (!validation.isValid) {
                        await upload_service_1.uploadService.cleanupFiles(req.files);
                        return res.status(400).json({
                            success: false,
                            message: 'File validation failed',
                            errors: validation.errors
                        });
                    }
                    const uploadedFiles = await upload_service_1.uploadService.processUploadedFiles(req.files);
                    return res.status(200).json({
                        success: true,
                        message: 'Files uploaded successfully',
                        data: uploadedFiles
                    });
                }
            }
            catch (error) {
                console.error('Error uploading files:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload files',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                });
            }
        };
        // Delete uploaded file
        this.deleteFile = async (req, res) => {
            try {
                const { filename, type } = req.params;
                if (!filename || !type) {
                    return res.status(400).json({
                        success: false,
                        message: 'Filename and type are required'
                    });
                }
                if (type !== 'image' && type !== 'voice') {
                    return res.status(400).json({
                        success: false,
                        message: 'Type must be either "image" or "voice"'
                    });
                }
                // Check if file exists
                if (!upload_service_1.uploadService.fileExists(filename, type)) {
                    return res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
                // Delete file
                const deleted = await upload_service_1.uploadService.deleteFileByName(filename, type);
                if (deleted) {
                    return res.status(200).json({
                        success: true,
                        message: 'File deleted successfully'
                    });
                }
                else {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete file'
                    });
                }
            }
            catch (error) {
                console.error('Error deleting file:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete file',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                });
            }
        };
        // Get file information
        this.getFileInfo = async (req, res) => {
            try {
                const { filename, type } = req.params;
                if (!filename || !type) {
                    return res.status(400).json({
                        success: false,
                        message: 'Filename and type are required'
                    });
                }
                if (type !== 'image' && type !== 'voice') {
                    return res.status(400).json({
                        success: false,
                        message: 'Type must be either "image" or "voice"'
                    });
                }
                const fileInfo = await upload_service_1.uploadService.getFileInfo(filename, type);
                if (!fileInfo) {
                    return res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: fileInfo
                });
            }
            catch (error) {
                console.error('Error getting file info:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get file information',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                });
            }
        };
        // Serve files (for direct file access)
        this.serveFile = async (req, res) => {
            try {
                const { filename, type } = req.params;
                if (!filename || !type) {
                    return res.status(400).json({
                        success: false,
                        message: 'Filename and type are required'
                    });
                }
                if (type !== 'image' && type !== 'voice') {
                    return res.status(400).json({
                        success: false,
                        message: 'Type must be either "image" or "voice"'
                    });
                }
                // Check if file exists
                if (!upload_service_1.uploadService.fileExists(filename, type)) {
                    return res.status(404).json({
                        success: false,
                        message: 'File not found'
                    });
                }
                // Get file path
                const filePath = upload_service_1.uploadService.getFilePath(filename, type);
                // Set appropriate content type
                const fileInfo = await upload_service_1.uploadService.getFileInfo(filename, type);
                if (fileInfo) {
                    res.setHeader('Content-Type', fileInfo.mimeType);
                }
                // Set cache headers for better performance
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
                // Send file
                return res.sendFile(path_1.default.resolve(filePath));
            }
            catch (error) {
                console.error('Error serving file:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to serve file',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                });
            }
        };
        // Upload middleware for complaint creation
        this.uploadComplaintFiles = upload_config_1.complaintFileUpload;
        // Upload middleware for single image
        this.uploadSingleImage = upload_config_1.uploadConfig.single('image');
        // Upload middleware for single voice
        this.uploadSingleVoice = upload_config_1.uploadConfig.single('voice');
        // Upload middleware for multiple images
        this.uploadMultipleImages = upload_config_1.uploadConfig.array('images', 5);
        // Upload avatar image for admin profile
        this.uploadAvatar = async (req, res) => {
            try {
                console.log('📤 Avatar upload called, Cloudinary enabled:', (0, cloudinary_config_1.isCloudinaryEnabled)());
                console.log('📤 File received:', req.file);
                console.log('📤 Request body:', req.body);
                if (!req.file) {
                    console.log('❌ No file in request');
                    return res.status(400).json({
                        success: false,
                        message: 'No avatar file provided'
                    });
                }
                // Check if Cloudinary is enabled
                if ((0, cloudinary_config_1.isCloudinaryEnabled)()) {
                    try {
                        // Upload to Cloudinary in avatars folder
                        const result = await cloud_upload_service_1.cloudUploadService.uploadImage(req.file, 'avatars');
                        console.log('✅ Avatar uploaded to Cloudinary:', result.secure_url);
                        return res.status(200).json({
                            success: true,
                            message: 'Avatar uploaded successfully',
                            data: {
                                url: result.secure_url,
                                publicId: result.public_id
                            }
                        });
                    }
                    catch (error) {
                        console.error('❌ Cloudinary avatar upload failed:', error);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to upload avatar to cloud storage',
                            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                        });
                    }
                }
                else {
                    // Fallback to local storage
                    try {
                        const validation = await upload_service_1.uploadService.validateFiles([req.file]);
                        if (!validation.isValid) {
                            await upload_service_1.uploadService.cleanupFiles([req.file]);
                            return res.status(400).json({
                                success: false,
                                message: 'Avatar validation failed',
                                errors: validation.errors
                            });
                        }
                        const uploadedFiles = await upload_service_1.uploadService.processUploadedFiles({ images: [req.file] });
                        if (!uploadedFiles.images || uploadedFiles.images.length === 0) {
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to process avatar'
                            });
                        }
                        return res.status(200).json({
                            success: true,
                            message: 'Avatar uploaded successfully',
                            data: {
                                url: uploadedFiles.images[0].url,
                                filename: uploadedFiles.images[0].filename
                            }
                        });
                    }
                    catch (error) {
                        console.error('❌ Local storage avatar upload failed:', error);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to process avatar',
                            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                        });
                    }
                }
            }
            catch (error) {
                console.error('❌ Avatar upload error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to upload avatar',
                    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
                });
            }
        };
    }
}
exports.UploadController = UploadController;
exports.uploadController = new UploadController();
