"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminComplaints = getAdminComplaints;
exports.getAdminComplaintById = getAdminComplaintById;
exports.updateComplaintStatus = updateComplaintStatus;
exports.getComplaintsByUser = getComplaintsByUser;
const admin_complaint_service_1 = require("../services/admin-complaint.service");
/**
 * Get all complaints (admin view)
 */
async function getAdminComplaints(req, res) {
    try {
        const { page, limit, status, category, ward, search, startDate, endDate, sortBy, sortOrder } = req.query;
        const result = await admin_complaint_service_1.adminComplaintService.getAdminComplaints({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status: status,
            category: category,
            ward: ward,
            search: search,
            startDate: startDate,
            endDate: endDate,
            sortBy: sortBy,
            sortOrder: sortOrder
        });
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getAdminComplaints:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch complaints'
        });
    }
}
/**
 * Get single complaint by ID (admin view)
 */
async function getAdminComplaintById(req, res) {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        const complaint = await admin_complaint_service_1.adminComplaintService.getAdminComplaintById(complaintId);
        res.status(200).json({
            success: true,
            data: { complaint }
        });
    }
    catch (error) {
        console.error('Error in getAdminComplaintById:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch complaint'
        });
    }
}
/**
 * Update complaint status
 */
async function updateComplaintStatus(req, res) {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        const { status, note } = req.body;
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const complaint = await admin_complaint_service_1.adminComplaintService.updateComplaintStatus(complaintId, {
            status: status,
            note,
            adminId: req.user.sub
        });
        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully',
            data: { complaint }
        });
    }
    catch (error) {
        console.error('Error in updateComplaintStatus:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update complaint status'
        });
    }
}
/**
 * Get complaints by user
 */
async function getComplaintsByUser(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const { page, limit } = req.query;
        const result = await admin_complaint_service_1.adminComplaintService.getComplaintsByUser(userId, page ? parseInt(page) : undefined, limit ? parseInt(limit) : undefined);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in getComplaintsByUser:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch user complaints'
        });
    }
}
