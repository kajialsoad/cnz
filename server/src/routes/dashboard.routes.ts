import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// All dashboard routes require authentication
router.use(authGuard);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics with role-based filtering
 * @access  Private (All authenticated users)
 * @query   cityCorporationCode - Filter by city corporation (optional)
 * @query   zoneId - Filter by zone (optional)
 * @query   wardId - Filter by ward (optional)
 * @query   startDate - Filter by start date (optional)
 * @query   endDate - Filter by end date (optional)
 */
router.get('/stats', dashboardController.getDashboardStats.bind(dashboardController));

/**
 * @route   GET /api/admin/dashboard/statistics
 * @desc    Get dashboard statistics by geography with role-based filtering
 * @access  Private (Admin users)
 * @query   cityCorporationCode - Filter by city corporation (optional)
 * @query   zoneId - Filter by zone (optional)
 * @query   wardId - Filter by ward (optional)
 */
router.get('/statistics', dashboardController.getStatisticsByGeography.bind(dashboardController));

/**
 * @route   GET /api/admin/dashboard/city-corporation-comparison
 * @desc    Get City Corporation comparison statistics
 * @access  Private (Master Admin only)
 */
router.get('/city-corporation-comparison', dashboardController.getCityCorporationComparison.bind(dashboardController));

/**
 * @route   GET /api/admin/dashboard/zone-comparison
 * @desc    Get zone comparison within a city corporation
 * @access  Private (Admin users)
 * @query   cityCorporationCode - City Corporation code (required)
 */
router.get('/zone-comparison', dashboardController.getZoneComparison.bind(dashboardController));

/**
 * @route   POST /api/dashboard/stats/refresh
 * @desc    Refresh dashboard statistics cache
 * @access  Private (Master Admin only)
 */
router.post('/stats/refresh', dashboardController.refreshStats.bind(dashboardController));

export default router;
