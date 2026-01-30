import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { galleryService } from '../services/gallery.service';
import { GalleryImageStatus } from '@prisma/client';

export class GalleryController {
    // Admin: Create image
    async createImage(req: AuthRequest, res: Response): Promise<void> {
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

            const image = await galleryService.createImage({
                title,
                description,
                imageUrl,
                createdBy,
                displayOrder,
            });

            res.status(201).json(image);
        } catch (error) {
            console.error('Error creating gallery image:', error);
            res.status(500).json({ error: 'Failed to create image' });
        }
    }

    // Admin: Update image
    async updateImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { title, description, imageUrl, status, displayOrder } = req.body;

            const image = await galleryService.updateImage(parseInt(id), {
                title,
                description,
                imageUrl,
                status: status as GalleryImageStatus,
                displayOrder,
            });

            res.json(image);
        } catch (error) {
            console.error('Error updating gallery image:', error);
            res.status(500).json({ error: 'Failed to update image' });
        }
    }

    // Admin: Delete image
    async deleteImage(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await galleryService.deleteImage(parseInt(id));
            res.json({ success: true, message: 'Image deleted successfully' });
        } catch (error) {
            console.error('Error deleting gallery image:', error);
            res.status(500).json({ error: 'Failed to delete image' });
        }
    }

    // Admin: Get all images
    async getAllImagesForAdmin(req: AuthRequest, res: Response): Promise<void> {
        try {
            const images = await galleryService.getAllImagesForAdmin();
            res.json(images);
        } catch (error) {
            console.error('Error fetching gallery images for admin:', error);
            res.status(500).json({ error: 'Failed to fetch images' });
        }
    }

    // Admin: Toggle status
    async toggleStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const image = await galleryService.toggleStatus(parseInt(id));
            res.json(image);
        } catch (error) {
            console.error('Error toggling image status:', error);
            res.status(500).json({ error: 'Failed to toggle status' });
        }
    }

    // Admin: Reorder images
    async reorderImages(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { imageIds } = req.body;

            if (!Array.isArray(imageIds)) {
                res.status(400).json({ error: 'imageIds must be an array' });
                return;
            }

            const result = await galleryService.reorderImages(imageIds);
            res.json(result);
        } catch (error) {
            console.error('Error reordering images:', error);
            res.status(500).json({ error: 'Failed to reorder images' });
        }
    }

    // User: Get active images
    async getActiveImages(req: AuthRequest, res: Response): Promise<void> {
        try {
            const images = await galleryService.getActiveImages();
            res.json(images);
        } catch (error) {
            console.error('Error fetching active gallery images:', error);
            res.status(500).json({ error: 'Failed to fetch images' });
        }
    }

    // User: Get image by ID
    async getImageById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const image = await galleryService.getImageById(parseInt(id));

            if (!image) {
                res.status(404).json({ error: 'Image not found' });
                return;
            }

            res.json(image);
        } catch (error) {
            console.error('Error fetching gallery image:', error);
            res.status(500).json({ error: 'Failed to fetch image' });
        }
    }
}

export const galleryController = new GalleryController();
