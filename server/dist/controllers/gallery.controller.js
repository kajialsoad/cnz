"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.galleryController = exports.GalleryController = void 0;
const gallery_service_1 = require("../services/gallery.service");
class GalleryController {
    // Admin: Create image
    async createImage(req, res) {
        try {
            const { title, description, imageUrl, displayOrder } = req.body;
            const createdBy = req.user?.id;
            if (!createdBy) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            if (!title || !imageUrl) {
                res.status(400).json({ error: 'Title and image URL are required' });
                return;
            }
            const image = await gallery_service_1.galleryService.createImage({
                title,
                description,
                imageUrl,
                createdBy,
                displayOrder,
            });
            res.status(201).json(image);
        }
        catch (error) {
            console.error('Error creating gallery image:', error);
            res.status(500).json({ error: 'Failed to create image' });
        }
    }
    // Admin: Update image
    async updateImage(req, res) {
        try {
            const { id } = req.params;
            const { title, description, imageUrl, status, displayOrder } = req.body;
            const image = await gallery_service_1.galleryService.updateImage(parseInt(id), {
                title,
                description,
                imageUrl,
                status: status,
                displayOrder,
            });
            res.json(image);
        }
        catch (error) {
            console.error('Error updating gallery image:', error);
            res.status(500).json({ error: 'Failed to update image' });
        }
    }
    // Admin: Delete image
    async deleteImage(req, res) {
        try {
            const { id } = req.params;
            await gallery_service_1.galleryService.deleteImage(parseInt(id));
            res.json({ success: true, message: 'Image deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting gallery image:', error);
            res.status(500).json({ error: 'Failed to delete image' });
        }
    }
    // Admin: Get all images
    async getAllImagesForAdmin(req, res) {
        try {
            const images = await gallery_service_1.galleryService.getAllImagesForAdmin();
            res.json(images);
        }
        catch (error) {
            console.error('Error fetching gallery images for admin:', error);
            res.status(500).json({ error: 'Failed to fetch images' });
        }
    }
    // Admin: Toggle status
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const image = await gallery_service_1.galleryService.toggleStatus(parseInt(id));
            res.json(image);
        }
        catch (error) {
            console.error('Error toggling image status:', error);
            res.status(500).json({ error: 'Failed to toggle status' });
        }
    }
    // Admin: Reorder images
    async reorderImages(req, res) {
        try {
            const { imageIds } = req.body;
            if (!Array.isArray(imageIds)) {
                res.status(400).json({ error: 'imageIds must be an array' });
                return;
            }
            const result = await gallery_service_1.galleryService.reorderImages(imageIds);
            res.json(result);
        }
        catch (error) {
            console.error('Error reordering images:', error);
            res.status(500).json({ error: 'Failed to reorder images' });
        }
    }
    // User: Get active images
    async getActiveImages(req, res) {
        try {
            const images = await gallery_service_1.galleryService.getActiveImages();
            res.json(images);
        }
        catch (error) {
            console.error('Error fetching active gallery images:', error);
            res.status(500).json({ error: 'Failed to fetch images' });
        }
    }
    // User: Get image by ID
    async getImageById(req, res) {
        try {
            const { id } = req.params;
            const image = await gallery_service_1.galleryService.getImageById(parseInt(id));
            if (!image) {
                res.status(404).json({ error: 'Image not found' });
                return;
            }
            res.json(image);
        }
        catch (error) {
            console.error('Error fetching gallery image:', error);
            res.status(500).json({ error: 'Failed to fetch image' });
        }
    }
}
exports.GalleryController = GalleryController;
exports.galleryController = new GalleryController();
