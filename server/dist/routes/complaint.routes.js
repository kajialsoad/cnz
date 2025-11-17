"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complaint_controller_1 = require("../controllers/complaint.controller");
const upload_controller_1 = require("../controllers/upload.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All complaint routes require authentication
router.use(auth_middleware_1.authGuard);
// Complaint CRUD operations
/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint with optional file uploads
 * @access  Private (Authenticated users)
 * @body    { title, description, category, priority?, location } + files: { images?, voice? }
 */
router.post('/', upload_controller_1.uploadController.uploadComplaintFiles, complaint_controller_1.complaintController.createComplaint.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints
 * @desc    Get user's complaints with filtering and pagination
 * @access  Private (Authenticated users)
 * @query   { page?, limit?, status?, category?, priority?, sortBy?, sortOrder? }
 */
router.get('/', complaint_controller_1.complaintController.getComplaints.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints/stats
 * @desc    Get user's complaint statistics
 * @access  Private (Authenticated users)
 */
router.get('/stats', complaint_controller_1.complaintController.getComplaintStats.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints/search
 * @desc    Search user's complaints
 * @access  Private (Authenticated users)
 * @query   { q: search_term }
 */
router.get('/search', complaint_controller_1.complaintController.searchComplaints.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints/status/:status
 * @desc    Get user's complaints by status
 * @access  Private (Authenticated users)
 * @param   status - PENDING, IN_PROGRESS, RESOLVED, CANCELLED
 */
router.get('/status/:status', complaint_controller_1.complaintController.getComplaintsByStatus.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints/track/:trackingNumber
 * @desc    Get complaint by ID (simplified tracking)
 * @access  Private (Authenticated users)
 * @param   trackingNumber - Complaint ID for now
 */
router.get('/track/:trackingNumber', complaint_controller_1.complaintController.getComplaintByIdForTracking.bind(complaint_controller_1.complaintController));
/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID
 * @access  Private (Authenticated users)
 * @param   id - Complaint ID
 */
router.get('/:id', complaint_controller_1.complaintController.getComplaintById.bind(complaint_controller_1.complaintController));
/**
 * @route   PUT /api/complaints/:id
 * @desc    Update complaint with optional file uploads
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 * @body    { title?, description?, category?, priority?, status?, location?, replaceFiles? } + files: { images?, voice? }
 */
router.put('/:id', upload_controller_1.uploadController.uploadComplaintFiles, complaint_controller_1.complaintController.updateComplaint.bind(complaint_controller_1.complaintController));
/**
 * @route   DELETE /api/complaints/:id
 * @desc    Cancel complaint (sets status to CANCELLED)
 * @access  Private (Complaint owner only)
 * @param   id - Complaint ID
 */
router.delete('/:id', complaint_controller_1.complaintController.deleteComplaint.bind(complaint_controller_1.complaintController));
// File upload and management routes
/**
 * @route   POST /api/complaints/upload
 * @desc    Upload files for later use in complaints
 * @access  Private (Authenticated users)
 * @body    form-data with files: { images?, voice? }
 */
router.post('/upload', upload_controller_1.uploadController.uploadComplaintFiles, upload_controller_1.uploadController.uploadFiles.bind(upload_controller_1.uploadController));
/**
 * @route   DELETE /api/complaints/files/:type/:filename
 * @desc    Delete uploaded file
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to delete
 */
router.delete('/files/:type/:filename', upload_controller_1.uploadController.deleteFile.bind(upload_controller_1.uploadController));
/**
 * @route   GET /api/complaints/files/:type/:filename/info
 * @desc    Get file information
 * @access  Private (Authenticated users)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to get info for
 */
router.get('/files/:type/:filename/info', upload_controller_1.uploadController.getFileInfo.bind(upload_controller_1.uploadController));
/**
 * @route   GET /api/complaints/files/:type/:filename
 * @desc    Serve uploaded files (images, voice recordings)
 * @access  Public (no authentication required for file serving)
 * @param   type - 'image' or 'voice'
 * @param   filename - filename to serve
 */
router.get('/files/:type/:filename', upload_controller_1.uploadController.serveFile.bind(upload_controller_1.uploadController));
exports.default = router;
