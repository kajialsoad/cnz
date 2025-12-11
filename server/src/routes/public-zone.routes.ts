import { Router, Request, Response } from 'express';
import zoneService from '../services/zone.service';

const router = Router();

/**
 * GET /api/zones
 * Public endpoint to get zones by city corporation (for mobile app)
 * Query params: cityCorporationId (required)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { cityCorporationId } = req.query;

        if (!cityCorporationId) {
            return res.status(400).json({
                success: false,
                message: 'City Corporation ID is required',
            });
        }

        // Only return active zones for public endpoint
        const zones = await zoneService.getZonesByCityCorporation(
            parseInt(cityCorporationId as string),
            'ACTIVE'
        );

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
    } catch (error: any) {
        console.error('Error fetching public zones:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch zones',
            error: error.message,
        });
    }
});

export default router;
