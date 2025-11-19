import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';

/**
 * Get all categories with subcategories
 * GET /api/categories
 */
export async function getAllCategories(_req: Request, res: Response) {
    try {
        const categories = categoryService.getAllCategories();

        res.status(200).json({
            success: true,
            data: {
                categories,
                summary: categoryService.getCategorySummary()
            }
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
 * Get a specific category by ID
 * GET /api/categories/:categoryId
 */
export async function getCategoryById(req: Request, res: Response) {
    try {
        const { categoryId } = req.params;

        const category = categoryService.getCategoryById(categoryId);

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
    } catch (error) {
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
export async function getSubcategories(req: Request, res: Response) {
    try {
        const { categoryId } = req.params;

        // Check if category exists
        if (!categoryService.categoryExists(categoryId)) {
            return res.status(404).json({
                success: false,
                message: `Category '${categoryId}' not found`
            });
        }

        const subcategories = categoryService.getSubcategories(categoryId);

        res.status(200).json({
            success: true,
            data: {
                categoryId,
                subcategories
            }
        });
    } catch (error) {
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
export async function validateCategorySubcategory(req: Request, res: Response) {
    try {
        const { category, subcategory } = req.body;

        if (!category || !subcategory) {
            return res.status(400).json({
                success: false,
                message: 'Category and subcategory are required'
            });
        }

        const isValid = categoryService.validateCategorySubcategory(category, subcategory);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category and subcategory combination',
                data: {
                    category,
                    subcategory,
                    valid: false,
                    validCategories: categoryService.getAllCategoryIds(),
                    validSubcategories: categoryService.getAllSubcategoryIds(category)
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
                categoryName: categoryService.getCategoryName(category, 'en'),
                categoryNameBn: categoryService.getCategoryName(category, 'bn'),
                subcategoryName: categoryService.getSubcategoryName(category, subcategory, 'en'),
                subcategoryNameBn: categoryService.getSubcategoryName(category, subcategory, 'bn')
            }
        });
    } catch (error) {
        console.error('Error in validateCategorySubcategory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate category and subcategory'
        });
    }
}
