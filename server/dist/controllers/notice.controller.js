"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotice = createNotice;
exports.getAllNotices = getAllNotices;
exports.getActiveNotices = getActiveNotices;
exports.getNoticeById = getNoticeById;
exports.updateNotice = updateNotice;
exports.toggleNoticeStatus = toggleNoticeStatus;
exports.deleteNotice = deleteNotice;
exports.incrementViewCount = incrementViewCount;
exports.markAsRead = markAsRead;
exports.getUserInteractions = getUserInteractions;
exports.getAnalytics = getAnalytics;
exports.toggleInteraction = toggleInteraction;
exports.getNoticeInteractions = getNoticeInteractions;
const client_1 = require("@prisma/client");
const notice_service_1 = __importDefault(require("../services/notice.service"));
// Admin: Create notice
async function createNotice(req, res) {
    try {
        const userId = req.user?.id ?? req.user?.sub;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const notice = await notice_service_1.default.createNotice(req.body, userId);
        res.status(201).json(notice);
    }
    catch (error) {
        console.error('Create notice error:', error);
        res.status(400).json({ error: error.message });
    }
}
// Admin: Get all notices
async function getAllNotices(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
            type: req.query.type,
            priority: req.query.priority,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            search: req.query.search,
        };
        const result = await notice_service_1.default.getAllNotices(filters, page, limit);
        res.json(result);
    }
    catch (error) {
        console.error('Get all notices error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Public: Get active notices
async function getActiveNotices(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const userId = req.user?.id ?? req.user?.sub;
        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
            type: req.query.type,
            zoneId: req.query.zoneId ? parseInt(req.query.zoneId) : undefined,
            wardId: req.query.wardId ? parseInt(req.query.wardId) : undefined,
            cityId: req.query.cityId ? parseInt(req.query.cityId) : undefined,
        };
        const result = await notice_service_1.default.getActiveNotices(filters, page, limit, userId);
        res.json(result);
    }
    catch (error) {
        console.error('Get active notices error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Get notice by ID
async function getNoticeById(req, res) {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user?.id ?? req.user?.sub;
        const notice = await notice_service_1.default.getNoticeById(id, userId);
        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }
        res.json(notice);
    }
    catch (error) {
        console.error('Get notice by ID error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Admin: Update notice
async function updateNotice(req, res) {
    try {
        const id = parseInt(req.params.id);
        console.log('🔵 Update notice request:', {
            id,
            body: req.body,
            imageUrl: req.body.imageUrl || 'NO IMAGE URL'
        });
        const notice = await notice_service_1.default.updateNotice(id, req.body);
        console.log('✅ Notice updated successfully:', {
            id: notice.id,
            imageUrl: notice.imageUrl || 'NO IMAGE URL'
        });
        res.json(notice);
    }
    catch (error) {
        console.error('❌ Update notice error:', {
            message: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({ error: error.message });
    }
}
// Admin: Toggle notice status
async function toggleNoticeStatus(req, res) {
    try {
        const id = parseInt(req.params.id);
        const notice = await notice_service_1.default.toggleNoticeStatus(id);
        res.json(notice);
    }
    catch (error) {
        console.error('Toggle notice status error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Admin: Delete notice
async function deleteNotice(req, res) {
    try {
        const id = parseInt(req.params.id);
        await notice_service_1.default.deleteNotice(id);
        res.json({ message: 'Notice deleted successfully' });
    }
    catch (error) {
        console.error('Delete notice error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Public: Increment view count
async function incrementViewCount(req, res) {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user?.id ?? req.user?.sub;
        await notice_service_1.default.incrementViewCount(id, userId);
        res.json({ message: 'View count incremented' });
    }
    catch (error) {
        console.error('Increment view count error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Public: Mark as read
async function markAsRead(req, res) {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user?.id ?? req.user?.sub;
        await notice_service_1.default.incrementReadCount(id, userId);
        res.json({ message: 'Marked as read' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Admin: Get notice interactions by user
async function getUserInteractions(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const interactions = await notice_service_1.default.getUserInteractionsByUserId(userId);
        res.json(interactions);
    }
    catch (error) {
        console.error('Get user interactions error:', error);
        res.status(500).json({ error: error.message });
    }
}
// Admin: Get analytics
async function getAnalytics(req, res) {
    try {
        const analytics = await notice_service_1.default.getAnalytics();
        res.json(analytics);
    }
    catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: error.message });
    }
}
// User: Toggle interaction (Like, Love, RSVP)
async function toggleInteraction(req, res) {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user?.id ?? req.user?.sub;
        const { type } = req.body;
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid notice ID' });
        }
        const normalizedType = typeof type === 'string' ? type.trim().toUpperCase() : '';
        if (!normalizedType) {
            return res.status(400).json({ error: 'Interaction type is required' });
        }
        if (!Object.values(client_1.InteractionType).includes(normalizedType)) {
            return res.status(400).json({ error: 'Invalid interaction type' });
        }
        // If no user, return error asking to login
        if (!userId) {
            return res.status(401).json({
                error: 'Please login to interact with notices',
                requiresAuth: true
            });
        }
        const result = await notice_service_1.default.toggleInteraction(id, userId, normalizedType);
        res.json(result);
    }
    catch (error) {
        console.error('Toggle interaction error:', error);
        if (error?.message === 'Notice not found') {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
}
// Public/User: Get interactions for a notice
async function getNoticeInteractions(req, res) {
    try {
        const id = parseInt(req.params.id);
        const userId = req.user?.id ?? req.user?.sub;
        const result = await notice_service_1.default.getNoticeInteractions(id, userId);
        res.json(result);
    }
    catch (error) {
        console.error('Get interactions error:', error);
        res.status(500).json({ error: error.message });
    }
}
