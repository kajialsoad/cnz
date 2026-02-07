"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.officerReviewController = exports.OfficerReviewController = void 0;
const officer_review_service_1 = require("../services/officer-review.service");
class OfficerReviewController {
    // Public: Get all active officer reviews
    async getAllActive(req, res) {
        try {
            const reviews = await officer_review_service_1.officerReviewService.getAllActive();
            res.json(reviews);
        }
        catch (error) {
            console.error('Error fetching active officer reviews:', error);
            res.status(500).json({ error: 'Failed to fetch officer reviews' });
        }
    }
    // Admin: Get all officer reviews
    async getAll(req, res) {
        try {
            const reviews = await officer_review_service_1.officerReviewService.getAll();
            res.json(reviews);
        }
        catch (error) {
            console.error('Error fetching officer reviews:', error);
            res.status(500).json({ error: 'Failed to fetch officer reviews' });
        }
    }
    // Admin: Get single officer review
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const review = await officer_review_service_1.officerReviewService.getById(id);
            if (!review) {
                return res.status(404).json({ error: 'Officer review not found' });
            }
            res.json(review);
        }
        catch (error) {
            console.error('Error fetching officer review:', error);
            res.status(500).json({ error: 'Failed to fetch officer review' });
        }
    }
    // Admin: Create officer review
    async create(req, res) {
        try {
            const review = await officer_review_service_1.officerReviewService.create(req.body);
            res.status(201).json(review);
        }
        catch (error) {
            console.error('Error creating officer review:', error);
            res.status(500).json({ error: 'Failed to create officer review' });
        }
    }
    // Admin: Update officer review
    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const review = await officer_review_service_1.officerReviewService.update(id, req.body);
            res.json(review);
        }
        catch (error) {
            console.error('Error updating officer review:', error);
            res.status(500).json({ error: 'Failed to update officer review' });
        }
    }
    // Admin: Delete officer review
    async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            await officer_review_service_1.officerReviewService.delete(id);
            res.json({ success: true, message: 'Officer review deleted' });
        }
        catch (error) {
            console.error('Error deleting officer review:', error);
            res.status(500).json({ error: 'Failed to delete officer review' });
        }
    }
    // Admin: Toggle active status
    async toggleActive(req, res) {
        try {
            const id = parseInt(req.params.id);
            const review = await officer_review_service_1.officerReviewService.toggleActive(id);
            res.json(review);
        }
        catch (error) {
            console.error('Error toggling officer review status:', error);
            res.status(500).json({ error: 'Failed to toggle status' });
        }
    }
    // Admin: Reorder officer reviews
    async reorder(req, res) {
        try {
            const { orders } = req.body;
            await officer_review_service_1.officerReviewService.reorder(orders);
            res.json({ success: true, message: 'Officer reviews reordered' });
        }
        catch (error) {
            console.error('Error reordering officer reviews:', error);
            res.status(500).json({ error: 'Failed to reorder officer reviews' });
        }
    }
}
exports.OfficerReviewController = OfficerReviewController;
exports.officerReviewController = new OfficerReviewController();
