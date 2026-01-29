import { Router } from 'express';
import { authGuard } from '../middlewares/auth.middleware';
import {
    createCategory,
    getAllCategories,
    getCategoryTree,
    getCategoryById,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} from '../controllers/notice-category.controller';

const router = Router();

// Public routes - MUST come before admin routes
router.get('/tree', getCategoryTree);

// Admin routes (protected)
router.post('/', authGuard, createCategory);
router.get('/', getAllCategories); // Make public for mobile app
router.put('/:id', authGuard, updateCategory);
router.patch('/:id/toggle', toggleCategoryStatus);
router.delete('/:id', authGuard, deleteCategory);

// Public routes with :id parameter - MUST come last
router.get('/:id', getCategoryById);

export default router;
