"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_corporation_service_1 = __importDefault(require("../services/city-corporation.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/city-corporations
 * Get all active city corporations (no auth required)
 * This is the main endpoint used by mobile app
 */
router.get('/', async (req, res) => {
    try {
        const cityCorporations = await city_corporation_service_1.default.getCityCorporations('ACTIVE');
        // Return simplified data for public use
        const publicData = cityCorporations.map((cc) => ({
            code: cc.code,
            name: cc.name,
            minWard: cc.minWard,
            maxWard: cc.maxWard,
        }));
        res.json({
            success: true,
            cityCorporations: publicData,
        });
    }
    catch (error) {
        console.error('Error fetching active city corporations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch city corporations',
        });
    }
});
/**
 * GET /api/city-corporations/active
 * Get all active city corporations (no auth required)
 * Alias for backward compatibility
 */
router.get('/active', async (req, res) => {
    try {
        const cityCorporations = await city_corporation_service_1.default.getCityCorporations('ACTIVE');
        // Return simplified data for public use
        const publicData = cityCorporations.map((cc) => ({
            code: cc.code,
            name: cc.name,
            minWard: cc.minWard,
            maxWard: cc.maxWard,
        }));
        res.json({
            success: true,
            cityCorporations: publicData,
        });
    }
    catch (error) {
        console.error('Error fetching active city corporations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch city corporations',
        });
    }
});
/**
 * GET /api/city-corporations/:code/thanas
 * Get all active thanas for a city corporation (no auth required)
 */
router.get('/:code/thanas', async (req, res) => {
    try {
        const { code } = req.params;
        const cityCorporation = await city_corporation_service_1.default.getCityCorporationByCode(code);
        // Return only active thanas
        const activeThanas = cityCorporation.thanas.map((thana) => ({
            id: thana.id,
            name: thana.name,
        }));
        res.json({
            success: true,
            thanas: activeThanas,
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
            });
        }
    }
});
exports.default = router;
