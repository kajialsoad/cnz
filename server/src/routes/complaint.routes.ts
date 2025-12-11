import { Router } from 'express';
import { complaintController } from '../controllers/complaint.controller';
import { uploadController } from '../controllers/upload.controller';
import { authGuard } from '../middlewares/auth.middleware';
import { messageRateLimit, apiRateLimit } from '../middlewares/rate-limit.middleware';

const router = Router();

// All complaint routes require authentication
router.use(authGuard);

// Complaint CRUD operations
/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint with optional file uploads
 * @access  Private (Authenticated users)
 * @body    { title, description, category, priority?, location } + files: { images?, voice? }
 */
router.post('/', uploadController.uploadComplaintFiles, complaintController.createComplaint.bind(complaintController));

/**
 * @route   GET /api/complaints
 * @desc    Get user's complaints with filtering and pagination
 * @access  Private (Authenticated users)
 * @query   { page?, limit?, status?, category?, priority?, sortBy?, sortOrder? }
 */
router.get('/', complaintController.getComplaints.bind(complaintController));

/**
 * @route   GET /api/complaints/stats
 * @desc    Get user's complaint statistics
 * @access  Private (Authenticated users)
 */
router.get('/stats', complaintController.getComplaintStats.bind(complaintController));

/**
 * @route   GET /api/complaints/search
 * @desc    Search user's complaints
 * @access  Private (Authenticated users)
 * @query   { q: search_term }
 */
router.get('/search', complaintController.searchComplaints.bind(complaintController));

/**
 * @route   GET /api/complaints/status/:status
 * @desc    Get user's complaints by status
 * @access  Private (Authenticated users)
 * @param   status - PENDING, IN_PROGRESS, RESOLVED, CANCELLED
 */
router.get('/status/:status', complaintController.getComplaintsByStatus.bind(complaintController));

/**
 * @route   GET /api/complaints/track/:trackingNumber
 * @desc    Get complaint by ID (simplified tracking)
 * @access  Private (Authenticated users)
 * @param   trackingNumber - Complaint ID for now
 */
router.get('/track/:trackingNumber', complaintController.getComplaintByIdForTracking.bind(complaintController));

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private (Authenticated users)
 * @param   id - Complaint ID
 */
router.get('/:id', complaintController.getComplaintById.bind(complaintController));

/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint with optional file uploads
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 * @body    { title?, description?, category?, priority?, status?, location?, replaceFiles? } + files: { images?, voice? }
 */
router.put('/:id', uploadController.uploadComplaintFiles, complaintController.updateComplaint.bind(complaintController));

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Cancel complaint (sets status to CANCELLED)
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 */
router.delete('/:id', complaintController.deleteComplaint.bind(complaintController));

/**
 * @route   POST /api/complaints/:id/images
 * @desc    Add images to existing complaint with ward limit check
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 * @body    form-data with files: { images }
 */
router.post('/:id/images', uploadController.uploadComplaintFiles, complaintController.addImagesToComplaint.bind(complaintController));

// File upload and management routes
/**
 * @route   POST /api/complaints/upload
 * @desc    Upload files for later use in complaints
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/upload', uploadController.uploadComplaintFiles, uploadController.uploadFiles.bind(uploadController));

/**
 * @route   POST /api/complaints/:id/upload
 * @desc    Upload files for a specific complaint (for chat)
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/:id/upload', uploadController.uploadComplaintFiles, uploadController.uploadFiles.bind(uploadController));

/**
 * @route   DELETE /api/complaints/files/:type/:filename
 * @desc    Delete uploaded file
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to delete
 */
router.delete('/files/:type/:filename', uploadController.deleteFile.bind(uploadController));

/**
 * @route   GET /api/complaints/files/:type/:filename/info
 * @desc    Get file information
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to get info for
 */
router.get('/files/:type/:filename/info', uploadController.getFileInfo.bind(uploadController));

/**
 * @route   GET /api/complaints/files/:type/:filename
 * @desc    Serve uploaded files (images, voice recordings)
 * @access  Public (no authentication required for file serving)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to serve
 */
router.get('/files/:type/:filename', uploadController.serveFile.bind(uploadController));

// Chat routes for users
/**
 * @route   GET /api/complaints/:id/chat
 * @desc    Get chat messages for a complaint
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 * @query   { page?, limit? }
 */
router.get('/:id/chat', complaintController.getChatMessages.bind(complaintController));

/**
 * @route   POST /api/complaints/:id/chat
 * @desc    Send a chat message for a complaint (with optional image upload)
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 * @body    { message, imageUrl? } + optional file: image
 */
router.post('/:id/chat', uploadController.uploadComplaintFiles, messageRateLimit, complaintController.sendChatMessage.bind(complaintController));

/**
 * @route   PATCH /api/complaints/:id/chat/read
 * @desc    Mark chat messages as read for a complaint
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 */
router.patch('/:id/chat/read', complaintController.markMessagesAsRead.bind(complaintController));

export default router;