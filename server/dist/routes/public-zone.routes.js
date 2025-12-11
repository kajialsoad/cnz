"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zone_service_1 = __importDefault(require("../services/zone.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/zones
 * Public endpoint to get zones by city corporation (for mobile app)
 * Query params: cityCorporationId (required)
 */
router.get('/', async (req, res) => {
    try {
        const { cityCorporationId } = req.query;
        if (!cityCorporationId) {
            return res.status(400).json({
                success: false,
                message: 'City Corporation ID is required',
            });
        }
        // Only return active zones for public endpoint
        const zones = await zone_service_1.default.getZonesByCityCorporation(parseInt(cityCorporationId), 'ACTIVE');
        // Cache for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(200).json({
            success: true,
            data: zones.map(zone => ({
                id: zone.id,
                zoneNumber: zone.zoneNumber,
                name: zone.name,
                cityCorporationId: zone.cityCorporationId,
                cityCorporation: zone.cityCorporation,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching public zones:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch zones',
            error: error.message,
        });
    }
});
exports.default = router;
