"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_middleware_1.authGuard);
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
router.get('/stats', dashboard_controller_1.dashboardController.getDashboardStats.bind(dashboard_controller_1.dashboardController));
/**
 * @route   GET /api/admin/dashboard/statistics
 * @desc    Get dashboard statistics by geography with role-based filtering
 * @access  Private (Admin users)
 * @query   cityCorporationCode - Filter by city corporation (optional)
 * @query   zoneId - Filter by zone (optional)
 * @query   wardId - Filter by ward (optional)
 */
router.get('/statistics', dashboard_controller_1.dashboardController.getStatisticsByGeography.bind(dashboard_controller_1.dashboardController));
/**
 * @route   GET /api/admin/dashboard/city-corporation-comparison
 * @desc    Get City Corporation comparison statistics
 * @access  Private (Master Admin only)
 */
router.get('/city-corporation-comparison', dashboard_controller_1.dashboardController.getCityCorporationComparison.bind(dashboard_controller_1.dashboardController));
/**
 * @route   GET /api/admin/dashboard/zone-comparison
 * @desc    Get zone comparison within a city corporation
 * @access  Private (Admin users)
 * @query   cityCorporationCode - City Corporation code (required)
 */
router.get('/zone-comparison', dashboard_controller_1.dashboardController.getZoneComparison.bind(dashboard_controller_1.dashboardController));
/**
 * @route   POST /api/dashboard/stats/refresh
 * @desc    Refresh dashboard statistics cache
 * @access  Private (Master Admin only)
 */
router.post('/stats/refresh', dashboard_controller_1.dashboardController.refreshStats.bind(dashboard_controller_1.dashboardController));
exports.default = router;
