import { Router } from 'express';
import { galleryController } from '../controllers/gallery.controller';
import { authGuard } from '../middlewares/auth.middleware';

const router = Router();

// Admin routes
router.get('/admin/images', authGuard, galleryController.getAllImagesForAdmin.bind(galleryController));
router.post('/admin/images', authGuard, galleryController.createImage.bind(galleryController));
router.put('/admin/images/:id', authGuard, galleryController.updateImage.bind(galleryController));
router.post('/admin/images/:id/toggle-status', authGuard, galleryController.toggleStatus.bind(galleryController));
router.post('/admin/images/reorder', authGuard, galleryController.reorderImages.bind(galleryController));
router.delete('/admin/images/:id', authGuard, galleryController.deleteImage.bind(galleryController));

// Public routes (for mobile app users)
router.get('/images', authGuard, galleryController.getActiveImages.bind(galleryController));
router.get('/images/:id', authGuard, galleryController.getImageById.bind(galleryController));

export default router;
