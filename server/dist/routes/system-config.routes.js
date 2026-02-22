"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const system_config_controller_1 = require("../controllers/system-config.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Get all public configs (Open access)
router.get('/', system_config_controller_1.systemConfigController.getPublicConfigs);
// Get specific config (Authenticated)
router.get('/:key', auth_middleware_1.authGuard, system_config_controller_1.systemConfigController.getConfig);
exports.default = router;
