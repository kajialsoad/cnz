"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thana_controller_1 = __importDefault(require("../controllers/thana.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'));
// GET /api/admin/thanas - Get thanas by city corporation
router.get('/', thana_controller_1.default.getThanas);
// GET /api/admin/thanas/:id - Get single thana
router.get('/:id', thana_controller_1.default.getThanaById);
// POST /api/admin/thanas - Create new thana
router.post('/', thana_controller_1.default.createThana);
// PUT /api/admin/thanas/:id - Update thana
router.put('/:id', thana_controller_1.default.updateThana);
// GET /api/admin/thanas/:id/statistics - Get statistics
router.get('/:id/statistics', thana_controller_1.default.getThanaStatistics);
exports.default = router;
