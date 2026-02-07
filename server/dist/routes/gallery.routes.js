"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gallery_controller_1 = require("../controllers/gallery.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Admin routes
router.get('/admin/images', auth_middleware_1.authGuard, gallery_controller_1.galleryController.getAllImagesForAdmin.bind(gallery_controller_1.galleryController));
router.post('/admin/images', auth_middleware_1.authGuard, gallery_controller_1.galleryController.createImage.bind(gallery_controller_1.galleryController));
router.put('/admin/images/:id', auth_middleware_1.authGuard, gallery_controller_1.galleryController.updateImage.bind(gallery_controller_1.galleryController));
router.post('/admin/images/:id/toggle-status', auth_middleware_1.authGuard, gallery_controller_1.galleryController.toggleStatus.bind(gallery_controller_1.galleryController));
router.post('/admin/images/reorder', auth_middleware_1.authGuard, gallery_controller_1.galleryController.reorderImages.bind(gallery_controller_1.galleryController));
router.delete('/admin/images/:id', auth_middleware_1.authGuard, gallery_controller_1.galleryController.deleteImage.bind(gallery_controller_1.galleryController));
// Public routes (for mobile app users)
router.get('/images', auth_middleware_1.authGuard, gallery_controller_1.galleryController.getActiveImages.bind(gallery_controller_1.galleryController));
router.get('/images/:id', auth_middleware_1.authGuard, gallery_controller_1.galleryController.getImageById.bind(gallery_controller_1.galleryController));
exports.default = router;
