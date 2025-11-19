import { Router } from 'express';
import {
    getAllCategories,
    getCategoryById,
    getSubcategories,
    validateCategorySubcategory
} from '../controllers/category.controller';

const router = Router();

/**
 * Category Routes
 * Base path: /api/categories
 */

// Get all categories
router.get('/', getAllCategories);

// Validate category and subcategory combination
router.post('/validate', validateCategorySubcategory);

// Get specific category by ID
router.get('/:categoryId', getCategoryById);

// Get subcategories for a category
router.get('/:categoryId/subcategories', getSubcategories);

export default router;
