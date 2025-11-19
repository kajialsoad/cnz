"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = getAllCategories;
exports.getCategoryById = getCategoryById;
exports.getSubcategories = getSubcategories;
exports.validateCategorySubcategory = validateCategorySubcategory;
const category_service_1 = require("../services/category.service");
/**
 * Get all categories with subcategories
 * GET /api/categories
 */
async function getAllCategories(_req, res) {
    try {
        const categories = category_service_1.categoryService.getAllCategories();
        res.status(200).json({
            success: true,
            data: {
                categories,
                summary: category_service_1.categoryService.getCategorySummary()
            }
        });
    }
    catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
}
/**
 * Get a specific category by ID
 * GET /api/categories/:categoryId
 */
async function getCategoryById(req, res) {
    try {
        const { categoryId } = req.params;
        const category = category_service_1.categoryService.getCategoryById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: `Category '${categoryId}' not found`
            });
        }
        res.status(200).json({
            success: true,
            data: { category }
        });
    }
    catch (error) {
        console.error('Error in getCategoryById:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
}
/**
 * Get subcategories for a specific category
 * GET /api/categories/:categoryId/subcategories
 */
async function getSubcategories(req, res) {
    try {
        const { categoryId } = req.params;
        // Check if category exists
        if (!category_service_1.categoryService.categoryExists(categoryId)) {
            return res.status(404).json({
                success: false,
                message: `Category '${categoryId}' not found`
            });
        }
        const subcategories = category_service_1.categoryService.getSubcategories(categoryId);
        res.status(200).json({
            success: true,
            data: {
                categoryId,
                subcategories
            }
        });
    }
    catch (error) {
        console.error('Error in getSubcategories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subcategories'
        });
    }
}
/**
 * Validate category and subcategory combination
 * POST /api/categories/validate
 * Body: { category: string, subcategory: string }
 */
async function validateCategorySubcategory(req, res) {
    try {
        const { category, subcategory } = req.body;
        if (!category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Category and subcategory are required'
            });
        }
        const isValid = category_service_1.categoryService.validateCategorySubcategory(category, subcategory);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category and subcategory combination',
                data: {
                    category,
                    subcategory,
                    valid: false,
                    validCategories: category_service_1.categoryService.getAllCategoryIds(),
                    validSubcategories: category_service_1.categoryService.getAllSubcategoryIds(category)
                }
            });
        }
        res.status(200).json({
            success: true,
            message: 'Valid category and subcategory combination',
            data: {
                category,
                subcategory,
                valid: true,
                categoryName: category_service_1.categoryService.getCategoryName(category, 'en'),
                categoryNameBn: category_service_1.categoryService.getCategoryName(category, 'bn'),
                subcategoryName: category_service_1.categoryService.getSubcategoryName(category, subcategory, 'en'),
                subcategoryNameBn: category_service_1.categoryService.getSubcategoryName(category, subcategory, 'bn')
            }
        });
    }
    catch (error) {
        console.error('Error in validateCategorySubcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate category and subcategory'
        });
    }
}
