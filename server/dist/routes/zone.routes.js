"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zone_controller_1 = __importDefault(require("../controllers/zone.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/zones/available/:cityCorporationId - Get available zone numbers
router.get('/available/:cityCorporationId', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.getAvailableZoneNumbers);
// GET /api/admin/zones - Get zones by city corporation
router.get('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.getZones);
// GET /api/admin/zones/:id/statistics - Get statistics (must be before /:id to avoid route conflict)
router.get('/:id/statistics', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.getZoneStatistics);
// GET /api/admin/zones/:id - Get single zone
router.get('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.getZoneById);
// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/zones - Create new zone
router.post('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.createZone);
// PUT /api/admin/zones/:id - Update zone
router.put('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.updateZone);
// DELETE /api/admin/zones/:id - Delete zone
router.delete('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), zone_controller_1.default.deleteZone);
exports.default = router;
