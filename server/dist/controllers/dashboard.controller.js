"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = exports.DashboardController = void 0;
const statistics_service_1 = require("../services/statistics.service");
const dashboard_analytics_service_1 = require("../services/dashboard-analytics.service");
const client_1 = require("@prisma/client");
class DashboardController {
    /**
     * Get dashboard statistics with role-based filtering
     * GET /api/dashboard/stats
     */
    async getDashboardStats(req, res, next) {
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
                cityCorporationCode: req.query.cityCorporationCode,
                zoneId: req.query.zoneId ? parseInt(req.query.zoneId) : undefined,
                wardId: req.query.wardId ? parseInt(req.query.wardId) : undefined,
                startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
                endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            };
            // Get dashboard statistics with role-based filtering
            const stats = await statistics_service_1.statisticsService.getDashboardStats(filters, {
                id: user.id,
                role: user.role,
                zoneId: user.zoneId,
                wardId: user.wardId,
            });
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get dashboard statistics by geography (NEW)
     * GET /api/admin/dashboard/statistics
     */
    async getStatisticsByGeography(req, res, next) {
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
            // Get geographical filters from query parameters
            const filters = {
                cityCorporationCode: req.query.cityCorporationCode,
                zoneId: req.query.zoneId ? parseInt(req.query.zoneId) : undefined,
                wardId: req.query.wardId ? parseInt(req.query.wardId) : undefined,
            };
            // Get statistics with geographical filtering
            const stats = await dashboard_analytics_service_1.dashboardAnalyticsService.getStatisticsByGeography({
                id: user.id,
                role: user.role,
                cityCorporationCode: user.cityCorporationCode,
                zoneId: user.zoneId,
                wardId: user.wardId,
            }, filters);
            res.json({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get City Corporation comparison (MASTER_ADMIN only)
     * GET /api/admin/dashboard/city-corporation-comparison
     */
    async getCityCorporationComparison(req, res, next) {
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
            // Only MASTER_ADMIN can access this endpoint
            if (user.role !== client_1.users_role.MASTER_ADMIN) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: 'Only Master Admin can access City Corporation comparison',
                    },
                });
                return;
            }
            // Get comparison data
            const comparison = await dashboard_analytics_service_1.dashboardAnalyticsService.getCityCorporationComparison({
                id: user.id,
                role: user.role,
                cityCorporationCode: user.cityCorporationCode,
                zoneId: user.zoneId,
                wardId: user.wardId,
            });
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get zone comparison within a city corporation
     * GET /api/admin/dashboard/zone-comparison
     */
    async getZoneComparison(req, res, next) {
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
            const cityCorporationCode = req.query.cityCorporationCode;
            if (!cityCorporationCode) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'City Corporation code is required',
                    },
                });
                return;
            }
            // Get zone comparison
            const comparison = await dashboard_analytics_service_1.dashboardAnalyticsService.getZoneComparison({
                id: user.id,
                role: user.role,
                cityCorporationCode: user.cityCorporationCode,
                zoneId: user.zoneId,
                wardId: user.wardId,
            }, cityCorporationCode);
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Refresh dashboard statistics cache
     * POST /api/dashboard/stats/refresh
     */
    async refreshStats(req, res, next) {
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
            if (user.role !== client_1.users_role.MASTER_ADMIN) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'AUTH_INSUFFICIENT_PERMISSIONS',
                        message: 'Only Master Admin can refresh statistics cache',
                    },
                });
                return;
            }
            await statistics_service_1.statisticsService.refreshStatistics();
            res.json({
                success: true,
                message: 'Statistics cache refreshed successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.dashboardController = new DashboardController();
