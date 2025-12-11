"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// File upload routes - require authentication for upload/delete but not for serving
/**
 * @route   POST /api/uploads
 * @desc    Upload files for general use
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/', auth_middleware_1.authGuard, upload_controller_1.uploadController.uploadComplaintFiles, upload_controller_1.uploadController.uploadFiles.bind(upload_controller_1.uploadController));
/**
 * @route   DELETE /api/uploads/:type/:filename
 * @desc    Delete uploaded file
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to delete
 */
router.delete('/:type/:filename', auth_middleware_1.authGuard, upload_controller_1.uploadController.deleteFile.bind(upload_controller_1.uploadController));
/**
 * @route   GET /api/uploads/:type/:filename/info
 * @desc    Get file information
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to get info for
 */
router.get('/:type/:filename/info', auth_middleware_1.authGuard, upload_controller_1.uploadController.getFileInfo.bind(upload_controller_1.uploadController));
/**
 * @route   GET /api/uploads/:type/:filename
 * @desc    Serve uploaded files (images, voice recordings)
 * @access  Public (no authentication required for file serving)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to serve
 */
router.get('/:type/:filename', upload_controller_1.uploadController.serveFile.bind(upload_controller_1.uploadController));
/**
 * @route   POST /api/uploads/avatar
 * @desc    Upload avatar image for admin profile
 * @access  Private (Authenticated users)
 * @body    form-data with file: { avatar }
 */
router.post('/avatar', auth_middleware_1.authGuard, upload_controller_1.uploadController.uploadSingleImage, upload_controller_1.uploadController.uploadAvatar.bind(upload_controller_1.uploadController));
exports.default = router;
