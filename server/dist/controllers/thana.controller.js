"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import thanaService from '../services/thana.service'; // Thana service disabled - using Zone/Ward now
// import { ThanaStatus } from '@prisma/client'; // Thana model removed, using Zone/Ward now
class ThanaController {
    /**
     * GET /api/admin/thanas
     * Get thanas with optional city corporation and status filters
     */
    async getThanas(req, res) {
        try {
            const { cityCorporationCode, status } = req.query;
            // Validate required cityCorporationCode parameter
            if (!cityCorporationCode || typeof cityCorporationCode !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'cityCorporationCode query parameter is required',
                });
            }
            const validStatus = status;
            const thanas = await thanaService.getThanasByCityCorporation(cityCorporationCode, validStatus || 'ALL');
            res.json({
                success: true,
                data: thanas,
            });
        }
        catch (error) {
            console.error('Error fetching thanas:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch thanas',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/thanas/:id
     * Get single thana by ID
     */
    async getThanaById(req, res) {
        try {
            const { id } = req.params;
            const thanaId = parseInt(id);
            if (isNaN(thanaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid thana ID',
                });
            }
            const thana = await thanaService.getThanaById(thanaId);
            res.json({
                success: true,
                data: thana,
            });
        }
        catch (error) {
            console.error('Error fetching thana:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch thana',
                    error: error.message,
                });
            }
        }
    }
    /**
     * POST /api/admin/thanas
     * Create new thana
     */
    async createThana(req, res) {
        try {
            const { name, cityCorporationCode } = req.body;
            // Validation
            if (!name || !cityCorporationCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, cityCorporationCode',
                });
            }
            const thana = await thanaService.createThana({
                name,
                cityCorporationCode,
            });
            res.status(201).json({
                success: true,
                message: 'Thana created successfully',
                data: thana,
            });
        }
        catch (error) {
            console.error('Error creating thana:', error);
            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create thana',
                    error: error.message,
                });
            }
        }
    }
    /**
     * PUT /api/admin/thanas/:id
     * Update thana
     */
    async updateThana(req, res) {
        try {
            const { id } = req.params;
            const thanaId = parseInt(id);
            if (isNaN(thanaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid thana ID',
                });
            }
            const { name, status } = req.body;
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (status !== undefined)
                updateData.status = status;
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No update data provided',
                });
            }
            const thana = await thanaService.updateThana(thanaId, updateData);
            res.json({
                success: true,
                message: 'Thana updated successfully',
                data: thana,
            });
        }
        catch (error) {
            console.error('Error updating thana:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to update thana',
                    error: error.message,
                });
            }
        }
    }
    /**
     * GET /api/admin/thanas/:id/statistics
     * Get statistics for thana
     */
    async getThanaStatistics(req, res) {
        try {
            const { id } = req.params;
            const thanaId = parseInt(id);
            if (isNaN(thanaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid thana ID',
                });
            }
            const stats = await thanaService.getThanaStats(thanaId);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Error fetching thana statistics:', error);
            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to fetch statistics',
                    error: error.message,
                });
            }
        }
    }
}
exports.default = new ThanaController();
