"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintController = exports.ComplaintController = void 0;
const complaint_service_1 = require("../services/complaint.service");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
class ComplaintController {
    // Create a new complaint
    async createComplaint(req, res) {
        try {
            // Debug: Log what we're receiving
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            console.log('Location object:', req.body.location);
            if (req.body.location) {
                console.log('- address:', req.body.location.address, 'length:', req.body.location.address?.length);
                console.log('- district:', req.body.location.district);
                console.log('- thana:', req.body.location.thana);
                console.log('- ward:', req.body.location.ward);
            }
            console.log('Request files:', req.files);
            // Validate request body
            const validatedData = (0, validation_1.validateInput)(validation_1.createComplaintSchema, req.body);
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const complaintInput = {
                ...validatedData,
                userId: req.user.sub,
                // Include uploaded files from multer middleware
                uploadedFiles: req.files
            };
            const complaint = await complaint_service_1.complaintService.createComplaint(complaintInput);
            res.status(201).json({
                success: true,
                message: 'Complaint created successfully',
                data: {
                    complaint
                }
            });
        }
        catch (error) {
            console.error('Error in createComplaint:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create complaint',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Get complaint by ID
    async getComplaintById(req, res) {
        try {
            const complaintId = parseInt(req.params.id);
            if (isNaN(complaintId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint ID'
                });
            }
            const userId = req.user?.sub;
            const complaint = await complaint_service_1.complaintService.getComplaintById(complaintId, userId);
            res.status(200).json({
                success: true,
                data: {
                    complaint
                }
            });
        }
        catch (error) {
            console.error('Error in getComplaintById:', error);
            const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch complaint',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Get complaints with filtering and pagination
    async getComplaints(req, res) {
        try {
            // Validate query parameters
            const validatedQuery = (0, validation_1.validateInput)(validation_1.complaintQuerySchema, req.query);
            const queryInput = {
                ...validatedQuery,
                userId: req.user?.sub // Users can only see their own complaints
            };
            const result = await complaint_service_1.complaintService.getComplaints(queryInput);
            res.status(200).json({
                success: true,
                data: {
                    complaints: result.data.map(complaint => ({
                        id: complaint.id,
                        title: complaint.title,
                        description: complaint.description,
                        priority: complaint.priority,
                        status: complaint.status,
                        imageUrls: complaint.imageUrls,
                        audioUrls: complaint.audioUrls,
                        location: complaint.location,
                        user: complaint.user,
                        createdAt: complaint.createdAt,
                        updatedAt: complaint.updatedAt,
                    })),
                    pagination: result.pagination
                }
            });
        }
        catch (error) {
            console.error('Error in getComplaints:', error);
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch complaints',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Update complaint
    async updateComplaint(req, res) {
        try {
            const complaintId = parseInt(req.params.id);
            if (isNaN(complaintId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint ID'
                });
            }
            // Validate request body
            const validatedData = (0, validation_1.validateInput)(validation_1.updateComplaintSchema, req.body);
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const updateInput = {
                ...validatedData,
                // Include uploaded files from multer middleware
                uploadedFiles: req.files,
                // Check if replaceFiles flag is set
                replaceFiles: req.body.replaceFiles === 'true' || req.body.replaceFiles === true
            };
            const userId = req.user.sub;
            const complaint = await complaint_service_1.complaintService.updateComplaint(complaintId, updateInput, userId);
            res.status(200).json({
                success: true,
                message: 'Complaint updated successfully',
                data: {
                    complaint
                }
            });
        }
        catch (error) {
            console.error('Error in updateComplaint:', error);
            const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update complaint',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Cancel/Delete complaint
    async deleteComplaint(req, res) {
        try {
            const complaintId = parseInt(req.params.id);
            if (isNaN(complaintId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint ID'
                });
            }
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            const result = await complaint_service_1.complaintService.deleteComplaint(complaintId, userId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error('Error in deleteComplaint:', error);
            const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
                error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500;
            res.status(statusCode).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to cancel complaint',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Get complaint statistics
    async getComplaintStats(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const userId = req.user.sub;
            const stats = await complaint_service_1.complaintService.getComplaintStats(userId);
            res.status(200).json({
                success: true,
                data: { stats }
            });
        }
        catch (error) {
            console.error('Error in getComplaintStats:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch complaint statistics',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Get complaints by status
    async getComplaintsByStatus(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const status = req.params.status?.toUpperCase();
            if (!Object.values(client_1.ComplaintStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint status'
                });
            }
            const userId = req.user.sub;
            const complaints = await complaint_service_1.complaintService.getComplaintsByStatus(userId, status);
            res.status(200).json({
                success: true,
                data: { complaints }
            });
        }
        catch (error) {
            console.error('Error in getComplaintsByStatus:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch complaints by status',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Search complaints
    async searchComplaints(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            const searchTerm = req.query.q;
            if (!searchTerm || searchTerm.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term must be at least 2 characters long'
                });
            }
            const userId = req.user.sub;
            const complaints = await complaint_service_1.complaintService.searchComplaints(searchTerm, userId);
            res.status(200).json({
                success: true,
                data: { complaints }
            });
        }
        catch (error) {
            console.error('Error in searchComplaints:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to search complaints',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
    // Get complaint by ID (simplified for now)
    async getComplaintByIdForTracking(req, res) {
        try {
            const complaintId = parseInt(req.params.trackingNumber);
            if (isNaN(complaintId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid complaint ID'
                });
            }
            const userId = req.user?.sub;
            // For now, search by complaint ID
            const complaint = await complaint_service_1.complaintService.getComplaintById(complaintId, userId);
            res.status(200).json({
                success: true,
                data: { complaint }
            });
        }
        catch (error) {
            console.error('Error in getComplaintByTrackingNumber:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch complaint',
                error: process.env.NODE_ENV === 'development' ? error : undefined
            });
        }
    }
}
exports.ComplaintController = ComplaintController;
exports.complaintController = new ComplaintController();
