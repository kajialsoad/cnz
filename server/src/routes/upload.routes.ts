import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// File upload routes - require authentication for upload/delete but not for serving
/**
 * @route   POST /api/uploads
 * @desc    Upload files for general use
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/', authGuard, uploadController.uploadComplaintFiles, uploadController.uploadFiles.bind(uploadController));

/**
 * @route   DELETE /api/uploads/:type/:filename
 * @desc    Delete uploaded file
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to delete
 */
router.delete('/:type/:filename', authGuard, uploadController.deleteFile.bind(uploadController));

/**
 * @route   GET /api/uploads/:type/:filename/info
 * @desc    Get file information
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to get info for
 */
router.get('/:type/:filename/info', authGuard, uploadController.getFileInfo.bind(uploadController));

/**
 * @route   GET /api/uploads/:type/:filename
 * @desc    Serve uploaded files (images, voice recordings)
 * @access  Public (no authentication required for file serving)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to serve
 */
router.get('/:type/:filename', uploadController.serveFile.bind(uploadController));

/**
 * @route   POST /api/uploads/avatar
 * @desc    Upload avatar image for admin profile
 * @access  Private (Authenticated users)
 * @body    form-data with file: { avatar }
 */
router.post('/avatar', authGuard, uploadController.uploadSingleImage, uploadController.uploadAvatar.bind(uploadController));

export default router;