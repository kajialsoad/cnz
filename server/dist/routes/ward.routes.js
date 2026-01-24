"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ward_controller_1 = __importDefault(require("../controllers/ward.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/wards - Get wards by zone
router.get('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.getWards);
// GET /api/admin/wards/available/:zoneId - Get available ward numbers for zone
router.get('/available/:zoneId', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.getAvailableWardNumbers);
// GET /api/admin/wards/limit/:zoneId - Check ward limit for zone
router.get('/limit/:zoneId', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.checkWardLimit);
// GET /api/admin/wards/:id/statistics - Get statistics (must be before /:id to avoid route conflict)
router.get('/:id/statistics', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.getWardStatistics);
// GET /api/admin/wards/:id - Get single ward
router.get('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.getWardById);
// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/wards - Create new ward
router.post('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.createWard);
// POST /api/admin/wards/bulk - Bulk create wards
router.post('/bulk', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.createWardsBulk);
// PUT /api/admin/wards/:id - Update ward
router.put('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.updateWard);
// DELETE /api/admin/wards/:id - Delete ward
router.delete('/:id', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), ward_controller_1.default.deleteWard);
exports.default = router;
