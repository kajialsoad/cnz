import { Router, Request, Response } from 'express';
import cityCorporationService from '../services/city-corporation.service';
import wardService from '../services/ward.service';

const router = Router();

/**
 * GET /api/city-corporations
 * Get all active city corporations (no auth required)
 * This is the main endpoint used by mobile app
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const cityCorporations = await cityCorporationService.getCityCorporations('ACTIVE');

        // Return simplified data for public use
        const publicData = cityCorporations.map((cc) => ({
            id: cc.id,
            code: cc.code,
            name: cc.name,
            minWard: cc.minWard,
            maxWard: cc.maxWard,
        }));

        res.json({
            success: true,
            cityCorporations: publicData,
        });
    } catch (error: any) {
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
router.get('/active', async (req: Request, res: Response) => {
    try {
        const cityCorporations = await cityCorporationService.getCityCorporations('ACTIVE');

        // Return simplified data for public use
        const publicData = cityCorporations.map((cc) => ({
            id: cc.id,
            code: cc.code,
            name: cc.name,
            minWard: cc.minWard,
            maxWard: cc.maxWard,
        }));

        res.json({
            success: true,
            cityCorporations: publicData,
        });
    } catch (error: any) {
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
router.get('/:code/thanas', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        const cityCorporation = await cityCorporationService.getCityCorporationByCode(code);

        // Return zones instead of thanas (backward compatibility endpoint)
        const activeZones = cityCorporation.zones.map((zone: any) => ({
            id: zone.id,
            name: zone.name || `Zone ${zone.zoneNumber}`,
        }));

        res.json({
            success: true,
            thanas: activeZones, // Keep 'thanas' key for backward compatibility
        });
    } catch (error: any) {
        console.error('Error fetching thanas:', error);

        if (error.message.includes('not found')) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch thanas',
            });
        }
    }
});

/**
 * GET /api/city-corporations/:code/wards
 * Get all active wards for a city corporation (no auth required)
 * Includes zone information for auto-selection
 */
router.get('/:code/wards', async (req: Request, res: Response) => {
    try {
        const { code } = req.params;

        // Use wardService to fetch wards with city corporation code filter
        const wards = await wardService.getWards({
            cityCorporationCode: code,
            status: 'ACTIVE'
        });

        res.json({
            success: true,
            data: wards.map(ward => ({
                id: ward.id,
                wardNumber: ward.wardNumber,
                zoneId: ward.zoneId,
                zone: {
                    id: ward.zone.id,
                    zoneNumber: ward.zone.zoneNumber,
                    name: ward.zone.name,
                    cityCorporationId: ward.zone.cityCorporation.id,
                },
            })),
        });
    } catch (error: any) {
        console.error('Error fetching wards by city:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wards',
        });
    }
});

export default router;
