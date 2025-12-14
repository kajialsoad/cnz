import { Request, Response } from 'express';
import wardService from '../services/ward.service';
import { WardStatus } from '@prisma/client';

class WardController {
    /**
     * GET /api/admin/wards
     * Get wards with optional zone and status filters
     */
    async getWards(req: Request, res: Response) {
        try {
            const { zoneId, status } = req.query;

            // Validate required zoneId parameter
            if (!zoneId || typeof zoneId !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'zoneId query parameter is required',
                });
            }

            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zoneId format',
                });
            }

            const validStatus = status as WardStatus | 'ALL' | undefined;

            const wards = await wardService.getWardsByZone(
                zoneIdNum,
                validStatus || 'ALL'
            );

            res.json({
                success: true,
                data: wards,
            });
        } catch (error: any) {
            console.error('Error fetching wards:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch wards',
                    error: error.message,
                });
            }
        }
    }

    /**
     * GET /api/admin/wards/:id
     * Get single ward by ID
     */
    async getWardById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);

            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }

            const ward = await wardService.getWardById(wardId);

            res.json({
                success: true,
                data: ward,
            });
        } catch (error: any) {
            console.error('Error fetching ward:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch ward',
                    error: error.message,
                });
            }
        }
    }

    /**
     * POST /api/admin/wards
     * Create new ward
     */
    async createWard(req: Request, res: Response) {
        try {
            const { wardNumber, zoneId, inspectorName, inspectorSerialNumber } = req.body;

            // Validation
            if (!wardNumber || !zoneId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: wardNumber, zoneId',
                });
            }

            if (typeof wardNumber !== 'number' || wardNumber < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Ward number must be a positive integer',
                });
            }

            if (typeof zoneId !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Zone ID must be a number',
                });
            }

            const ward = await wardService.createWard({
                wardNumber,
                zoneId,
                inspectorName,
                inspectorSerialNumber,
            });

            res.status(201).json({
                success: true,
                message: 'Ward created successfully',
                data: ward,
            });
        } catch (error: any) {
            console.error('Error creating ward:', error);

            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('maximum')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create ward',
                    error: error.message,
                });
            }
        }
    }

    /**
     * POST /api/admin/wards/bulk
     * Bulk create wards for a zone
     */
    async createWardsBulk(req: Request, res: Response) {
        try {
            const { zoneId, wardNumbers } = req.body;

            // Validation
            if (!zoneId || !wardNumbers) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: zoneId, wardNumbers',
                });
            }

            if (typeof zoneId !== 'number') {
                return res.status(400).json({
                    success: false,
                    message: 'Zone ID must be a number',
                });
            }

            if (!Array.isArray(wardNumbers) || wardNumbers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ward numbers must be a non-empty array',
                });
            }

            if (wardNumbers.some(num => typeof num !== 'number' || num < 1)) {
                return res.status(400).json({
                    success: false,
                    message: 'All ward numbers must be positive integers',
                });
            }

            if (wardNumbers.length > 12) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot create more than 12 wards at once',
                });
            }

            const wards = await wardService.createWardsBulk(zoneId, wardNumbers);

            res.status(201).json({
                success: true,
                message: `${wards.length} wards created successfully`,
                data: wards,
            });
        } catch (error: any) {
            console.error('Error creating wards in bulk:', error);

            if (error.message.includes('already exist')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('maximum') || error.message.includes('exceed')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create wards',
                    error: error.message,
                });
            }
        }
    }

    /**
     * PUT /api/admin/wards/:id
     * Update ward
     */
    async updateWard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);

            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }

            const { inspectorName, inspectorSerialNumber, status } = req.body;

            const updateData: any = {};
            if (inspectorName !== undefined) updateData.inspectorName = inspectorName;
            if (inspectorSerialNumber !== undefined) updateData.inspectorSerialNumber = inspectorSerialNumber;
            if (status !== undefined) updateData.status = status;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided',
                });
            }

            // Validate inspector data if provided
            if (updateData.inspectorName !== undefined || updateData.inspectorSerialNumber !== undefined) {
                const validation = wardService.validateInspectorData({
                    inspectorName: updateData.inspectorName,
                    inspectorSerialNumber: updateData.inspectorSerialNumber,
                });

                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Validation failed',
                        errors: validation.errors,
                    });
                }
            }

            const ward = await wardService.updateWard(wardId, updateData);

            res.json({
                success: true,
                message: 'Ward updated successfully',
                data: ward,
            });
        } catch (error: any) {
            console.error('Error updating ward:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update ward',
                    error: error.message,
                });
            }
        }
    }

    /**
     * DELETE /api/admin/wards/:id
     * Delete ward (only if no users assigned)
     */
    async deleteWard(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);

            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }

            await wardService.deleteWard(wardId);

            res.json({
                success: true,
                message: 'Ward deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting ward:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('Cannot delete')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to delete ward',
                    error: error.message,
                });
            }
        }
    }

    /**
     * GET /api/admin/wards/:id/statistics
     * Get statistics for ward
     */
    async getWardStatistics(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const wardId = parseInt(id);

            if (isNaN(wardId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ward ID',
                });
            }

            const stats = await wardService.getWardStats(wardId);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error('Error fetching ward statistics:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch statistics',
                    error: error.message,
                });
            }
        }
    }

    /**
     * GET /api/admin/wards/available/:zoneId
     * Get available ward numbers for a zone
     */
    async getAvailableWardNumbers(req: Request, res: Response) {
        try {
            const { zoneId } = req.params;

            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID',
                });
            }

            // Service now gets limits from city corporation automatically
            const availableNumbers = await wardService.getAvailableWardNumbers(zoneIdNum);

            res.json({
                success: true,
                data: availableNumbers,
            });
        } catch (error: any) {
            console.error('Error fetching available ward numbers:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch available ward numbers',
                    error: error.message,
                });
            }
        }
    }

    /**
     * GET /api/admin/wards/limit/:zoneId
     * Check ward limit for zone
     */
    async checkWardLimit(req: Request, res: Response) {
        try {
            const { zoneId } = req.params;

            const zoneIdNum = parseInt(zoneId);
            if (isNaN(zoneIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid zone ID',
                });
            }

            const limitInfo = await wardService.checkWardLimit(zoneIdNum);

            res.json({
                success: true,
                data: limitInfo,
            });
        } catch (error: any) {
            console.error('Error checking ward limit:', error);

            res.status(500).json({
                success: false,
                message: 'Failed to check ward limit',
                error: error.message,
            });
        }
    }
}

export default new WardController();