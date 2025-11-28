/**
 * Monitoring Routes
 * 
 * Routes for accessing upload monitoring statistics and logs.
 * These routes are protected and only accessible to admins.
 */

import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring.controller';
import { authGuard, rbacGuard } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/monitoring/statistics
 * @desc    Get upload statistics
 * @access  Admin only
 * @query   since - Optional ISO date string to filter statistics
 */
router.get(
    '/statistics',
    authGuard,
    rbacGuard('ADMIN', 'SUPER_ADMIN'),
    monitoringController.getStatistics.bind(monitoringController)
);

/**
 * @route   GET /api/monitoring/daily-summary
 * @desc    Get daily upload summary
 * @access  Admin only
 * @query   date - Optional ISO date string for specific day
 */
router.get(
    '/daily-summary',
    authGuard,
    rbacGuard('ADMIN', 'SUPER_ADMIN'),
    monitoringController.getDailySummary.bind(monitoringController)
);

/**
 * @route   GET /api/monitoring/cloudinary-usage
 * @desc    Get Cloudinary usage statistics
 * @access  Admin only
 * @query   since - Optional ISO date string to filter usage
 */
router.get(
    '/cloudinary-usage',
    authGuard,
    rbacGuard('ADMIN', 'SUPER_ADMIN'),
    monitoringController.getCloudinaryUsage.bind(monitoringController)
);

/**
 * @route   GET /api/monitoring/recent-errors
 * @desc    Get recent upload errors
 * @access  Admin only
 * @query   limit - Optional number of errors to return (default: 10)
 */
router.get(
    '/recent-errors',
    authGuard,
    rbacGuard('ADMIN', 'SUPER_ADMIN'),
    monitoringController.getRecentErrors.bind(monitoringController)
);

/**
 * @route   GET /api/monitoring/export
 * @desc    Export statistics as JSON file
 * @access  Admin only
 * @query   since - Optional ISO date string to filter export
 */
router.get(
    '/export',
    authGuard,
    rbacGuard('ADMIN', 'SUPER_ADMIN'),
    monitoringController.exportStatistics.bind(monitoringController)
);

export default router;
