import prisma from '../utils/prisma';
import { Complaint_status } from '@prisma/client';
import notificationService from './notification.service';

export interface AdminComplaintQueryInput {
    page?: number;
    limit?: number;
    status?: Complaint_status | 'ALL';
    category?: string;
    subcategory?: string;
    othersCategory?: string; // New: Filter by Others category
    othersSubcategory?: string; // New: Filter by Others subcategory
    ward?: string;
    zoneId?: number; // New: Zone filter
    wardId?: number; // New: Ward filter
    cityCorporationCode?: string;
    thanaId?: number; // Deprecated: Keep for backward compatibility
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
    complaintCityCorporationCode?: string;
    complaintZoneId?: number;
    complaintWardId?: number;
}

export interface UpdateComplaintStatusInput {
    status: Complaint_status;
    note?: string;
    adminId: number;
    category?: string;
    subcategory?: string;
    resolutionImages?: string;
    resolutionNote?: string;
    resolutionImageFiles?: Express.Multer.File[]; // NEW: Files to upload
}

/**
 * Input for marking complaint as Others
 */
export interface MarkOthersInput {
    othersCategory: 'CORPORATION_INTERNAL' | 'CORPORATION_EXTERNAL';
    othersSubcategory: string;
    note?: string;
    adminId: number;
    adminReportImages?: Express.Multer.File[]; // NEW: Files to upload
}

export class AdminComplaintService {
    /**
     * Get all complaints with admin-level access (no user restriction)
     * Supports pagination, filtering, and search
     * 
     * @param query - Query parameters for filtering
     * @param assignedZoneIds - For SUPER_ADMIN: assigned zone IDs
     * @param adminUser - Admin user object with role and permissions
     */
    async getAdminComplaints(query: AdminComplaintQueryInput = {}, assignedZoneIds?: number[], adminUser?: { role: string; cityCorporationCode?: string; permissions?: string }) {
        try {
            const {
                page = 1,
                limit = 20,
                status,
                category,
                subcategory,
                othersCategory,
                othersSubcategory,
                ward,
                zoneId, // specific zone filter requested
                wardId,
                cityCorporationCode,
                thanaId, // Deprecated but kept for backward compatibility
                search,
                startDate,
                endDate,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                complaintCityCorporationCode,
                complaintZoneId,
                complaintWardId
            } = query;

            const skip = (page - 1) * limit;

            // Build where clause - COMPLETELY REWRITTEN
            const andConditions: any[] = [];

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
                } else {
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
                } else {
                    andConditions.push({ subcategory });
                }
            }

            // REMOVED: User location filters - now using complaint location only
            // City Corporation, Zone, Ward filters are handled by complaint location fields below

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

            // Legacy filters (deprecated - kept for backward compatibility with old API calls)
            // These are now ignored in favor of complaint location filters
            // cityCorporationCode, zoneId, wardId, ward, thanaId

