"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminComplaints = getAdminComplaints;
exports.getAdminComplaintById = getAdminComplaintById;
exports.updateComplaintStatus = updateComplaintStatus;
exports.getComplaintsByUser = getComplaintsByUser;
exports.getComplaintStatsByZone = getComplaintStatsByZone;
exports.getComplaintStatsByWard = getComplaintStatsByWard;
exports.markComplaintAsOthers = markComplaintAsOthers;
exports.getOthersAnalytics = getOthersAnalytics;
const admin_complaint_service_1 = require("../services/admin-complaint.service");
const multi_zone_service_1 = require("../services/multi-zone.service");
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get all complaints (admin view)
 */
async function getAdminComplaints(req, res) {
    try {
        const { page, limit, status, category, ward, zoneId, wardId, cityCorporationCode, thanaId, search, startDate, endDate, sortBy, sortOrder, othersCategory, othersSubcategory, 
        // New: Complaint location filters
        complaintCityCorporationCode, complaintZoneId, complaintWardId } = req.query;
        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(req.user.sub);
        }
        // Prepare admin user info for filtering
        let adminUser;
        if (req.user) {
            // Fetch full user data to get permissions
            const fullUser = await prisma_1.default.user.findUnique({
                where: { id: req.user.sub },
                select: {
                    role: true,
                    cityCorporationCode: true,
                    permissions: true
                }
            });
            if (fullUser) {
                adminUser = {
                    role: fullUser.role,
                    cityCorporationCode: fullUser.cityCorporationCode || undefined,
                    permissions: fullUser.permissions || undefined
                };
            }
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
            sortOrder: sortOrder,
            othersCategory: othersCategory,
            othersSubcategory: othersSubcategory,
            // New: Complaint location filters
            complaintCityCorporationCode: complaintCityCorporationCode,
            complaintZoneId: complaintZoneId ? parseInt(complaintZoneId) : undefined,
            complaintWardId: complaintWardId ? parseInt(complaintWardId) : undefined
        }, assignedZoneIds, adminUser);
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
 * 🔒 SECURITY: Super Admins can only view complaints from their assigned zones
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
        // 🔒 ZONE-BASED AUTHORIZATION CHECK
        // Super Admins can only view complaints from their assigned zones
        if (req.user?.role === 'SUPER_ADMIN') {
            // Get admin's assigned zones
            const adminZones = await prisma_1.default.userZone.findMany({
                where: { userId: req.user.id },
                select: { zoneId: true }
            });
            const assignedZoneIds = adminZones.map(z => z.zoneId);
            // Get complaint zone (with fallback)
            const complaintZoneId = complaint.complaintZoneId ?? complaint.zoneId;
            // If complaint has no zone, deny access (safe default)
            if (!complaintZoneId) {
                console.log(`[Authorization] ❌ SUPER_ADMIN ${req.user.email} denied access to complaint ${complaintId} - no zone assigned`);
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: You do not have access to this complaint'
                });
            }
            // Check if complaint zone is in admin's assigned zones
            if (!assignedZoneIds.includes(complaintZoneId)) {
                console.log(`[Authorization] ❌ SUPER_ADMIN ${req.user.email} denied access to complaint ${complaintId} - zone ${complaintZoneId} not in assigned zones [${assignedZoneIds.join(', ')}]`);
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: This complaint is not in your assigned zones'
                });
            }
            console.log(`[Authorization] ✅ SUPER_ADMIN ${req.user.email} granted access to complaint ${complaintId} - zone ${complaintZoneId} in assigned zones`);
        }
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
 * Supports multipart/form-data for resolution images
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
        const { status, note, category, subcategory, resolutionNote, resolutionImages } = req.body;
        const files = req.files;
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
        // Validate resolution documentation for RESOLVED status
        if (status === 'RESOLVED') {
            // Resolution note is required for RESOLVED
            if (!resolutionNote || resolutionNote.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Resolution note is required when marking complaint as RESOLVED'
                });
            }
            if (resolutionNote.length < 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Resolution note must be at least 20 characters'
                });
            }
            if (resolutionNote.length > 500) {
                return res.status(400).json({
                    success: false,
                    message: 'Resolution note must not exceed 500 characters'
                });
            }
            // Removed strict file check here to allow existing images validation in service
            // The service will check if there are either new files OR existing images
            // Validate files if present
            if (files && files.length > 0) {
                // Validate max 5 images
                if (files.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum 5 resolution images allowed'
                    });
                }
                // Validate each image file
                for (const file of files) {
                    // Check file size (5MB max)
                    if (file.size > 5 * 1024 * 1024) {
                        return res.status(400).json({
                            success: false,
                            message: `Image ${file.originalname} exceeds 5MB size limit`
                        });
                    }
                    // Check file type
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(file.mimetype)) {
                        return res.status(400).json({
                            success: false,
                            message: `Image ${file.originalname} has invalid type. Only JPEG, PNG, and WebP are allowed`
                        });
                    }
                }
            }
        }
        // Validate resolution documentation for IN_PROGRESS status (optional)
        if (status === 'IN_PROGRESS') {
            // Resolution note is optional but if provided, validate length
            if (resolutionNote) {
                if (resolutionNote.length < 20) {
                    return res.status(400).json({
                        success: false,
                        message: 'Resolution note must be at least 20 characters'
                    });
                }
                if (resolutionNote.length > 500) {
                    return res.status(400).json({
                        success: false,
                        message: 'Resolution note must not exceed 500 characters'
                    });
                }
            }
            // Images are optional for IN_PROGRESS but if provided, validate
            if (files && files.length > 0) {
                if (files.length > 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Maximum 5 resolution images allowed'
                    });
                }
                for (const file of files) {
                    if (file.size > 5 * 1024 * 1024) {
                        return res.status(400).json({
                            success: false,
                            message: `Image ${file.originalname} exceeds 5MB size limit`
                        });
                    }
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(file.mimetype)) {
                        return res.status(400).json({
                            success: false,
                            message: `Image ${file.originalname} has invalid type. Only JPEG, PNG, and WebP are allowed`
                        });
                    }
                }
            }
        }
        const complaint = await admin_complaint_service_1.adminComplaintService.updateComplaintStatus(complaintId, {
            status: status,
            note,
            adminId: req.user.sub,
            category,
            subcategory,
            resolutionNote,
            resolutionImages, // Pass existing images string (if any)
            resolutionImageFiles: files // Pass files to service for upload
        });
        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully',
            data: {
                complaint,
                resolutionImages: complaint.resolutionImages ? complaint.resolutionImages.split(',') : [],
                resolutionNote: complaint.resolutionNote
            }
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
/**
 * Mark complaint as Others
 */
