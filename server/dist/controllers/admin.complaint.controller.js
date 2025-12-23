"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminComplaints = getAdminComplaints;
exports.getAdminComplaintById = getAdminComplaintById;
exports.updateComplaintStatus = updateComplaintStatus;
exports.getComplaintsByUser = getComplaintsByUser;
exports.getComplaintStatsByZone = getComplaintStatsByZone;
exports.getComplaintStatsByWard = getComplaintStatsByWard;
const admin_complaint_service_1 = require("../services/admin-complaint.service");
const multi_zone_service_1 = require("../services/multi-zone.service");
/**
 * Get all complaints (admin view)
 */
async function getAdminComplaints(req, res) {
    try {
        const { page, limit, status, category, ward, zoneId, wardId, cityCorporationCode, thanaId, search, startDate, endDate, sortBy, sortOrder } = req.query;
        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        const result = await admin_complaint_service_1.adminComplaintService.getAdminComplaints({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            status: status,
            category: category,
            ward: ward,
            zoneId: zoneId ? parseInt(zoneId) : undefined,
            wardId: wardId ? parseInt(wardId) : undefined,
            cityCorporationCode: cityCorporationCode,
            thanaId: thanaId ? parseInt(thanaId) : undefined,
            search: search,
            startDate: startDate,
            endDate: endDate,
            sortBy: sortBy,
            sortOrder: sortOrder
        }, assignedZoneIds);
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
        const { status, note, category, subcategory } = req.body;
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
            adminId: req.user.sub,
            category,
            subcategory
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
/**
 * Get complaint statistics grouped by zone
 */
async function getComplaintStatsByZone(req, res) {
    try {
        const { cityCorporationCode } = req.query;
        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        const stats = await admin_complaint_service_1.adminComplaintService.getComplaintStatsByZone(cityCorporationCode, assignedZoneIds);
        res.status(200).json({
            success: true,
            data: { stats }
        });
    }
    catch (error) {
        console.error('Error in getComplaintStatsByZone:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch zone statistics'
        });
    }
}
/**
 * Get complaint statistics grouped by ward
 */
async function getComplaintStatsByWard(req, res) {
    try {
        const { zoneId, cityCorporationCode } = req.query;
        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        const stats = await admin_complaint_service_1.adminComplaintService.getComplaintStatsByWard(zoneId ? parseInt(zoneId) : undefined, cityCorporationCode, assignedZoneIds);
        res.status(200).json({
            success: true,
            data: { stats }
        });
    }
    catch (error) {
        console.error('Error in getComplaintStatsByWard:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch ward statistics'
        });
    }
}
