"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const router = (0, express_1.Router)();
/**
 * Category Routes
 * Base path: /api/categories
 */
// Get all categories
router.get('/', category_controller_1.getAllCategories);
// Validate category and subcategory combination
router.post('/validate', category_controller_1.validateCategorySubcategory);
// Get specific category by ID
router.get('/:categoryId', category_controller_1.getCategoryById);
// Get subcategories for a category
router.get('/:categoryId/subcategories', category_controller_1.getSubcategories);
exports.default = router;
