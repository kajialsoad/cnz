"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminComplaintService = exports.AdminComplaintService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const notification_service_1 = __importDefault(require("./notification.service"));
class AdminComplaintService {
    /**
     * Get all complaints with admin-level access (no user restriction)
     * Supports pagination, filtering, and search
     */
    async getAdminComplaints(query = {}, assignedZoneIds) {
        try {
            const { page = 1, limit = 20, status, category, subcategory, othersCategory, othersSubcategory, ward, zoneId, // specific zone filter requested
            wardId, cityCorporationCode, thanaId, // Deprecated but kept for backward compatibility
            search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = query;
            const skip = (page - 1) * limit;
            // Build where clause - COMPLETELY REWRITTEN
            const andConditions = [];
            // Status filter
            if (status && status !== 'ALL') {
                andConditions.push({ status });
            }
            // Category filter
            if (category) {
                // Handle "null" as a special value to filter for NULL categories
                if (category === 'null') {
                    andConditions.push({
                        OR: [
                            { category: null },
                            { category: '' }
                        ]
                    });
                }
                else {
                    andConditions.push({ category });
                }
            }
            // Subcategory filter
            if (subcategory) {
                // Handle "null" as a special value to filter for NULL subcategories
                if (subcategory === 'null') {
                    andConditions.push({
                        OR: [
                            { subcategory: null },
                            { subcategory: '' }
                        ]
                    });
                }
                else {
                    andConditions.push({ subcategory });
                }
            }
            // City Corporation filter (filter through user relationship)
            if (cityCorporationCode) {
                andConditions.push({
                    user: {
                        cityCorporationCode: cityCorporationCode
                    }
                });
            }
            // Zone filter (filter through user relationship)
            // Multi-zone Logic:
            if (assignedZoneIds && assignedZoneIds.length > 0) {
                // If specific zone requested, validate against assigned zones
                if (zoneId) {
                    if (!assignedZoneIds.includes(zoneId)) {
                        // Requested zone not in assigned zones -> Return empty result
                        andConditions.push({ id: -1 });
                    }
                    else {
                        andConditions.push({ user: { zoneId: zoneId } });
                    }
                }
                else {
                    // No specific zone requested -> Filter by all assigned zones
                    andConditions.push({ user: { zoneId: { in: assignedZoneIds } } });
                }
            }
            else {
                // No assigned zones restriction (e.g. Master Admin)
                // Just use the requested zoneId if present
                if (zoneId) {
                    andConditions.push({
                        user: {
                            zoneId: zoneId
                        }
                    });
                }
            }
            // Others Category filter (for OTHERS status)
            if (othersCategory) {
                andConditions.push({
                    othersCategory: othersCategory
                });
            }
            // Others Subcategory filter
            if (othersSubcategory) {
                andConditions.push({
                    othersSubcategory: othersSubcategory
                });
            }
            // Ward filter (filter through user relationship using wardId)
            if (wardId) {
                andConditions.push({
                    user: {
                        wardId: wardId
                    }
                });
            }
            // Legacy ward filter (filter through user relationship using ward string)
            // Kept for backward compatibility
            if (ward && !wardId) {
                andConditions.push({
                    user: {
                        ward: ward
                    }
                });
            }
            // Thana filter (filter through user relationship)
            // Deprecated but kept for backward compatibility
            if (thanaId) {
                andConditions.push({
                    user: {
                        thanaId: thanaId
                    }
                });
            }
            // Date range filter
            if (startDate || endDate) {
                const dateFilter = {};
                if (startDate) {
                    dateFilter.gte = new Date(startDate);
                }
                if (endDate) {
                    dateFilter.lte = new Date(endDate);
                }
                andConditions.push({ createdAt: dateFilter });
            }
            // Search filter - searches across multiple fields
            // Note: MySQL string comparisons are case-insensitive by default
            if (search && search.trim()) {
                andConditions.push({
                    OR: [
                        { title: { contains: search } },
                        { description: { contains: search } },
                        { location: { contains: search } },
                        {
                            user: {
                                firstName: { contains: search }
                            }
                        },
                        {
                            user: {
                                lastName: { contains: search }
                            }
                        },
                        {
                            user: {
                                phone: { contains: search }
                            }
                        },
                        {
                            user: {
                                email: { contains: search }
                            }
                        }
                    ]
                });
            }
            // Build final where clause
            const where = andConditions.length > 0 ? { AND: andConditions } : {};
            // Build order by clause
            const orderBy = {};
            orderBy[sortBy] = sortOrder;
            // Fetch complaints and total count
            const [complaints, total, statusCounts] = await Promise.all([
                prisma_1.default.complaint.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                address: true,
                                cityCorporationCode: true,
                                zoneId: true,
                                wardId: true,
                                cityCorporation: {
                                    select: {
                                        code: true,
                                        name: true
                                    }
                                },
                                zone: {
                                    select: {
                                        id: true,
                                        zoneNumber: true,
                                        name: true,
                                        officerName: true,
                                        officerDesignation: true
                                    }
                                },
                                ward: {
                                    select: {
                                        id: true,
                                        wardNumber: true,
                                        inspectorName: true,
                                        inspectorSerialNumber: true
                                    }
                                }
                            }
                        },
                        reviews: {
                            select: {
                                rating: true,
                                comment: true
                            }
                        }
                    }
                }),
                prisma_1.default.complaint.count({ where }),
                this.getStatusCounts(cityCorporationCode, zoneId, wardId, assignedZoneIds)
            ]);
            // Format complaints with parsed file URLs
            const formattedComplaints = complaints.map(complaint => this.formatComplaintResponse(complaint));
            return {
                complaints: formattedComplaints,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                },
                statusCounts
            };
        }
        catch (error) {
            console.error('Error getting admin complaints:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error; // Throw original error to see actual message
        }
    }
    /**
     * Get single complaint by ID with full details (admin access)
     */
    async getAdminComplaintById(id) {
        try {
            const complaint = await prisma_1.default.complaint.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            ward: true,
                            zone: true,
                            address: true,
                            createdAt: true,
                            cityCorporationCode: true,
                            zoneId: true,
                            wardId: true,
                            cityCorporation: {
                                select: {
                                    code: true,
                                    name: true
                                }
                            }
                        }
                    },
                    // Include direct location relations
                    wards: {
                        select: {
                            id: true,
                            wardNumber: true,
                            inspectorName: true,
                            inspectorPhone: true,
                            inspectorSerialNumber: true
                        }
                    },
                    zone: {
                        select: {
                            id: true,
                            zoneNumber: true,
                            name: true,
                            officerName: true,
                            officerPhone: true,
                            officerDesignation: true
                        }
                    },
                    cityCorporation: {
                        select: {
                            code: true,
                            name: true
                        }
                    },
                    assignedAdmin: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                            email: true
                        }
                    },
                    // Include reviews for display in details view
                    reviews: {
                        select: {
                            id: true,
                            rating: true,
                            comment: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                }
            });
            if (!complaint) {
                throw new Error('Complaint not found');
            }
            // Fetch status history and chat messages separately
            const [statusHistory, chatMessages] = await Promise.all([
                prisma_1.default.statusHistory.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma_1.default.complaintChatMessage.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                })
            ]);
            // Fetch details of users who changed status
            const userIds = [...new Set(statusHistory.map(history => history.changedBy))];
            const users = await prisma_1.default.user.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    role: true,
                    firstName: true,
                    lastName: true
                }
            });
            const userMap = new Map(users.map(user => [user.id, user]));
            const enrichedStatusHistory = statusHistory.map(history => ({
                ...history,
                changer: userMap.get(history.changedBy) ? {
                    role: userMap.get(history.changedBy)?.role,
                    firstName: userMap.get(history.changedBy)?.firstName,
                    lastName: userMap.get(history.changedBy)?.lastName,
                    name: `${userMap.get(history.changedBy)?.firstName} ${userMap.get(history.changedBy)?.lastName}`
                } : undefined
            }));
            return this.formatComplaintResponse({
                ...complaint,
                statusHistory: enrichedStatusHistory,
                chatMessages
            });
        }
        catch (error) {
            console.error('Error getting complaint by ID:', error);
            throw error;
        }
    }
    /**
     * Update complaint status and create status history entry
     * Enhanced to support resolution documentation (images and notes)
     *
     * @param id - Complaint ID
     * @param input - Status update input with optional resolution documentation
     * @returns Updated complaint
     */
    async updateComplaintStatus(id, input) {
        try {
            // Get current complaint
            const currentComplaint = await prisma_1.default.complaint.findUnique({
                where: { id }
            });
            if (!currentComplaint) {
                throw new Error('Complaint not found');
            }
            // Validate resolution documentation for RESOLVED status
            if (input.status === client_1.Complaint_status.RESOLVED) {
                if (!input.resolutionNote || input.resolutionNote.trim().length === 0) {
                    throw new Error('Resolution note is required when marking complaint as RESOLVED');
                }
                if (input.resolutionNote.length < 20) {
                    throw new Error('Resolution note must be at least 20 characters');
                }
                if (input.resolutionNote.length > 500) {
                    throw new Error('Resolution note must not exceed 500 characters');
                }
            }
            // Upload resolution images to Cloudinary if files are provided
            let resolutionImageUrls = input.resolutionImages;
            if (input.resolutionImageFiles && input.resolutionImageFiles.length > 0) {
                console.log(`📤 Uploading ${input.resolutionImageFiles.length} resolution images to Cloudinary...`);
                const newResolutionImageUrls = await this.uploadResolutionImages(input.resolutionImageFiles);
                console.log(`✅ Resolution images uploaded successfully: ${newResolutionImageUrls}`);
                // Append new images to existing ones (if any)
                if (resolutionImageUrls) {
                    resolutionImageUrls = `${resolutionImageUrls},${newResolutionImageUrls}`;
                }
                else {
                    resolutionImageUrls = newResolutionImageUrls;
                }
            }
            // Validation: At least one resolution image is required for RESOLVED status
            // We check if we have new images OR existing images being preserved
            if (input.status === client_1.Complaint_status.RESOLVED) {
                // Determine final images: if resolutionImageUrls is undefined, we are keeping current images
                // If it is defined (string), that IS the new state.
                const finalImages = resolutionImageUrls !== undefined
                    ? resolutionImageUrls
                    : currentComplaint.resolutionImages;
                if (!finalImages || finalImages.trim().length === 0) {
                    throw new Error('At least one resolution image is required when marking complaint as RESOLVED');
                }
            }
            // Update complaint status and create status history in a transaction
            const result = await prisma_1.default.$transaction(async (tx) => {
                // Update complaint status
                const updatedComplaint = await tx.complaint.update({
                    where: { id },
                    data: {
                        status: input.status,
                        updatedAt: new Date(),
                        resolutionImages: resolutionImageUrls, // Add resolution images (comma-separated URLs)
                        resolutionNote: input.resolutionNote, // Add resolution note
                        // Intelligent Category Handling
                        // If status is OTHERS, we map the input category/subcategory to the others* fields
                        // This preserves the original user-submitted category in the main fields
                        othersCategory: input.status === client_1.Complaint_status.OTHERS ? input.category : undefined,
                        othersSubcategory: input.status === client_1.Complaint_status.OTHERS ? input.subcategory : undefined,
                        // Only update main category/subcategory if status is NOT OTHERS
                        // This prevents overwriting the original category when marking as others
                        category: input.status !== client_1.Complaint_status.OTHERS ? input.category : undefined,
                        subcategory: input.status !== client_1.Complaint_status.OTHERS ? input.subcategory : undefined,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                });
                // Create status history entry
                await tx.statusHistory.create({
                    data: {
                        complaintId: id,
                        oldStatus: currentComplaint.status,
                        newStatus: input.status,
                        changedBy: input.adminId,
                        note: input.note
                    }
                });
                return updatedComplaint;
            });
            // Send notification based on status using NotificationService
            if (currentComplaint.userId) {
                try {
                    if (input.status === client_1.Complaint_status.IN_PROGRESS) {
                        await notification_service_1.default.createStatusChangeNotification(id, currentComplaint.userId, 'IN_PROGRESS', {
                            adminName: `Admin #${input.adminId}`,
                            resolutionImages: resolutionImageUrls ? resolutionImageUrls.split(',').map(url => url.trim()) : undefined,
                            resolutionNote: input.resolutionNote
                        });
                    }
                    else if (input.status === client_1.Complaint_status.RESOLVED) {
                        // Parse resolution images for notification metadata
                        const resolutionImageUrlsArray = resolutionImageUrls
                            ? resolutionImageUrls.split(',').map(url => url.trim())
                            : [];
                        await notification_service_1.default.createStatusChangeNotification(id, currentComplaint.userId, 'RESOLVED', {
                            resolutionImages: resolutionImageUrlsArray,
                            resolutionNote: input.resolutionNote,
                            adminName: `Admin #${input.adminId}`
                        });
                    }
                }
                catch (notificationError) {
                    console.error('Failed to create notification:', notificationError);
                    // Don't throw error to prevent failing the main operation
                }
            }
            // Create activity log entry
            try {
                await prisma_1.default.activityLog.create({
                    data: {
                        userId: input.adminId,
                        action: 'UPDATE_STATUS',
                        entityType: 'Complaint',
                        entityId: id,
                        oldValue: JSON.stringify({
                            status: currentComplaint.status,
                            resolutionImages: currentComplaint.resolutionImages,
                            resolutionNote: currentComplaint.resolutionNote
                        }),
                        newValue: JSON.stringify({
                            status: input.status,
                            resolutionImages: resolutionImageUrls,
                            resolutionNote: input.resolutionNote
                        })
                    }
                });
            }
            catch (logError) {
                console.error('Failed to create activity log:', logError);
                // Don't throw error to prevent failing the main operation
            }
            return this.formatComplaintResponse(result);
        }
        catch (error) {
            console.error('Error updating complaint status:', error);
            throw error;
        }
    }
    /**
     * Upload resolution images to Cloudinary
     * Validates and uploads multiple images (max 5, 5MB each)
     *
     * @param files - Array of image files from multer
     * @returns Comma-separated string of Cloudinary URLs
     */
    async uploadResolutionImages(files) {
        try {
            // Validate file count
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }
            if (files.length > 5) {
                throw new Error('Maximum 5 images allowed');
            }
            // Validate each file
            for (const file of files) {
                // Check file size (5MB = 5 * 1024 * 1024 bytes)
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    throw new Error(`File ${file.originalname} exceeds 5MB limit`);
                }
                // Check file type
                const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    throw new Error(`File ${file.originalname} has invalid type. Only JPEG, PNG, and WebP are allowed`);
                }
            }
            // Import cloudUploadService dynamically to avoid circular dependency
            const { cloudUploadService } = await Promise.resolve().then(() => __importStar(require('./cloud-upload.service')));
            // Upload all files to Cloudinary
            const uploadPromises = files.map(file => cloudUploadService.uploadImage(file, 'resolutions'));
            const uploadResults = await Promise.all(uploadPromises);
            // Extract secure URLs and join with comma
            const imageUrls = uploadResults.map(result => result.secure_url).join(',');
            console.log(`✅ Successfully uploaded ${files.length} resolution images`);
            return imageUrls;
        }
        catch (error) {
            console.error('Error uploading resolution images:', error);
            throw new Error(`Failed to upload resolution images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Mark complaint as Others with category and subcategory
     * @param id - Complaint ID
     * @param input - Others marking input
     * @returns Updated complaint
     */
    async markComplaintAsOthers(id, input) {
        try {
            // Validate Others category
            const validCategories = ['CORPORATION_INTERNAL', 'CORPORATION_EXTERNAL'];
            if (!validCategories.includes(input.othersCategory)) {
                throw new Error('Invalid Others category');
            }
            // Validate subcategory based on category
            const validSubcategories = {
                CORPORATION_INTERNAL: ['Engineering', 'Electricity', 'Health', 'Property (Eviction)'],
                CORPORATION_EXTERNAL: ['WASA', 'Titas', 'DPDC', 'DESCO', 'BTCL', 'Fire Service', 'Others']
            };
            if (!validSubcategories[input.othersCategory].includes(input.othersSubcategory)) {
                throw new Error(`Invalid subcategory for ${input.othersCategory}`);
            }
            // Get current complaint
            const currentComplaint = await prisma_1.default.complaint.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });
            if (!currentComplaint) {
                throw new Error('Complaint not found');
            }
            // Upload admin report images to Cloudinary if provided
            let resolutionImageUrls;
            if (input.adminReportImages && input.adminReportImages.length > 0) {
                console.log(`📤 Uploading ${input.adminReportImages.length} admin report images to Cloudinary...`);
                resolutionImageUrls = await this.uploadResolutionImages(input.adminReportImages);
                console.log(`✅ Admin report images uploaded successfully: ${resolutionImageUrls}`);
            }
            // Update complaint and create history in transaction
            const result = await prisma_1.default.$transaction(async (tx) => {
                // Update complaint to Others status
                const updatedComplaint = await tx.complaint.update({
                    where: { id },
                    data: {
                        status: client_1.Complaint_status.OTHERS,
                        othersCategory: input.othersCategory,
                        othersSubcategory: input.othersSubcategory,
                        updatedAt: new Date(),
                        resolutionImages: resolutionImageUrls, // Save uploaded images
                        resolutionNote: input.note // Save note as resolution note
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                });
                // Create status history entry
                await tx.statusHistory.create({
                    data: {
                        complaintId: id,
                        oldStatus: currentComplaint.status,
                        newStatus: client_1.Complaint_status.OTHERS,
                        changedBy: input.adminId,
                        note: input.note || `Marked as Others: ${input.othersCategory} - ${input.othersSubcategory}`
                    }
                });
                return updatedComplaint;
            });
            // Create notification for user using NotificationService
            if (currentComplaint.userId) {
                try {
                    await notification_service_1.default.createStatusChangeNotification(id, currentComplaint.userId, 'OTHERS', {
                        othersCategory: input.othersCategory,
                        othersSubcategory: input.othersSubcategory,
                        adminName: `Admin #${input.adminId}`,
                        // resolutionImages: resolutionImageUrls ? resolutionImageUrls.split(',') : undefined, // Optional: Include images in notification metadata if needed
                        // resolutionNote: input.note
                    });
                }
                catch (notificationError) {
                    console.error('Failed to create notification:', notificationError);
                    // Don't throw error to prevent failing the main operation
                }
            }
            // Create activity log entry
            try {
                await prisma_1.default.activityLog.create({
                    data: {
                        userId: input.adminId,
                        action: 'MARK_AS_OTHERS',
                        entityType: 'Complaint',
                        entityId: id,
                        oldValue: JSON.stringify({
                            status: currentComplaint.status,
                            othersCategory: currentComplaint.othersCategory,
                            othersSubcategory: currentComplaint.othersSubcategory
                        }),
                        newValue: JSON.stringify({
                            status: client_1.Complaint_status.OTHERS,
                            othersCategory: input.othersCategory,
                            othersSubcategory: input.othersSubcategory,
                            resolutionImages: resolutionImageUrls,
                            resolutionNote: input.note
                        })
                    }
                });
            }
            catch (logError) {
                console.error('Failed to create activity log:', logError);
                // Don't throw error to prevent failing the main operation
            }
            return this.formatComplaintResponse(result);
        }
        catch (error) {
            console.error('Error marking complaint as Others:', error);
            throw error;
        }
    }
    /**
     * Create a notification for a user
     */
    async createNotification(userId, title, message) {
        try {
            await prisma_1.default.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type: 'SYSTEM',
                    isRead: false
                }
            });
        }
        catch (error) {
            console.error('Failed to create notification:', error);
            // Don't throw error to prevent failing the main request
        }
    }
    /**
     * Get all complaints for a specific user
     */
    async getComplaintsByUser(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            const [complaints, total, user] = await Promise.all([
                prisma_1.default.complaint.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma_1.default.complaint.count({ where: { userId } }),
                prisma_1.default.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        ward: true,
                        zone: true,
                        createdAt: true
                    }
                })
            ]);
            if (!user) {
                throw new Error('User not found');
            }
            // Calculate statistics
            const statistics = await this.getUserComplaintStatistics(userId);
            return {
                user,
                complaints: complaints.map(c => this.formatComplaintResponse(c)),
                statistics,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            };
        }
        catch (error) {
            console.error('Error getting complaints by user:', error);
            throw error;
        }
    }
    /**
     * Get complaint statistics for a specific user
     */
    async getUserComplaintStatistics(userId) {
        const [total, pending, inProgress, resolved, rejected] = await Promise.all([
            prisma_1.default.complaint.count({ where: { userId } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.Complaint_status.PENDING } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.Complaint_status.IN_PROGRESS } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.Complaint_status.RESOLVED } }),
            prisma_1.default.complaint.count({ where: { userId, status: client_1.Complaint_status.REJECTED } })
        ]);
        return {
            total,
            resolved,
            unresolved: pending + inProgress,
            pending,
            inProgress,
            rejected
        };
    }
    /**
     * Get status counts for all complaints
     * Optionally filtered by city corporation, zone, or ward
     * multi-zone aware
     */
    async getStatusCounts(cityCorporationCode, zoneId, wardId, assignedZoneIds) {
        // Build where clause for filters
        const userFilter = {};
        if (cityCorporationCode) {
            userFilter.cityCorporationCode = cityCorporationCode;
        }
        // Multi-zone Logic for stats
        if (assignedZoneIds && assignedZoneIds.length > 0) {
            if (zoneId) {
                if (!assignedZoneIds.includes(zoneId)) {
                    // Impossible condition for forbidden access
                    userFilter.id = -1;
                }
                else {
                    userFilter.zoneId = zoneId;
                }
            }
            else {
                userFilter.zoneId = { in: assignedZoneIds };
            }
        }
        else {
            if (zoneId) {
                userFilter.zoneId = zoneId;
            }
        }
        if (wardId) {
            userFilter.wardId = wardId;
        }
        const whereClause = Object.keys(userFilter).length > 0
            ? { user: userFilter }
            : {};
        const [pending, inProgress, resolved, rejected, others] = await Promise.all([
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.Complaint_status.PENDING
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.Complaint_status.IN_PROGRESS
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.Complaint_status.RESOLVED
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.Complaint_status.REJECTED
                }
            }),
            prisma_1.default.complaint.count({
                where: {
                    ...whereClause,
                    status: client_1.Complaint_status.OTHERS
                }
            })
        ]);
        return {
            pending,
            inProgress,
            resolved,
            rejected,
            others,
            total: pending + inProgress + resolved + rejected + others
        };
    }
    /**
     * Helper method to parse file URLs from stored string
     */
    parseFileUrls(urlString) {
        if (!urlString)
            return [];
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(urlString);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
        catch (error) {
            // Not JSON, fall back to comma-separated parsing
        }
        // Parse comma-separated format
        return urlString
            .split(',')
            .map(url => url.trim())
            .filter(url => url && !url.startsWith('voice:'));
    }
    /**
     * Helper method to format complaint response with structured data
     */
    formatComplaintResponse(complaint) {
        // Parse location string to extract ward
        const locationParts = complaint.location?.split(',') || [];
        const wardMatch = complaint.location?.match(/Ward:\s*(\d+)/i);
        const ward = wardMatch ? wardMatch[1] : null;
        // Parse district and thana from location
        const district = locationParts[1]?.trim() || null;
        const thana = locationParts[2]?.trim() || null;
        const address = locationParts[0]?.trim() || complaint.location;
        // Debug logging for resolution fields
        if (complaint.resolutionImages || complaint.resolutionNote) {
            console.log(`📸 Complaint ${complaint.id} has resolution data:`, {
                resolutionImages: complaint.resolutionImages,
                resolutionNote: complaint.resolutionNote
            });
        }
        return {
            ...complaint,
            complaintId: `C${String(complaint.id).padStart(6, '0')}`, // Format: C001234
            imageUrls: this.parseFileUrls(complaint.imageUrl),
            audioUrls: this.parseFileUrls(complaint.audioUrl),
            resolutionImages: complaint.resolutionImages || null, // Include resolution images
            resolutionNote: complaint.resolutionNote || null, // Include resolution note
            review: complaint.reviews && complaint.reviews.length > 0 ? complaint.reviews[0] : null, // Extract first review
            locationDetails: {
                address,
                district,
                thana,
                ward,
                full: complaint.location
            },
            timeAgo: this.getTimeAgo(complaint.createdAt),
            user: complaint.user ? {
                ...complaint.user,
                name: `${complaint.user.firstName} ${complaint.user.lastName}`
            } : null
        };
    }
    /**
     * Helper method to calculate time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7)
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffDays < 30)
            return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    }
    /**
     * Get complaint statistics grouped by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByZone(cityCorporationCode, assignedZoneIds) {
        try {
            // Build where clause
            const userFilter = {};
            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }
            if (assignedZoneIds && assignedZoneIds.length > 0) {
                userFilter.zoneId = { in: assignedZoneIds };
            }
            const whereClause = Object.keys(userFilter).length > 0
                ? { user: userFilter }
                : {};
            // Get all complaints with user zone information
            const complaints = await prisma_1.default.complaint.findMany({
                where: whereClause,
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            zoneId: true,
                            zone: {
                                select: {
                                    id: true,
                                    zoneNumber: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            // Group by zone
            const zoneStats = new Map();
            complaints.forEach(complaint => {
                const zoneId = complaint.user?.zoneId;
                const zone = complaint.user?.zone;
                if (!zoneId || !zone)
                    return;
                if (!zoneStats.has(zoneId)) {
                    zoneStats.set(zoneId, {
                        zoneId,
                        zoneNumber: zone.zoneNumber,
                        zoneName: zone.name,
                        total: 0,
                        pending: 0,
                        inProgress: 0,
                        resolved: 0,
                        rejected: 0
                    });
                }
                const stats = zoneStats.get(zoneId);
                stats.total++;
                switch (complaint.status) {
                    case client_1.Complaint_status.PENDING:
                        stats.pending++;
                        break;
                    case client_1.Complaint_status.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case client_1.Complaint_status.RESOLVED:
                        stats.resolved++;
                        break;
                    case client_1.Complaint_status.REJECTED:
                        stats.rejected++;
                        break;
                }
            });
            // Convert map to array and sort by zone number
            return Array.from(zoneStats.values()).sort((a, b) => a.zoneNumber - b.zoneNumber);
        }
        catch (error) {
            console.error('Error getting complaint stats by zone:', error);
            throw error;
        }
    }
    /**
     * Get complaint statistics grouped by ward
     * @param zoneId Optional filter by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByWard(zoneId, cityCorporationCode, assignedZoneIds) {
        try {
            // Build where clause
            const userFilter = {};
            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }
            // Multi-zone logic
            if (assignedZoneIds && assignedZoneIds.length > 0) {
                if (zoneId) {
                    if (!assignedZoneIds.includes(zoneId)) {
                        userFilter.id = -1; // Forbidden
                    }
                    else {
                        userFilter.zoneId = zoneId;
                    }
                }
                else {
                    userFilter.zoneId = { in: assignedZoneIds };
                }
            }
            else {
                if (zoneId) {
                    userFilter.zoneId = zoneId;
                }
            }
            const whereClause = Object.keys(userFilter).length > 0
                ? { user: userFilter }
                : {};
            // Get all complaints with user ward information
            const complaints = await prisma_1.default.complaint.findMany({
                where: whereClause,
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            wardId: true,
                            zoneId: true,
                            ward: {
                                select: {
                                    id: true,
                                    wardNumber: true,
                                    inspectorName: true
                                }
                            },
                            zone: {
                                select: {
                                    id: true,
                                    zoneNumber: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            // Group by ward
            const wardStats = new Map();
            complaints.forEach(complaint => {
                const wardId = complaint.user?.wardId;
                const ward = complaint.user?.ward;
                const zone = complaint.user?.zone;
                if (!wardId || !ward)
                    return;
                if (!wardStats.has(wardId)) {
                    wardStats.set(wardId, {
                        wardId,
                        wardNumber: ward.wardNumber,
                        inspectorName: ward.inspectorName,
                        zoneId: complaint.user?.zoneId,
                        zoneNumber: zone?.zoneNumber,
                        zoneName: zone?.name,
                        total: 0,
                        pending: 0,
                        inProgress: 0,
                        resolved: 0,
                        rejected: 0
                    });
                }
                const stats = wardStats.get(wardId);
                stats.total++;
                switch (complaint.status) {
                    case client_1.Complaint_status.PENDING:
                        stats.pending++;
                        break;
                    case client_1.Complaint_status.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case client_1.Complaint_status.RESOLVED:
                        stats.resolved++;
                        break;
                    case client_1.Complaint_status.REJECTED:
                        stats.rejected++;
                        break;
                }
            });
            // Convert map to array and sort by zone number then ward number
            return Array.from(wardStats.values()).sort((a, b) => {
                if (a.zoneNumber !== b.zoneNumber) {
                    return a.zoneNumber - b.zoneNumber;
                }
                return a.wardNumber - b.wardNumber;
            });
        }
        catch (error) {
            console.error('Error getting complaint stats by ward:', error);
            throw error;
        }
    }
    /**
     * Get analytics for Others complaints
     * Provides comprehensive statistics about complaints marked as Others
     *
     * @param filters - Optional filters for analytics
     * @returns Others analytics data
     */
    async getOthersAnalytics(filters = {}) {
        try {
            // Build where clause for Others complaints
            const userFilter = {};
            const complaintFilter = {
                status: client_1.Complaint_status.OTHERS
            };
            // Apply city corporation filter
            if (filters.cityCorporationCode) {
                userFilter.cityCorporationCode = filters.cityCorporationCode;
            }
            // Apply zone filter
            if (filters.zoneId) {
                userFilter.zoneId = filters.zoneId;
            }
            // Apply date range filter
            if (filters.startDate || filters.endDate) {
                complaintFilter.createdAt = {};
                if (filters.startDate) {
                    complaintFilter.createdAt.gte = filters.startDate;
                }
                if (filters.endDate) {
                    complaintFilter.createdAt.lte = filters.endDate;
                }
            }
            // Build final where clause
            const whereClause = {
                ...complaintFilter
            };
            if (Object.keys(userFilter).length > 0) {
                whereClause.user = userFilter;
            }
            // Fetch all Others complaints with necessary data
            const othersComplaints = await prisma_1.default.complaint.findMany({
                where: whereClause,
                select: {
                    id: true,
                    othersCategory: true,
                    othersSubcategory: true,
                    createdAt: true,
                    updatedAt: true,
                    status: true
                }
            });
            // Calculate total Others complaints
            const totalOthers = othersComplaints.length;
            // Group by category
            const byCategory = {
                CORPORATION_INTERNAL: 0,
                CORPORATION_EXTERNAL: 0
            };
            // Group by subcategory
            const bySubcategory = {};
            // Track resolution times for resolved Others complaints
            const resolutionTimes = [];
            const resolutionTimesBySubcategory = {};
            // Process each complaint
            othersComplaints.forEach(complaint => {
                // Count by category
                if (complaint.othersCategory === 'CORPORATION_INTERNAL') {
                    byCategory.CORPORATION_INTERNAL++;
                }
                else if (complaint.othersCategory === 'CORPORATION_EXTERNAL') {
                    byCategory.CORPORATION_EXTERNAL++;
                }
                // Count by subcategory
                if (complaint.othersSubcategory) {
                    bySubcategory[complaint.othersSubcategory] =
                        (bySubcategory[complaint.othersSubcategory] || 0) + 1;
                    // Calculate resolution time if resolved
                    if (complaint.status === client_1.Complaint_status.RESOLVED) {
                        const resolutionTimeHours = (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) / (1000 * 60 * 60);
                        resolutionTimes.push(resolutionTimeHours);
                        if (!resolutionTimesBySubcategory[complaint.othersSubcategory]) {
                            resolutionTimesBySubcategory[complaint.othersSubcategory] = [];
                        }
                        resolutionTimesBySubcategory[complaint.othersSubcategory].push(resolutionTimeHours);
                    }
                }
            });
            // Calculate top subcategories (sorted by count, top 5)
            const topSubcategories = Object.entries(bySubcategory)
                .map(([subcategory, count]) => ({ subcategory, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            // Calculate average resolution time
            const calculateAverage = (times) => {
                if (times.length === 0)
                    return 0;
                const sum = times.reduce((acc, time) => acc + time, 0);
                return Math.round(sum / times.length * 100) / 100; // Round to 2 decimal places
            };
            const averageResolutionTime = {
                overall: calculateAverage(resolutionTimes),
                bySubcategory: Object.entries(resolutionTimesBySubcategory).reduce((acc, [subcategory, times]) => {
                    acc[subcategory] = calculateAverage(times);
                    return acc;
                }, {})
            };
            // Generate trend data (last 30 days)
            const trend = [];
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Group complaints by date
            const complaintsByDate = {};
            othersComplaints.forEach(complaint => {
                if (complaint.createdAt >= thirtyDaysAgo) {
                    const dateKey = complaint.createdAt.toISOString().split('T')[0];
                    complaintsByDate[dateKey] = (complaintsByDate[dateKey] || 0) + 1;
                }
            });
            // Fill in all dates (including zeros)
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dateKey = date.toISOString().split('T')[0];
                trend.push({
                    date: dateKey,
                    count: complaintsByDate[dateKey] || 0
                });
            }
            return {
                totalOthers,
                byCategory,
                bySubcategory,
                topSubcategories,
                averageResolutionTime,
                trend
            };
        }
        catch (error) {
            console.error('Error getting Others analytics:', error);
            throw new Error(`Failed to get Others analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.AdminComplaintService = AdminComplaintService;
exports.adminComplaintService = new AdminComplaintService();
