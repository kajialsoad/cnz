import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminComplaintService } from '../services/admin-complaint.service';
import { adminComplaintServiceFixed } from '../services/admin-complaint-fixed.service';
import { Complaint_status } from '@prisma/client';
import { multiZoneService } from '../services/multi-zone.service';

/**
 * Get all complaints (admin view)
 */
export async function getAdminComplaints(req: AuthRequest, res: Response) {
    try {
        const {
            page,
            limit,
            status,
            category,
            ward,
            zoneId,
            wardId,
            cityCorporationCode,
            thanaId,
            search,
            startDate,
            endDate,
            sortBy,
            sortOrder,
            othersCategory,
            othersSubcategory,
            // New: Complaint location filters
            complaintCityCorporationCode,
            complaintZoneId,
            complaintWardId
        } = req.query;

        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds: number[] | undefined;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multiZoneService.getAssignedZoneIds(req.user.sub);
        }

        const result = await adminComplaintService.getAdminComplaints({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as Complaint_status | 'ALL',
            category: category as string,
            ward: ward as string,
            zoneId: zoneId ? parseInt(zoneId as string) : undefined,
            wardId: wardId ? parseInt(wardId as string) : undefined,
            cityCorporationCode: cityCorporationCode as string,
            thanaId: thanaId ? parseInt(thanaId as string) : undefined,
            search: search as string,
            startDate: startDate as string,
            endDate: endDate as string,
            sortBy: sortBy as any,
            sortOrder: sortOrder as 'asc' | 'desc',
            othersCategory: othersCategory as string,
            othersSubcategory: othersSubcategory as string,
            // New: Complaint location filters
            complaintCityCorporationCode: complaintCityCorporationCode as string,
            complaintZoneId: complaintZoneId ? parseInt(complaintZoneId as string) : undefined,
            complaintWardId: complaintWardId ? parseInt(complaintWardId as string) : undefined
        }, assignedZoneIds);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
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
export async function getAdminComplaintById(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.id);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        const complaint = await adminComplaintService.getAdminComplaintById(complaintId);

        res.status(200).json({
            success: true,
            data: { complaint }
        });
    } catch (error) {
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
export async function updateComplaintStatus(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.id);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        const { status, note, category, subcategory, resolutionNote, resolutionImages } = req.body;
        const files = req.files as Express.Multer.File[] | undefined;

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

        const complaint = await adminComplaintService.updateComplaintStatus(complaintId, {
            status: status as Complaint_status,
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
    } catch (error) {
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
export async function getComplaintsByUser(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const { page, limit } = req.query;

        const result = await adminComplaintService.getComplaintsByUser(
            userId,
            page ? parseInt(page as string) : undefined,
            limit ? parseInt(limit as string) : undefined
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
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
export async function getComplaintStatsByZone(req: AuthRequest, res: Response) {
    try {
        const { cityCorporationCode } = req.query;

        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds: number[] | undefined;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multiZoneService.getAssignedZoneIds(req.user.sub);
        }

        const stats = await adminComplaintService.getComplaintStatsByZone(
            cityCorporationCode as string | undefined,
            assignedZoneIds
        );

        res.status(200).json({
            success: true,
            data: { stats }
        });
    } catch (error) {
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
export async function getComplaintStatsByWard(req: AuthRequest, res: Response) {
    try {
        const { zoneId, cityCorporationCode } = req.query;

        // Get assigned zone IDs for SUPER_ADMIN users
        let assignedZoneIds: number[] | undefined;
        if (req.user && req.user.role === 'SUPER_ADMIN') {
            assignedZoneIds = await multiZoneService.getAssignedZoneIds(req.user.sub);
        }

        const stats = await adminComplaintService.getComplaintStatsByWard(
            zoneId ? parseInt(zoneId as string) : undefined,
            cityCorporationCode as string | undefined,
            assignedZoneIds
        );

        res.status(200).json({
            success: true,
            data: { stats }
        });
    } catch (error) {
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
export async function markComplaintAsOthers(req: AuthRequest, res: Response) {
    try {
        const complaintId = parseInt(req.params.id);

        if (isNaN(complaintId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid complaint ID'
            });
        }

        const { othersCategory, othersSubcategory, adminId, note } = req.body;
        const files = req.files as Express.Multer.File[] | undefined;

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
        const validSubcategories: Record<string, string[]> = {
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

        const complaint = await adminComplaintService.markComplaintAsOthers(complaintId, {
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
    } catch (error) {
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
export async function getOthersAnalytics(req: AuthRequest, res: Response) {
    try {
        const { cityCorporationCode, zoneId, startDate, endDate } = req.query;

        // Parse and validate filters
        const filters: any = {};

        if (cityCorporationCode) {
            filters.cityCorporationCode = cityCorporationCode as string;
        }

        if (zoneId) {
            const parsedZoneId = parseInt(zoneId as string);
            if (isNaN(parsedZoneId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID'
                });
            }
            filters.zoneId = parsedZoneId;
        }

        if (startDate) {
            const parsedStartDate = new Date(startDate as string);
            if (isNaN(parsedStartDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid start date'
                });
            }
            filters.startDate = parsedStartDate;
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate as string);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid end date'
                });
            }
            filters.endDate = parsedEndDate;
        }

        const analytics = await adminComplaintService.getOthersAnalytics(filters);

        res.status(200).json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error in getOthersAnalytics:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch Others analytics'
        });
    }
}