async function markComplaintAsOthers(req, res) {
    try {
        const complaintId = parseInt(req.params.id);
        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }
        const { othersCategory, othersSubcategory, adminId, note } = req.body;
        const files = req.files;
        // Validate required fields
        if (!othersCategory || !othersSubcategory) {
            return res.status(400).json({
                success: false,
                message: 'Others category and subcategory are required'
            });
        }
        // Validate category
        const validCategories = ['CORPORATION_INTERNAL', 'CORPORATION_EXTERNAL'];
        if (!validCategories.includes(othersCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Others category. Must be CORPORATION_INTERNAL or CORPORATION_EXTERNAL'
            });
        }
        // Validate subcategory based on category
        const validSubcategories = {
            CORPORATION_INTERNAL: ['Engineering', 'Electricity', 'Health', 'Property (Eviction)'],
            CORPORATION_EXTERNAL: ['WASA', 'Titas', 'DPDC', 'DESCO', 'BTCL', 'Fire Service', 'Others']
        };
        if (!validSubcategories[othersCategory].includes(othersSubcategory)) {
            return res.status(400).json({
                success: false,
                message: `Invalid subcategory for ${othersCategory}. Valid options: ${validSubcategories[othersCategory].join(', ')}`
            });
        }
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        // Validate files if present (Admin Report Images)
        if (files && files.length > 0) {
            if (files.length > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 5 admin report images allowed'
                });
            }
            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    return res.status(400).json({
                        success: false,
                        message: `Image ${file.originalname} exceeds 5MB size limit`
                    });
                }
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedTypes.includes(file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: `Image ${file.originalname} has invalid type. Only JPEG, PNG, and WebP are allowed`
                    });
                }
            }
        }
        const complaint = await admin_complaint_service_1.adminComplaintService.markComplaintAsOthers(complaintId, {
            othersCategory,
            othersSubcategory,
            note, // Pass the note
            adminId: adminId || req.user.sub,
            adminReportImages: files // Pass the files
        });
        res.status(200).json({
            success: true,
            message: 'Complaint marked as Others successfully',
            data: { complaint }
        });
    }
    catch (error) {
        console.error('Error in markComplaintAsOthers:', error);
        const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to mark complaint as Others'
        });
    }
}
/**
 * Get Others analytics
 */
async function getOthersAnalytics(req, res) {
    try {
        const { cityCorporationCode, zoneId, startDate, endDate } = req.query;
        // Parse and validate filters
        const filters = {};
        if (cityCorporationCode) {
            filters.cityCorporationCode = cityCorporationCode;
        }
        if (zoneId) {
            const parsedZoneId = parseInt(zoneId);
            if (isNaN(parsedZoneId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID'
                });
            }
            filters.zoneId = parsedZoneId;
        }
        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid start date'
                });
            }
            filters.startDate = parsedStartDate;
        }
        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid end date'
                });
            }
            filters.endDate = parsedEndDate;
        }
        const analytics = await admin_complaint_service_1.adminComplaintService.getOthersAnalytics(filters);
        res.status(200).json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        console.error('Error in getOthersAnalytics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch Others analytics'
        });
    }
}
