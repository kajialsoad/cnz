"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const officer_review_service_1 = require("../services/officer-review.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/active', async (req, res) => {
    try {
        const reviews = await officer_review_service_1.officerReviewService.getAllActive();
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching active officer reviews:', error);
        res.status(500).json({ error: 'Failed to fetch officer reviews' });
    }
});
// Admin routes (protected)
router.get('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const reviews = await officer_review_service_1.officerReviewService.getAll();
        res.json(reviews);
    }
    catch (error) {
        console.error('Error fetching officer reviews:', error);
        res.status(500).json({ error: 'Failed to fetch officer reviews' });
    }
});
router.get('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
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
});
router.post('/', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const review = await officer_review_service_1.officerReviewService.create(req.body);
        res.status(201).json(review);
    }
    catch (error) {
        console.error('Error creating officer review:', error);
        res.status(500).json({ error: 'Failed to create officer review' });
    }
});
router.put('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const review = await officer_review_service_1.officerReviewService.update(id, req.body);
        res.json(review);
    }
    catch (error) {
        console.error('Error updating officer review:', error);
        res.status(500).json({ error: 'Failed to update officer review' });
    }
});
router.delete('/:id', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await officer_review_service_1.officerReviewService.delete(id);
        res.json({ success: true, message: 'Officer review deleted' });
    }
    catch (error) {
        console.error('Error deleting officer review:', error);
        res.status(500).json({ error: 'Failed to delete officer review' });
    }
});
router.patch('/:id/toggle-active', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const review = await officer_review_service_1.officerReviewService.toggleActive(id);
        res.json(review);
    }
    catch (error) {
        console.error('Error toggling officer review status:', error);
        res.status(500).json({ error: 'Failed to toggle status' });
    }
});
router.post('/reorder', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { orders } = req.body;
        await officer_review_service_1.officerReviewService.reorder(orders);
        res.json({ success: true, message: 'Officer reviews reordered' });
    }
    catch (error) {
        console.error('Error reordering officer reviews:', error);
        res.status(500).json({ error: 'Failed to reorder officer reviews' });
    }
});
exports.default = router;
