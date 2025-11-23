import { Router, Request, Response } from 'express';
import cityCorporationService from '../services/city-corporation.service';

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

        // Return only active thanas
        const activeThanas = cityCorporation.thanas.map((thana) => ({
            id: thana.id,
            name: thana.name,
        }));

        res.json({
            success: true,
            thanas: activeThanas,
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

export default router;
