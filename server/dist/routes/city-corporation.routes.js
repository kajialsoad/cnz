"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_corporation_controller_1 = __importDefault(require("../controllers/city-corporation.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET routes - Allow ADMIN, SUPER_ADMIN, and MASTER_ADMIN (read-only for ADMIN)
// GET /api/admin/city-corporations - Get all city corporations
router.get('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), city_corporation_controller_1.default.getCityCorporations);
// GET /api/admin/city-corporations/:code/statistics - Get statistics (must be before /:code to avoid route conflict)
router.get('/:code/statistics', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), city_corporation_controller_1.default.getCityCorporationStatistics);
// GET /api/admin/city-corporations/:code - Get single city corporation
router.get('/:code', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'), city_corporation_controller_1.default.getCityCorporationByCode);
// Write routes - Only SUPER_ADMIN and MASTER_ADMIN
// POST /api/admin/city-corporations - Create new city corporation
router.post('/', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), city_corporation_controller_1.default.createCityCorporation);
// PUT /api/admin/city-corporations/:code - Update city corporation
router.put('/:code', auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'), city_corporation_controller_1.default.updateCityCorporation);
exports.default = router;
