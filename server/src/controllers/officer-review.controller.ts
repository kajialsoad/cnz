import { Request, Response } from 'express';
import { officerReviewService } from '../services/officer-review.service';

export class OfficerReviewController {
    // Public: Get all active officer reviews
    async getAllActive(req: Request, res: Response) {
        try {
            const reviews = await officerReviewService.getAllActive();
            res.json(reviews);
        } catch (error) {
            console.error('Error fetching active officer reviews:', error);
            res.status(500).json({ error: 'Failed to fetch officer reviews' });
        }
    }

    // Admin: Get all officer reviews
    async getAll(req: Request, res: Response) {
        try {
            const reviews = await officerReviewService.getAll();
            res.json(reviews);
        } catch (error) {
            console.error('Error fetching officer reviews:', error);
            res.status(500).json({ error: 'Failed to fetch officer reviews' });
        }
    }

    // Admin: Get single officer review
    async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const review = await officerReviewService.getById(id);

            if (!review) {
                return res.status(404).json({ error: 'Officer review not found' });
            }

            res.json(review);
        } catch (error) {
            console.error('Error fetching officer review:', error);
            res.status(500).json({ error: 'Failed to fetch officer review' });
        }
    }

    // Admin: Create officer review
    async create(req: Request, res: Response) {
        try {
            const review = await officerReviewService.create(req.body);
            res.status(201).json(review);
        } catch (error) {
            console.error('Error creating officer review:', error);
            res.status(500).json({ error: 'Failed to create officer review' });
        }
    }

    // Admin: Update officer review
    async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const review = await officerReviewService.update(id, req.body);
            res.json(review);
        } catch (error) {
            console.error('Error updating officer review:', error);
            res.status(500).json({ error: 'Failed to update officer review' });
        }
    }

    // Admin: Delete officer review
    async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await officerReviewService.delete(id);
            res.json({ success: true, message: 'Officer review deleted' });
        } catch (error) {
            console.error('Error deleting officer review:', error);
            res.status(500).json({ error: 'Failed to delete officer review' });
        }
    }

    // Admin: Toggle active status
    async toggleActive(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const review = await officerReviewService.toggleActive(id);
            res.json(review);
        } catch (error) {
            console.error('Error toggling officer review status:', error);
            res.status(500).json({ error: 'Failed to toggle status' });
        }
    }

    // Admin: Reorder officer reviews
    async reorder(req: Request, res: Response) {
        try {
            const { orders } = req.body;
            await officerReviewService.reorder(orders);
            res.json({ success: true, message: 'Officer reviews reordered' });
        } catch (error) {
            console.error('Error reordering officer reviews:', error);
            res.status(500).json({ error: 'Failed to reorder officer reviews' });
        }
    }
}

export const officerReviewController = new OfficerReviewController();
