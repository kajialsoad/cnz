"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zone_controller_1 = __importDefault(require("../controllers/zone.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'));
// GET /api/admin/zones - Get zones by city corporation
router.get('/', zone_controller_1.default.getZones);
// GET /api/admin/zones/:id - Get single zone
router.get('/:id', zone_controller_1.default.getZoneById);
// POST /api/admin/zones - Create new zone
router.post('/', zone_controller_1.default.createZone);
// PUT /api/admin/zones/:id - Update zone
router.put('/:id', zone_controller_1.default.updateZone);
// DELETE /api/admin/zones/:id - Delete zone
router.delete('/:id', zone_controller_1.default.deleteZone);
// GET /api/admin/zones/:id/statistics - Get statistics
router.get('/:id/statistics', zone_controller_1.default.getZoneStatistics);
exports.default = router;