            // Date range filter
            if (startDate || endDate) {
                const dateFilter: any = {};
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



            // New: Complaint Direct Location Filters with Fallback
            // If complaint location fields are provided, use them
            // Otherwise, fall back to old location fields for backward compatibility
            if (complaintCityCorporationCode) {
                andConditions.push({
                    OR: [
                        { complaintCityCorporationCode: complaintCityCorporationCode },
                        // Fallback: If complaintCityCorporationCode is null, check old field
                        {
                            AND: [
                                { complaintCityCorporationCode: null },
                                { cityCorporationCode: complaintCityCorporationCode }
                            ]
                        }
                    ]
                });
            }

            // ========================================
            // ROLE-BASED FILTERING
            // ========================================

            // ADMIN Role: Ward-based filtering (Zone IGNORED)
            if (adminUser && adminUser.role === 'ADMIN') {
                console.log('🔒 ADMIN filtering: Ward-based only, Zone IGNORED');

                // 1. City Corporation Match (MANDATORY)
                if (adminUser.cityCorporationCode) {
                    andConditions.push({
                        OR: [
                            { complaintCityCorporationCode: adminUser.cityCorporationCode },
                            {
                                AND: [
                                    { complaintCityCorporationCode: null },
                                    { cityCorporationCode: adminUser.cityCorporationCode }
                                ]
                            }
                        ]
                    });
                }

                // 2. Ward Match (MANDATORY) - Multiple Ward Support
                let adminWardIds: number[] = [];

                // Parse ward IDs from permissions JSON
                if (adminUser.permissions) {
                    try {
                        const permissionsData = JSON.parse(adminUser.permissions);
                        if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                            adminWardIds = permissionsData.wards;
                        }
                    } catch (error) {
                        console.error('Error parsing admin permissions:', error);
                    }
                }

                console.log(`🔒 ADMIN assigned wards: [${adminWardIds.join(', ')}]`);

                if (adminWardIds.length > 0) {
                    // Filter by assigned ward IDs
                    andConditions.push({
                        OR: [
                            { complaintWardId: { in: adminWardIds } },
                            {
                                AND: [
                                    { complaintWardId: null },
                                    { wardId: { in: adminWardIds } }
                                ]
                            }
                        ]
                    });
                } else {
                    // No wards assigned = no complaints visible
                    console.log('⚠️ ADMIN has no assigned wards - returning empty result');
                    andConditions.push({ id: -1 });
                }

                // ⚠️ CRITICAL: Zone filtering is NOT applied for ADMIN role
                // Zone is COMPLETELY IGNORED for Admin
            }
            // SUPER_ADMIN Zone Filtering: Filter by assigned zones
            // This ensures Super Admins only see complaints from their assigned zones
            else if (assignedZoneIds && assignedZoneIds.length > 0) {
                if (complaintZoneId) {
                    // If specific zone requested, validate it's in assigned zones
                    if (!assignedZoneIds.includes(complaintZoneId)) {
                        // Return empty result - requested zone not in assigned zones
                        andConditions.push({ id: -1 });
                    } else {
                        // Valid zone requested
                        andConditions.push({
                            OR: [
                                { complaintZoneId: complaintZoneId },
                                // Fallback: If complaintZoneId is null, check old field
                                {
                                    AND: [
                                        { complaintZoneId: null },
                                        { zoneId: complaintZoneId }
                                    ]
                                }
                            ]
                        });
                    }
                } else {
                    // No specific zone requested - filter by all assigned zones
                    andConditions.push({
                        OR: [
                            { complaintZoneId: { in: assignedZoneIds } },
                            // Fallback: If complaintZoneId is null, check old field
                            {
                                AND: [
                                    { complaintZoneId: null },
                                    { zoneId: { in: assignedZoneIds } }
                                ]
                            }
                        ]
                    });
                }
            } else if (complaintZoneId) {
                // No assigned zones restriction, just filter by requested zone
                andConditions.push({
                    OR: [
                        { complaintZoneId: complaintZoneId },
                        // Fallback: If complaintZoneId is null, check old field
                        {
                            AND: [
                                { complaintZoneId: null },
                                { zoneId: complaintZoneId }
                            ]
                        }
                    ]
                });
            }

