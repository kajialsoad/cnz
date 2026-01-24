"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zone_service_1 = __importDefault(require("../services/zone.service"));
class ZoneController {
    /**
     * GET /api/admin/zones
     * Get zones with optional filters
     */
    async getZones(req, res) {
        try {
            const { cityCorporationId, cityCorporationCode, status } = req.query;
            // Support both cityCorporationId and cityCorporationCode
            let ccId;
            if (cityCorporationId) {
                ccId = parseInt(cityCorporationId);
            }
            else if (cityCorporationCode) {
                // Convert code to ID
                const prisma = req.prisma;
                if (!prisma) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database connection not available',
                    });
                }
                const cityCorporation = await prisma.cityCorporation.findUnique({
                    where: { code: cityCorporationCode },
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
            // If User is authenticated and not a Master Admin, use getAccessibleZones
            // We need to check req.user. The interface might need extending or casting.
            const user = req.user;
            if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
                const zones = await zone_service_1.default.getAccessibleZones(user.id);
                // If specific city corporation filter was requested, we might want to double check
                // but getAccessibleZones already respects assignments.
                // We can return here.
                return res.status(200).json({
                    success: true,
                    data: zones,
                });
            }
            const zones = await zone_service_1.default.getZonesByCityCorporation(ccId, status || 'ALL');
            return res.status(200).json({
                success: true,
                data: zones,
            });
        }
        catch (error) {
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
    async getZoneById(req, res) {
        try {
            const { id } = req.params;
            const zone = await zone_service_1.default.getZoneById(parseInt(id));
            return res.status(200).json({
                success: true,
                data: zone,
            });
        }
        catch (error) {
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
    async createZone(req, res) {
        try {
            const { zoneNumber, name, cityCorporationId, officerName, officerDesignation, officerSerialNumber, officerPhone, } = req.body;
            // Validate required fields
            if (!zoneNumber || !cityCorporationId) {
                return res.status(400).json({
                    success: false,
                    message: 'Zone number and City Corporation ID are required',
                });
            }
            const zone = await zone_service_1.default.createZone({
                zoneNumber: parseInt(zoneNumber),
                name,
                cityCorporationId: parseInt(cityCorporationId),
                officerName,
                officerDesignation,
                officerSerialNumber,
                officerPhone,
            });
            return res.status(201).json({
                success: true,
                message: 'Zone created successfully',
                data: zone,
            });
        }
        catch (error) {
            console.error('Error creating zone:', error);
            if (error.message.includes('already exists') ||
                error.message.includes('must be between')) {
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
    async updateZone(req, res) {
        try {
            const { id } = req.params;
            const { name, officerName, officerDesignation, officerSerialNumber, officerPhone, status, } = req.body;
            const zone = await zone_service_1.default.updateZone(parseInt(id), {
                name,
                officerName,
                officerDesignation,
                officerSerialNumber,
                officerPhone,
                status,
            });
            return res.status(200).json({
                success: true,
                message: 'Zone updated successfully',
                data: zone,
            });
        }
        catch (error) {
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
    async deleteZone(req, res) {
        try {
            const { id } = req.params;
            await zone_service_1.default.deleteZone(parseInt(id));
            return res.status(200).json({
                success: true,
                message: 'Zone deleted successfully',
            });
        }
        catch (error) {
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
    async getZoneStatistics(req, res) {
        try {
            const { id } = req.params;
            const stats = await zone_service_1.default.getZoneStats(parseInt(id));
            return res.status(200).json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
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
    async getAvailableZoneNumbers(req, res) {
        try {
            const { cityCorporationId } = req.params;
            const ccId = parseInt(cityCorporationId);
            if (isNaN(ccId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid city corporation ID',
                });
            }
            const availableNumbers = await zone_service_1.default.getAvailableZoneNumbers(ccId);
            return res.status(200).json({
                success: true,
                data: availableNumbers,
            });
        }
        catch (error) {
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
exports.default = new ZoneController();
