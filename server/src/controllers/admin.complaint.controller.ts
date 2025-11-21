import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { adminComplaintService } from '../services/admin-complaint.service';
import { adminComplaintServiceFixed } from '../services/admin-complaint-fixed.service';
import { ComplaintStatus } from '@prisma/client';

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
            cityCorporationCode,
            thanaId,
            search,
            startDate,
            endDate,
            sortBy,
            sortOrder
        } = req.query;

        const result = await adminComplaintService.getAdminComplaints({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as ComplaintStatus | 'ALL',
            category: category as string,
            ward: ward as string,
            cityCorporationCode: cityCorporationCode as string,
            thanaId: thanaId ? parseInt(thanaId as string) : undefined,
            search: search as string,
            startDate: startDate as string,
            endDate: endDate as string,
            sortBy: sortBy as any,
            sortOrder: sortOrder as 'asc' | 'desc'
        });

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

        const complaint = await adminComplaintService.updateComplaintStatus(complaintId, {
            status: status as ComplaintStatus,
            note,
            adminId: req.user.sub
        });

        res.status(200).json({
            success: true,
            message: 'Complaint status updated successfully',
            data: { complaint }
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
