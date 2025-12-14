import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { statisticsService } from '../services/statistics.service';
import { users_role } from '@prisma/client';

export class DashboardController {
    /**
     * Get dashboard statistics with role-based filtering
     * GET /api/dashboard/stats
     */
    async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;

            if (!user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_USER_NOT_FOUND',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            // Get filters from query parameters
            const filters = {
                cityCorporationCode: req.query.cityCorporationCode as string | undefined,
                zoneId: req.query.zoneId ? parseInt(req.query.zoneId as string) : undefined,
                wardId: req.query.wardId ? parseInt(req.query.wardId as string) : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            };

            // Get dashboard statistics with role-based filtering
            const stats = await statisticsService.getDashboardStats(filters, {
                id: user.id,
                role: user.role as users_role,
                zoneId: user.zoneId,
                wardId: user.wardId,
            });

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh dashboard statistics cache
     * POST /api/dashboard/stats/refresh
     */
    async refreshStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = req.user;

            if (!user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTH_USER_NOT_FOUND',
                        message: 'User not authenticated',
                    },
                });
                return;
            }

            // Only MASTER_ADMIN can refresh cache
            if (user.role !== users_role.MASTER_ADMIN) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: 'Only Master Admin can refresh statistics cache',
                    },
                });
                return;
            }

            await statisticsService.refreshStatistics();

            res.json({
                success: true,
                message: 'Statistics cache refreshed successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();
