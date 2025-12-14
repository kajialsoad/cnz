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
 * @route   POST /api/dashboard/stats/refresh
 * @desc    Refresh dashboard statistics cache
 * @access  Private (Master Admin only)
 */
router.post('/stats/refresh', dashboardController.refreshStats.bind(dashboardController));

export default router;
