"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = createCategory;
exports.getAllCategories = getAllCategories;
exports.getCategoryTree = getCategoryTree;
exports.getCategoryById = getCategoryById;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.toggleCategoryStatus = toggleCategoryStatus;
const notice_category_service_1 = __importDefault(require("../services/notice-category.service"));
/**
 * Create a new notice category
 * POST /api/admin/notice-categories
 */
async function createCategory(req, res) {
    try {
        const category = await notice_category_service_1.default.createCategory(req.body);
        res.status(201).json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error in createCategory:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to create category'
        });
    }
}
/**
 * Get all notice categories
 * GET /api/admin/notice-categories
 */
async function getAllCategories(req, res) {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const categories = await notice_category_service_1.default.getAllCategories(includeInactive);
        res.status(200).json({
            success: true,
            data: categories
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
 * Get notice category tree
 * GET /api/notice-categories/tree
 */
async function getCategoryTree(_req, res) {
    try {
        const tree = await notice_category_service_1.default.getCategoryTree();
        res.status(200).json({
            success: true,
            data: tree
        });
    }
    catch (error) {
        console.error('Error in getCategoryTree:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category tree'
        });
    }
}
/**
 * Get category by ID
 * GET /api/notice-categories/:id
 */
async function getCategoryById(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        const category = await notice_category_service_1.default.getCategoryById(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }
        res.status(200).json({
            success: true,
            data: category
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
 * Update category
 * PUT /api/admin/notice-categories/:id
 */
async function updateCategory(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        const category = await notice_category_service_1.default.updateCategory(id, req.body);
        res.status(200).json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error in updateCategory:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update category'
        });
    }
}
/**
 * Delete category
 * DELETE /api/admin/notice-categories/:id
 */
async function deleteCategory(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        await notice_category_service_1.default.deleteCategory(id);
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    }
    catch (error) {
        console.error('Error in deleteCategory:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete category'
        });
    }
}
/**
 * Toggle category status
 * PATCH /api/admin/notice-categories/:id/toggle
 */
async function toggleCategoryStatus(req, res) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }
        const category = await notice_category_service_1.default.toggleCategoryStatus(id);
        res.status(200).json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error in toggleCategoryStatus:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to toggle category status'
        });
    }
}