            if (complaintWardId) {
                andConditions.push({
                    OR: [
                        { complaintWardId: complaintWardId },
                        // Fallback: If complaintWardId is null, check old field
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: complaintWardId }
                            ]
                        }
                    ]
                });
            }

            // Build final where clause
            const where = andConditions.length > 0 ? { AND: andConditions } : {};

            // Build order by clause
            const orderBy: any = {};
            orderBy[sortBy] = sortOrder;

            // Fetch complaints and total count
            const [complaints, total, statusCounts] = await Promise.all([
                prisma.complaint.findMany({
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
                prisma.complaint.count({ where }),
                // Pass complaint location filters to getStatusCounts (not user location)
                this.getStatusCounts(complaintCityCorporationCode, complaintZoneId, complaintWardId, assignedZoneIds, adminUser)
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
        } catch (error) {
            console.error('Error getting admin complaints:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            throw error; // Throw original error to see actual message
        }
    }

    /**
     * Get single complaint by ID with full details (admin access)
     */
    async getAdminComplaintById(id: number) {
        try {
            const complaint = await prisma.complaint.findUnique({
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
                prisma.statusHistory.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.complaintChatMessage.findMany({
                    where: { complaintId: id },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                })
            ]);

            // Fetch details of users who changed status
            const userIds = [...new Set(statusHistory.map(history => history.changedBy))];
            const users = await prisma.user.findMany({
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
        } catch (error) {
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
    async updateComplaintStatus(id: number, input: UpdateComplaintStatusInput) {
        try {
            // Get current complaint
            const currentComplaint = await prisma.complaint.findUnique({
                where: { id }
            });

            if (!currentComplaint) {
                throw new Error('Complaint not found');
            }

            // Validate resolution documentation for RESOLVED status
            if (input.status === Complaint_status.RESOLVED) {
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
            let resolutionImageUrls: string | undefined = input.resolutionImages;

            if (input.resolutionImageFiles && input.resolutionImageFiles.length > 0) {
                console.log(`📤 Uploading ${input.resolutionImageFiles.length} resolution images to Cloudinary...`);
                const newResolutionImageUrls = await this.uploadResolutionImages(input.resolutionImageFiles);
                console.log(`✅ Resolution images uploaded successfully: ${newResolutionImageUrls}`);

                // Append new images to existing ones (if any)
                if (resolutionImageUrls) {
                    resolutionImageUrls = `${resolutionImageUrls},${newResolutionImageUrls}`;
                } else {
                    resolutionImageUrls = newResolutionImageUrls;
                }
            }

            // Validation: At least one resolution image is required for RESOLVED status
            // We check if we have new images OR existing images being preserved
            if (input.status === Complaint_status.RESOLVED) {
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
            const result = await prisma.$transaction(async (tx) => {
                // Update complaint status
                const updatedComplaint = await tx.complaint.update({
                    where: { id },
                    data: {
                        status: input.status,
                        updatedAt: new Date(),
                        resolutionImages: resolutionImageUrls, // Add resolution images (comma-separated URLs)
                        resolutionNote: input.resolutionNote,      // Add resolution note

                        // Intelligent Category Handling
                        // If status is OTHERS, we map the input category/subcategory to the others* fields
                        // This preserves the original user-submitted category in the main fields
                        othersCategory: input.status === Complaint_status.OTHERS ? input.category : undefined,
                        othersSubcategory: input.status === Complaint_status.OTHERS ? input.subcategory : undefined,

                        // Only update main category/subcategory if status is NOT OTHERS
                        // This prevents overwriting the original category when marking as others
                        category: input.status !== Complaint_status.OTHERS ? input.category : undefined,
                        subcategory: input.status !== Complaint_status.OTHERS ? input.subcategory : undefined,
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
                    if (input.status === Complaint_status.IN_PROGRESS) {
                        await notificationService.createStatusChangeNotification(
                            id,
                            currentComplaint.userId,
                            'IN_PROGRESS',
                            {
                                adminName: `Admin #${input.adminId}`,
                                resolutionImages: resolutionImageUrls ? resolutionImageUrls.split(',').map(url => url.trim()) : undefined,
                                resolutionNote: input.resolutionNote
                            }
                        );
                    } else if (input.status === Complaint_status.RESOLVED) {
                        // Parse resolution images for notification metadata
                        const resolutionImageUrlsArray = resolutionImageUrls
                            ? resolutionImageUrls.split(',').map(url => url.trim())
                            : [];

                        await notificationService.createStatusChangeNotification(
                            id,
                            currentComplaint.userId,
                            'RESOLVED',
                            {
                                resolutionImages: resolutionImageUrlsArray,
                                resolutionNote: input.resolutionNote,
                                adminName: `Admin #${input.adminId}`
                            }
                        );
                    }
                } catch (notificationError) {
                    console.error('Failed to create notification:', notificationError);
                    // Don't throw error to prevent failing the main operation
                }
            }

            // Create activity log entry
            try {
                await prisma.activityLog.create({
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
            } catch (logError) {
                console.error('Failed to create activity log:', logError);
                // Don't throw error to prevent failing the main operation
            }

            return this.formatComplaintResponse(result);
        } catch (error) {
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
    async uploadResolutionImages(files: Express.Multer.File[]): Promise<string> {
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
            const { cloudUploadService } = await import('./cloud-upload.service');

            // Upload all files to Cloudinary
            const uploadPromises = files.map(file =>
                cloudUploadService.uploadImage(file, 'resolutions')
            );

            const uploadResults = await Promise.all(uploadPromises);

            // Extract secure URLs and join with comma
            const imageUrls = uploadResults.map(result => result.secure_url).join(',');

            console.log(`✅ Successfully uploaded ${files.length} resolution images`);

            return imageUrls;
        } catch (error) {
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
    async markComplaintAsOthers(id: number, input: MarkOthersInput) {
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
            const currentComplaint = await prisma.complaint.findUnique({
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
            let resolutionImageUrls: string | undefined;

            if (input.adminReportImages && input.adminReportImages.length > 0) {
                console.log(`📤 Uploading ${input.adminReportImages.length} admin report images to Cloudinary...`);
                resolutionImageUrls = await this.uploadResolutionImages(input.adminReportImages);
                console.log(`✅ Admin report images uploaded successfully: ${resolutionImageUrls}`);
            }

            // Update complaint and create history in transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update complaint to Others status
                const updatedComplaint = await tx.complaint.update({
                    where: { id },
                    data: {
                        status: Complaint_status.OTHERS,
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
                        newStatus: Complaint_status.OTHERS,
                        changedBy: input.adminId,
                        note: input.note || `Marked as Others: ${input.othersCategory} - ${input.othersSubcategory}`
                    }
                });

                return updatedComplaint;
            });

            // Create notification for user using NotificationService
            if (currentComplaint.userId) {
                try {
                    await notificationService.createStatusChangeNotification(
                        id,
                        currentComplaint.userId,
                        'OTHERS',
                        {
                            othersCategory: input.othersCategory,
                            othersSubcategory: input.othersSubcategory,
                            adminName: `Admin #${input.adminId}`,
                            // resolutionImages: resolutionImageUrls ? resolutionImageUrls.split(',') : undefined, // Optional: Include images in notification metadata if needed
                            // resolutionNote: input.note
                        }
                    );
                } catch (notificationError) {
                    console.error('Failed to create notification:', notificationError);
                    // Don't throw error to prevent failing the main operation
                }
            }

            // Create activity log entry
            try {
                await prisma.activityLog.create({
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
                            status: Complaint_status.OTHERS,
                            othersCategory: input.othersCategory,
                            othersSubcategory: input.othersSubcategory,
                            resolutionImages: resolutionImageUrls,
                            resolutionNote: input.note
                        })
                    }
                });
            } catch (logError) {
                console.error('Failed to create activity log:', logError);
                // Don't throw error to prevent failing the main operation
            }

            return this.formatComplaintResponse(result);
        } catch (error) {
            console.error('Error marking complaint as Others:', error);
            throw error;
        }
    }

    /**
     * Create a notification for a user
     */
    private async createNotification(userId: number, title: string, message: string) {
        try {
            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    message,
                    type: 'SYSTEM',
                    isRead: false
                }
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            // Don't throw error to prevent failing the main request
        }
    }


    /**
     * Get all complaints for a specific user
     */
    async getComplaintsByUser(userId: number, page: number = 1, limit: number = 20) {
        try {
            const skip = (page - 1) * limit;

            const [complaints, total, user] = await Promise.all([
                prisma.complaint.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }),
                prisma.complaint.count({ where: { userId } }),
                prisma.user.findUnique({
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
        } catch (error) {
            console.error('Error getting complaints by user:', error);
            throw error;
        }
    }

    /**
     * Get complaint statistics for a specific user
     */
    private async getUserComplaintStatistics(userId: number) {
        const [total, pending, inProgress, resolved, rejected] = await Promise.all([
            prisma.complaint.count({ where: { userId } }),
            prisma.complaint.count({ where: { userId, status: Complaint_status.PENDING } }),
            prisma.complaint.count({ where: { userId, status: Complaint_status.IN_PROGRESS } }),
            prisma.complaint.count({ where: { userId, status: Complaint_status.RESOLVED } }),
            prisma.complaint.count({ where: { userId, status: Complaint_status.REJECTED } })
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
     * Uses COMPLAINT LOCATION filters (not user location)
     * This ensures counts match the filtered complaints
     */
    private async getStatusCounts(cityCorporationCode?: string, zoneId?: number, wardId?: number, assignedZoneIds?: number[], adminUser?: { role: string; cityCorporationCode?: string; permissions?: string }) {
        // Build where clause using COMPLAINT LOCATION fields
        const whereClause: any = {};

        // ADMIN Role: Ward-based filtering (Zone IGNORED)
        if (adminUser && adminUser.role === 'ADMIN') {
            // City Corporation filter
            if (adminUser.cityCorporationCode) {
                whereClause.OR = [
                    { complaintCityCorporationCode: adminUser.cityCorporationCode },
                    {
                        AND: [
                            { complaintCityCorporationCode: null },
                            { cityCorporationCode: adminUser.cityCorporationCode }
                        ]
                    }
                ];
            }

            // Ward filter - Multiple Ward Support
            let adminWardIds: number[] = [];
            if (adminUser.permissions) {
                try {
                    const permissionsData = JSON.parse(adminUser.permissions);
                    if (permissionsData.wards && Array.isArray(permissionsData.wards)) {
                        adminWardIds = permissionsData.wards;
                    }
                } catch (error) {
                    console.error('Error parsing admin permissions:', error);
                }
            }

            if (adminWardIds.length > 0) {
                const wardFilter = {
                    OR: [
                        { complaintWardId: { in: adminWardIds } },
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: { in: adminWardIds } }
                            ]
                        }
                    ]
                };

                if (whereClause.OR) {
                    whereClause.AND = [{ OR: whereClause.OR }, wardFilter];
                    delete whereClause.OR;
                } else {
                    Object.assign(whereClause, wardFilter);
                }
            } else {
                // No wards assigned = zero counts
                return {
                    pending: 0,
                    inProgress: 0,
                    resolved: 0,
                    rejected: 0,
                    others: 0,
                    total: 0
                };
            }
        }
        // SUPER_ADMIN or other roles: existing logic
        else {
            // City Corporation filter - use complaint location with fallback
            if (cityCorporationCode) {
                whereClause.OR = [
                    { complaintCityCorporationCode: cityCorporationCode },
                    {
                        AND: [
                            { complaintCityCorporationCode: null },
                            { cityCorporationCode: cityCorporationCode }
                        ]
                    }
                ];
            }

            // SUPER_ADMIN Zone Filtering for status counts
            if (assignedZoneIds && assignedZoneIds.length > 0) {
                if (zoneId) {
                    // If specific zone requested, validate it's in assigned zones
                    if (!assignedZoneIds.includes(zoneId)) {
                        // Return zero counts - requested zone not in assigned zones
                        return {
                            pending: 0,
                            inProgress: 0,
                            resolved: 0,
                            rejected: 0,
                            others: 0,
                            total: 0
                        };
                    } else {
                        // Valid zone requested
                        const zoneFilter = {
                            OR: [
                                { complaintZoneId: zoneId },
                                {
                                    AND: [
                                        { complaintZoneId: null },
                                        { zoneId: zoneId }
                                    ]
                                }
                            ]
                        };

                        if (whereClause.OR) {
                            whereClause.AND = [{ OR: whereClause.OR }, zoneFilter];
                            delete whereClause.OR;
                        } else {
                            Object.assign(whereClause, zoneFilter);
                        }
                    }
                } else {
                    // No specific zone requested - filter by all assigned zones
                    const zoneFilter = {
                        OR: [
                            { complaintZoneId: { in: assignedZoneIds } },
                            {
                                AND: [
                                    { complaintZoneId: null },
                                    { zoneId: { in: assignedZoneIds } }
                                ]
                            }
                        ]
                    };

                    if (whereClause.OR) {
                        whereClause.AND = [{ OR: whereClause.OR }, zoneFilter];
                        delete whereClause.OR;
                    } else {
                        Object.assign(whereClause, zoneFilter);
                    }
                }
            } else if (zoneId) {
                // No assigned zones restriction, just filter by requested zone
                const zoneFilter = {
                    OR: [
                        { complaintZoneId: zoneId },
                        {
                            AND: [
                                { complaintZoneId: null },
                                { zoneId: zoneId }
                            ]
                        }
                    ]
                };

                if (whereClause.OR) {
                    whereClause.AND = [{ OR: whereClause.OR }, zoneFilter];
                    delete whereClause.OR;
                } else {
                    Object.assign(whereClause, zoneFilter);
                }
            }

            // Ward filter - use complaint location with fallback
            if (wardId) {
                const wardFilter = {
                    OR: [
                        { complaintWardId: wardId },
                        {
                            AND: [
                                { complaintWardId: null },
                                { wardId: wardId }
                            ]
                        }
                    ]
                };

                if (whereClause.AND) {
                    whereClause.AND.push(wardFilter);
                } else if (whereClause.OR) {
                    whereClause.AND = [{ OR: whereClause.OR }, wardFilter];
                    delete whereClause.OR;
                } else {
                    Object.assign(whereClause, wardFilter);
                }
            }

            const [pending, inProgress, resolved, rejected, others] = await Promise.all([
                prisma.complaint.count({
                    where: {
                        ...whereClause,
                        status: Complaint_status.PENDING
                    }
                }),
                prisma.complaint.count({
                    where: {
                        ...whereClause,
                        status: Complaint_status.IN_PROGRESS
                    }
                }),
                prisma.complaint.count({
                    where: {
                        ...whereClause,
                        status: Complaint_status.RESOLVED
                    }
                }),
                prisma.complaint.count({
                    where: {
                        ...whereClause,
                        status: Complaint_status.REJECTED
                    }
                }),
                prisma.complaint.count({
                    where: {
                        ...whereClause,
                        status: Complaint_status.OTHERS
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
    }

    /**
     * Helper method to parse file URLs from stored string
     */
    private parseFileUrls(urlString: string | null): string[] {
        if (!urlString) return [];

        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(urlString);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (error) {
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
    private formatComplaintResponse(complaint: any) {
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
    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    }

    /**
     * Get complaint statistics grouped by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByZone(cityCorporationCode?: string, assignedZoneIds?: number[]) {
        try {
            // Build where clause
            const userFilter: any = {};

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
            const complaints = await prisma.complaint.findMany({
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
            const zoneStats = new Map<number, any>();

            complaints.forEach(complaint => {
                const zoneId = complaint.user?.zoneId;
                const zone = complaint.user?.zone;

                if (!zoneId || !zone) return;

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

                const stats = zoneStats.get(zoneId)!;
                stats.total++;

                switch (complaint.status) {
                    case Complaint_status.PENDING:
                        stats.pending++;
                        break;
                    case Complaint_status.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case Complaint_status.RESOLVED:
                        stats.resolved++;
                        break;
                    case Complaint_status.REJECTED:
                        stats.rejected++;
                        break;
                }
            });

            // Convert map to array and sort by zone number
            return Array.from(zoneStats.values()).sort((a, b) => a.zoneNumber - b.zoneNumber);
        } catch (error) {
            console.error('Error getting complaint stats by zone:', error);
            throw error;
        }
    }

    /**
     * Get complaint statistics grouped by ward
     * @param zoneId Optional filter by zone
     * @param cityCorporationCode Optional filter by city corporation
     */
    async getComplaintStatsByWard(zoneId?: number, cityCorporationCode?: string, assignedZoneIds?: number[]) {
        try {
            // Build where clause
            const userFilter: any = {};

            if (cityCorporationCode) {
                userFilter.cityCorporationCode = cityCorporationCode;
            }

            // Multi-zone logic
            if (assignedZoneIds && assignedZoneIds.length > 0) {
                if (zoneId) {
                    if (!assignedZoneIds.includes(zoneId)) {
                        userFilter.id = -1; // Forbidden
                    } else {
                        userFilter.zoneId = zoneId;
                    }
                } else {
                    userFilter.zoneId = { in: assignedZoneIds };
                }
            } else {
                if (zoneId) {
                    userFilter.zoneId = zoneId;
                }
            }

            const whereClause = Object.keys(userFilter).length > 0
                ? { user: userFilter }
                : {};

            // Get all complaints with user ward information
            const complaints = await prisma.complaint.findMany({
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
            const wardStats = new Map<number, any>();

            complaints.forEach(complaint => {
                const wardId = complaint.user?.wardId;
                const ward = complaint.user?.ward;
                const zone = complaint.user?.zone;

                if (!wardId || !ward) return;

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

                const stats = wardStats.get(wardId)!;
                stats.total++;

                switch (complaint.status) {
                    case Complaint_status.PENDING:
                        stats.pending++;
                        break;
                    case Complaint_status.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case Complaint_status.RESOLVED:
                        stats.resolved++;
                        break;
                    case Complaint_status.REJECTED:
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
        } catch (error) {
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
    async getOthersAnalytics(filters: {
        cityCorporationCode?: string;
        zoneId?: number;
        startDate?: Date;
        endDate?: Date;
    } = {}) {
        try {
            // Build where clause for Others complaints
            const userFilter: any = {};
            const complaintFilter: any = {
                status: Complaint_status.OTHERS
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
            const whereClause: any = {
                ...complaintFilter
            };

            if (Object.keys(userFilter).length > 0) {
                whereClause.user = userFilter;
            }

            // Fetch all Others complaints with necessary data
            const othersComplaints = await prisma.complaint.findMany({
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
            const bySubcategory: Record<string, number> = {};

            // Track resolution times for resolved Others complaints
            const resolutionTimes: number[] = [];
            const resolutionTimesBySubcategory: Record<string, number[]> = {};

            // Process each complaint
            othersComplaints.forEach(complaint => {
                // Count by category
                if (complaint.othersCategory === 'CORPORATION_INTERNAL') {
                    byCategory.CORPORATION_INTERNAL++;
                } else if (complaint.othersCategory === 'CORPORATION_EXTERNAL') {
                    byCategory.CORPORATION_EXTERNAL++;
                }

                // Count by subcategory
                if (complaint.othersSubcategory) {
                    bySubcategory[complaint.othersSubcategory] =
                        (bySubcategory[complaint.othersSubcategory] || 0) + 1;

                    // Calculate resolution time if resolved
                    if (complaint.status === Complaint_status.RESOLVED) {
                        const resolutionTimeHours =
                            (complaint.updatedAt.getTime() - complaint.createdAt.getTime()) / (1000 * 60 * 60);

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
            const calculateAverage = (times: number[]) => {
                if (times.length === 0) return 0;
                const sum = times.reduce((acc, time) => acc + time, 0);
                return Math.round(sum / times.length * 100) / 100; // Round to 2 decimal places
            };

            const averageResolutionTime = {
                overall: calculateAverage(resolutionTimes),
                bySubcategory: Object.entries(resolutionTimesBySubcategory).reduce(
                    (acc, [subcategory, times]) => {
                        acc[subcategory] = calculateAverage(times);
                        return acc;
                    },
                    {} as Record<string, number>
                )
            };

            // Generate trend data (last 30 days)
            const trend: Array<{ date: string; count: number }> = [];
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Group complaints by date
            const complaintsByDate: Record<string, number> = {};
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
        } catch (error) {
            console.error('Error getting Others analytics:', error);
            throw new Error(`Failed to get Others analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export const adminComplaintService = new AdminComplaintService();
