import { Router, Request, Response } from 'express';
import wardService from '../services/ward.service';

const router = Router();

/**
 * GET /api/wards
 * Public endpoint to get wards by zone (for mobile app)
 * Query params: zoneId (required)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { zoneId } = req.query;

        if (!zoneId) {
            return res.status(400).json({
                success: false,
                message: 'Zone ID is required',
            });
        }

        // Only return active wards for public endpoint
        const wards = await wardService.getWardsByZone(
            parseInt(zoneId as string),
            'ACTIVE'
        );

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
    } catch (error: any) {
        console.error('Error fetching public wards:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch wards',
            error: error.message,
        });
    }
});

export default router;
