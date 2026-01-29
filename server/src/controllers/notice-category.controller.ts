import { Request, Response } from 'express';
import noticeCategoryService from '../services/notice-category.service';

/**
 * Create a new notice category
 * POST /api/admin/notice-categories
 */
export async function createCategory(req: Request, res: Response) {
    try {
        const category = await noticeCategoryService.createCategory(req.body);
        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
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
export async function getAllCategories(req: Request, res: Response) {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const categories = await noticeCategoryService.getAllCategories(includeInactive);
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
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
export async function getCategoryTree(_req: Request, res: Response) {
    try {
        const tree = await noticeCategoryService.getCategoryTree();
        res.status(200).json({
            success: true,
            data: tree
        });
    } catch (error) {
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
export async function getCategoryById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const category = await noticeCategoryService.getCategoryById(id);
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
    } catch (error) {
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
export async function updateCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const category = await noticeCategoryService.updateCategory(id, req.body);
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
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
export async function deleteCategory(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        await noticeCategoryService.deleteCategory(id);
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
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
export async function toggleCategoryStatus(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const category = await noticeCategoryService.toggleCategoryStatus(id);
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error in toggleCategoryStatus:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to toggle category status'
        });
    }
}
