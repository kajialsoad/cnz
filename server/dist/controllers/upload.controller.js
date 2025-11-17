"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = exports.UploadController = void 0;
const upload_service_1 = require("../services/upload.service");
const upload_config_1 = require("../config/upload.config");
const path_1 = __importDefault(require("path"));
class UploadController {
    constructor() {
        // Upload files with validation
        this.uploadFiles = async (req, res) => {
            try {
                // Validate uploaded files
                const validation = await upload_service_1.uploadService.validateFiles(req.files);
                if (!validation.isValid) {
                    // Clean up any uploaded files if validation fails
                    await upload_service_1.uploadService.cleanupFiles(req.files);
                    return res.status(400).json({
                        success: false,
                        message: 'File validation failed',
                        errors: validation.errors
                    });
                }
                // Process files and get file information
                const uploadedFiles = await upload_service_1.uploadService.processUploadedFiles(req.files);
                return res.status(200).json({
                    success: true,
                    message: 'Files uploaded successfully',
                    data: uploadedFiles
                });
            }
            catch (error) {
                console.error('Error uploading files:', error);
                // Clean up any uploaded files on error
                await upload_service_1.uploadService.cleanupFiles(req.files);
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
    }
}
exports.UploadController = UploadController;
exports.uploadController = new UploadController();
