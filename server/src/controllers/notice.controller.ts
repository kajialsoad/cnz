import { Request, Response } from 'express';
import noticeService from '../services/notice.service';

// Admin: Create notice
export async function createNotice(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const notice = await noticeService.createNotice(req.body, userId);
        res.status(201).json(notice);
    } catch (error: any) {
        console.error('Create notice error:', error);
        res.status(400).json({ error: error.message });
    }
}

// Admin: Get all notices
export async function getAllNotices(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
            type: req.query.type as any,
            priority: req.query.priority as any,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            search: req.query.search as string,
        };

        const result = await noticeService.getAllNotices(filters, page, limit);
        res.json(result);
    } catch (error: any) {
        console.error('Get all notices error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Public: Get active notices
export async function getActiveNotices(req: Request, res: Response) {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const userId = (req as any).user?.id;

        const filters = {
            categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
            type: req.query.type as any,
            zoneId: req.query.zoneId ? parseInt(req.query.zoneId as string) : undefined,
            wardId: req.query.wardId ? parseInt(req.query.wardId as string) : undefined,
            cityId: req.query.cityId ? parseInt(req.query.cityId as string) : undefined,
        };

        const result = await noticeService.getActiveNotices(filters, page, limit, userId);
        res.json(result);
    } catch (error: any) {
        console.error('Get active notices error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Get notice by ID
export async function getNoticeById(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const userId = (req as any).user?.id;
        const notice = await noticeService.getNoticeById(id, userId);

        if (!notice) {
            return res.status(404).json({ error: 'Notice not found' });
        }

        res.json(notice);
    } catch (error: any) {
        console.error('Get notice by ID error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Admin: Update notice
export async function updateNotice(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const notice = await noticeService.updateNotice(id, req.body);
        res.json(notice);
    } catch (error: any) {
        console.error('Update notice error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Admin: Toggle notice status
export async function toggleNoticeStatus(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const notice = await noticeService.toggleNoticeStatus(id);
        res.json(notice);
    } catch (error: any) {
        console.error('Toggle notice status error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Admin: Delete notice
export async function deleteNotice(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await noticeService.deleteNotice(id);
        res.json({ message: 'Notice deleted successfully' });
    } catch (error: any) {
        console.error('Delete notice error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Public: Increment view count
export async function incrementViewCount(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await noticeService.incrementViewCount(id);
        res.json({ message: 'View count incremented' });
    } catch (error: any) {
        console.error('Increment view count error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Public: Mark as read
export async function markAsRead(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        await noticeService.incrementReadCount(id);
        res.json({ message: 'Marked as read' });
    } catch (error: any) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Admin: Get analytics
export async function getAnalytics(req: Request, res: Response) {
    try {
        const analytics = await noticeService.getAnalytics();
        res.json(analytics);
    } catch (error: any) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: error.message });
    }
}

// User: Toggle interaction (Like, Love, RSVP)
export async function toggleInteraction(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const userId = (req as any).user?.id;
        const { type } = req.body;

        if (!type) {
            return res.status(400).json({ error: 'Interaction type is required' });
        }

        // If no user, return error asking to login
        if (!userId) {
            return res.status(401).json({
                error: 'Please login to interact with notices',
                requiresAuth: true
            });
        }

        const result = await noticeService.toggleInteraction(id, userId, type);
        res.json(result);
    } catch (error: any) {
        console.error('Toggle interaction error:', error);
        res.status(500).json({ error: error.message });
    }
}

// Public/User: Get interactions for a notice
export async function getNoticeInteractions(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        const userId = (req as any).user?.id;

        const result = await noticeService.getNoticeInteractions(id, userId);
        res.json(result);
    } catch (error: any) {
        console.error('Get interactions error:', error);
        res.status(500).json({ error: error.message });
    }
}
