"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ward_controller_1 = __importDefault(require("../controllers/ward.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'));
// GET /api/admin/wards - Get wards by zone
router.get('/', ward_controller_1.default.getWards);
// GET /api/admin/wards/available/:zoneId - Get available ward numbers for zone
router.get('/available/:zoneId', ward_controller_1.default.getAvailableWardNumbers);
// GET /api/admin/wards/limit/:zoneId - Check ward limit for zone
router.get('/limit/:zoneId', ward_controller_1.default.checkWardLimit);
// GET /api/admin/wards/:id - Get single ward
router.get('/:id', ward_controller_1.default.getWardById);
// POST /api/admin/wards - Create new ward
router.post('/', ward_controller_1.default.createWard);
// POST /api/admin/wards/bulk - Bulk create wards
router.post('/bulk', ward_controller_1.default.createWardsBulk);
// PUT /api/admin/wards/:id - Update ward
router.put('/:id', ward_controller_1.default.updateWard);
// DELETE /api/admin/wards/:id - Delete ward
router.delete('/:id', ward_controller_1.default.deleteWard);
// GET /api/admin/wards/:id/statistics - Get statistics
router.get('/:id/statistics', ward_controller_1.default.getWardStatistics);
exports.default = router;
