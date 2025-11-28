"use strict";
/**
 * Monitoring Routes
 *
 * Routes for accessing upload monitoring statistics and logs.
 * These routes are protected and only accessible to admins.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monitoring_controller_1 = require("../controllers/monitoring.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/monitoring/statistics
 * @desc    Get upload statistics
 * @access  Admin only
 * @query   since - Optional ISO date string to filter statistics
 */
router.get('/statistics', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'), monitoring_controller_1.monitoringController.getStatistics.bind(monitoring_controller_1.monitoringController));
/**
 * @route   GET /api/monitoring/daily-summary
 * @desc    Get daily upload summary
 * @access  Admin only
 * @query   date - Optional ISO date string for specific day
 */
router.get('/daily-summary', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'), monitoring_controller_1.monitoringController.getDailySummary.bind(monitoring_controller_1.monitoringController));
/**
 * @route   GET /api/monitoring/cloudinary-usage
 * @desc    Get Cloudinary usage statistics
 * @access  Admin only
 * @query   since - Optional ISO date string to filter usage
 */
router.get('/cloudinary-usage', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'), monitoring_controller_1.monitoringController.getCloudinaryUsage.bind(monitoring_controller_1.monitoringController));
/**
 * @route   GET /api/monitoring/recent-errors
 * @desc    Get recent upload errors
 * @access  Admin only
 * @query   limit - Optional number of errors to return (default: 10)
 */
router.get('/recent-errors', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'), monitoring_controller_1.monitoringController.getRecentErrors.bind(monitoring_controller_1.monitoringController));
/**
 * @route   GET /api/monitoring/export
 * @desc    Export statistics as JSON file
 * @access  Admin only
 * @query   since - Optional ISO date string to filter export
 */
router.get('/export', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN'), monitoring_controller_1.monitoringController.exportStatistics.bind(monitoring_controller_1.monitoringController));
exports.default = router;
