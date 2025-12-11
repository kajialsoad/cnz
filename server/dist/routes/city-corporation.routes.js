"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_corporation_controller_1 = __importDefault(require("../controllers/city-corporation.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// All routes require SUPER_ADMIN or MASTER_ADMIN role
router.use(auth_middleware_1.authGuard, (0, auth_middleware_1.rbacGuard)('SUPER_ADMIN', 'MASTER_ADMIN'));
// GET /api/admin/city-corporations - Get all city corporations
router.get('/', city_corporation_controller_1.default.getCityCorporations);
// GET /api/admin/city-corporations/:code - Get single city corporation
router.get('/:code', city_corporation_controller_1.default.getCityCorporationByCode);
// POST /api/admin/city-corporations - Create new city corporation
router.post('/', city_corporation_controller_1.default.createCityCorporation);
// PUT /api/admin/city-corporations/:code - Update city corporation
router.put('/:code', city_corporation_controller_1.default.updateCityCorporation);
// GET /api/admin/city-corporations/:code/statistics - Get statistics
router.get('/:code/statistics', city_corporation_controller_1.default.getCityCorporationStatistics);
exports.default = router;
