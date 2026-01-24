"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ward_service_1 = __importDefault(require("../services/ward.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/wards
 * Public endpoint to get wards by zone (for mobile app)
 * Query params: zoneId (required)
 */
router.get('/', async (req, res) => {
    try {
        const { zoneId } = req.query;
        if (!zoneId) {
            return res.status(400).json({
                success: false,
                message: 'Zone ID is required',
            });
        }
        // Only return active wards for public endpoint
        const wards = await ward_service_1.default.getWardsByZone(parseInt(zoneId), 'ACTIVE');
        // Cache for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(200).json({
            success: true,
            data: wards.map(ward => ({
                id: ward.id,
                wardNumber: ward.wardNumber,
                zoneId: ward.zoneId,
                zone: {
                    id: ward.zone.id,
                    zoneNumber: ward.zone.zoneNumber,
                    name: ward.zone.name,
                    cityCorporation: ward.zone.cityCorporation,
                },
            })),
        });
    }
    catch (error) {
        console.error('Error fetching public wards:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch wards',
            error: error.message,
        });
    }
});
exports.default = router;
