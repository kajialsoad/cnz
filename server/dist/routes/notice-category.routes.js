"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notice_category_controller_1 = require("../controllers/notice-category.controller");
const router = (0, express_1.Router)();
// Public routes - MUST come before admin routes
router.get('/tree', notice_category_controller_1.getCategoryTree);
// Admin routes (protected)
router.post('/', auth_middleware_1.authGuard, notice_category_controller_1.createCategory);
router.get('/', notice_category_controller_1.getAllCategories); // Make public for mobile app
router.put('/:id', auth_middleware_1.authGuard, notice_category_controller_1.updateCategory);
router.patch('/:id/toggle', notice_category_controller_1.toggleCategoryStatus);
router.delete('/:id', auth_middleware_1.authGuard, notice_category_controller_1.deleteCategory);
// Public routes with :id parameter - MUST come last
router.get('/:id', notice_category_controller_1.getCategoryById);
exports.default = router;
