import { Request, Response } from 'express';
import cityCorporationService from '../services/city-corporation.service';
import { CityCorporationStatus } from '@prisma/client';

class CityCorporationController {
    /**
     * GET /api/admin/city-corporations
     * Get all city corporations with optional status filter
     */
    async getCityCorporations(req: Request, res: Response) {
        try {
            const { status } = req.query;

            const validStatus = status as CityCorporationStatus | 'ALL' | undefined;

            const cityCorporations = await cityCorporationService.getCityCorporations(
                validStatus || 'ALL'
            );

            // Debug log
            console.log('🏢 City Corporations API Response:');
            if (cityCorporations.length > 0) {
                console.log('First City Corp:', {
                    code: cityCorporations[0].code,
                    name: cityCorporations[0].name,
                    totalZones: cityCorporations[0].totalZones,
                    totalWards: cityCorporations[0].totalWards,
                    minZone: cityCorporations[0].minZone,
                    maxZone: cityCorporations[0].maxZone,
                });
            }

            res.json({
                success: true,
                cityCorporations: cityCorporations,
            });
        } catch (error: any) {
            console.error('Error fetching city corporations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch city corporations',
                error: error.message,
            });
        }
    }

    /**
     * GET /api/admin/city-corporations/:code
     * Get single city corporation by code
     */
    async getCityCorporationByCode(req: Request, res: Response) {
        try {
            const { code } = req.params;

            const cityCorporation = await cityCorporationService.getCityCorporationByCode(code);

            res.json({
                success: true,
                data: cityCorporation,
            });
        } catch (error: any) {
            console.error('Error fetching city corporation:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch city corporation',
                    error: error.message,
                });
            }
        }
    }

    /**
     * POST /api/admin/city-corporations
     * Create new city corporation
     */
    async createCityCorporation(req: Request, res: Response) {
        try {
            const { code, name, minWard, maxWard, minZone, maxZone } = req.body;

            // Validation
            if (!code || !name || !minWard || !maxWard || !minZone || !maxZone) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: code, name, minWard, maxWard, minZone, maxZone',
                });
            }

            const cityCorporation = await cityCorporationService.createCityCorporation({
                code,
                name,
                minWard: parseInt(minWard),
                maxWard: parseInt(maxWard),
                minZone: parseInt(minZone),
                maxZone: parseInt(maxZone),
            });

            res.status(201).json({
                success: true,
                message: 'City Corporation created successfully',
                data: cityCorporation,
            });
        } catch (error: any) {
            console.error('Error creating city corporation:', error);

            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('must be')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create city corporation',
                    error: error.message,
                });
            }
        }
    }

    /**
     * PUT /api/admin/city-corporations/:code
     * Update city corporation
     */
    async updateCityCorporation(req: Request, res: Response) {
        try {
            const { code } = req.params;
            const { name, minWard, maxWard, minZone, maxZone, status } = req.body;

            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (minWard !== undefined) updateData.minWard = parseInt(minWard);
            if (maxWard !== undefined) updateData.maxWard = parseInt(maxWard);
            if (minZone !== undefined) updateData.minZone = parseInt(minZone);
            if (maxZone !== undefined) updateData.maxZone = parseInt(maxZone);
            if (status !== undefined) updateData.status = status;

            const cityCorporation = await cityCorporationService.updateCityCorporation(
                code,
                updateData
            );

            res.json({
                success: true,
                message: 'City Corporation updated successfully',
                data: cityCorporation,
            });
        } catch (error: any) {
            console.error('Error updating city corporation:', error);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (error.message.includes('must be')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update city corporation',
                    error: error.message,
                });
            }
        }
    }

    /**
     * GET /api/admin/city-corporations/:code/statistics
     * Get statistics for city corporation
     */
    async getCityCorporationStatistics(req: Request, res: Response) {
        try {
            const { code } = req.params;

            const stats = await cityCorporationService.getCityCorporationStats(code);

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            console.error('Error fetching city corporation statistics:', error);

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
}

export default new CityCorporationController();
