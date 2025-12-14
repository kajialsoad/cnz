import { Request, Response } from 'express';
import zoneService from '../services/zone.service';
import { ZoneStatus } from '@prisma/client';

class ZoneController {
    /**
     * GET /api/admin/zones
     * Get zones with optional filters
     */
    async getZones(req: Request, res: Response) {
        try {
            const { cityCorporationId, cityCorporationCode, status } = req.query;

            // Support both cityCorporationId and cityCorporationCode
            let ccId: number | undefined;

            if (cityCorporationId) {
                ccId = parseInt(cityCorporationId as string);
            } else if (cityCorporationCode) {
                // Convert code to ID
                const prisma = req.prisma;
                if (!prisma) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database connection not available',
                    });
                }

                const cityCorporation = await prisma.cityCorporation.findUnique({
                    where: { code: cityCorporationCode as string },
                    select: { id: true },
                });

                if (!cityCorporation) {
                    return res.status(404).json({
                        success: false,
                        message: 'City Corporation not found',
                    });
                }

                ccId = cityCorporation.id;
            }

            if (!ccId) {
                return res.status(400).json({
                    success: false,
                    message: 'City Corporation ID or Code is required',
                });
            }

            const zones = await zoneService.getZonesByCityCorporation(
                ccId,
                (status as ZoneStatus | 'ALL') || 'ALL'
            );

            return res.status(200).json({
                success: true,
                data: zones,
            });
        } catch (error: any) {
            console.error('Error fetching zones:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch zones',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/admin/zones/:id
     * Get single zone by ID
     */
    async getZoneById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const zone = await zoneService.getZoneById(parseInt(id));

            return res.status(200).json({
                success: true,
                data: zone,
            });
        } catch (error: any) {
            console.error('Error fetching zone:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch zone',
                error: error.message,
            });
        }
    }

    /**
     * POST /api/admin/zones
     * Create new zone
     */
    async createZone(req: Request, res: Response) {
        try {
            const {
                zoneNumber,
                name,
                cityCorporationId,
                officerName,
                officerDesignation,
                officerSerialNumber,
            } = req.body;

            // Validate required fields
            if (!zoneNumber || !cityCorporationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Zone number and City Corporation ID are required',
                });
            }

            const zone = await zoneService.createZone({
                zoneNumber: parseInt(zoneNumber),
                name,
                cityCorporationId: parseInt(cityCorporationId),
                officerName,
                officerDesignation,
                officerSerialNumber,
            });

            return res.status(201).json({
                success: true,
                message: 'Zone created successfully',
                data: zone,
            });
        } catch (error: any) {
            console.error('Error creating zone:', error);

            if (
                error.message.includes('already exists') ||
                error.message.includes('must be between')
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to create zone',
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/admin/zones/:id
     * Update zone
     */
    async updateZone(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                name,
                officerName,
                officerDesignation,
                officerSerialNumber,
                status,
            } = req.body;

            const zone = await zoneService.updateZone(parseInt(id), {
                name,
                officerName,
                officerDesignation,
                officerSerialNumber,
                status,
            });

            return res.status(200).json({
                success: true,
                message: 'Zone updated successfully',
                data: zone,
            });
        } catch (error: any) {
            console.error('Error updating zone:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to update zone',
                error: error.message,
            });
        }
    }

    /**
     * DELETE /api/admin/zones/:id
     * Delete zone (only if no wards assigned)
     */
    async deleteZone(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await zoneService.deleteZone(parseInt(id));

            return res.status(200).json({
                success: true,
                message: 'Zone deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting zone:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            if (error.message.includes('Cannot delete zone')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to delete zone',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/admin/zones/:id/statistics
     * Get zone statistics
     */
    async getZoneStatistics(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const stats = await zoneService.getZoneStats(parseInt(id));

            return res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error('Error fetching zone statistics:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch zone statistics',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/admin/zones/available/:cityCorporationId
     * Get available zone numbers for a city corporation
     */
    async getAvailableZoneNumbers(req: Request, res: Response) {
        try {
            const { cityCorporationId } = req.params;

            const ccId = parseInt(cityCorporationId);
            if (isNaN(ccId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid city corporation ID',
                });
            }

            const availableNumbers = await zoneService.getAvailableZoneNumbers(ccId);

            return res.status(200).json({
                success: true,
                data: availableNumbers,
            });
        } catch (error: any) {
            console.error('Error fetching available zone numbers:', error);

            if (error.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to fetch available zone numbers',
                error: error.message,
            });
        }
    }
}

export default new ZoneController();
