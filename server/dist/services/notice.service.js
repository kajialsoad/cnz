"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../utils/prisma"));
const publicNoticeSelect = {
    id: true,
    title: true,
    titleBn: true,
    description: true,
    descriptionBn: true,
    content: true,
    contentBn: true,
    categoryId: true,
    type: true,
    priority: true,
    isActive: true,
    publishDate: true,
    expiryDate: true,
    imageUrl: true,
    attachments: true,
    targetZones: true,
    targetWards: true,
    targetCities: true,
    viewCount: true,
    readCount: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
    category: true,
};
const adminNoticeSelect = {
    ...publicNoticeSelect,
    creator: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
    },
};
class NoticeService {
    // Admin: Create notice
    async createNotice(data, createdBy) {
        const notice = await prisma_1.default.notice.create({
            data: {
                ...data,
                createdBy,
            },
            include: {
                category: true,
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
        // Trigger notifications if notice is active and publish date is now or in the past
        if (notice.isActive && new Date(notice.publishDate) <= new Date()) {
            this.notifyUsersAboutNotice(notice).catch(err => console.error('Failed to notify users about new notice:', err));
        }
        return notice;
    }
    // Notify users about a new notice based on targeting
    async notifyUsersAboutNotice(notice) {
        const { targetCities, targetZones, targetWards } = notice;
        const where = {
            status: 'ACTIVE',
            role: 'CUSTOMER',
        };
        if (targetWards && targetWards.length > 0) {
            where.wardId = { in: targetWards };
        }
        else if (targetZones && targetZones.length > 0) {
            where.zoneId = { in: targetZones };
        }
        else if (targetCities && targetCities.length > 0) {
            where.cityCorporationCode = { in: targetCities };
        }
        const users = await prisma_1.default.user.findMany({
            where,
            select: { id: true },
        });
        if (users.length === 0)
            return;
        // Create database notifications in batches
        const notificationData = users.map(user => ({
            userId: user.id,
            title: notice.title,
            message: notice.description,
            type: 'NOTICE',
            metadata: JSON.stringify({ noticeId: notice.id }),
        }));
        await prisma_1.default.notification.createMany({
            data: notificationData,
        });
        console.log(`✅ Created ${users.length} notifications for notice: ${notice.title}`);
        // TODO: Trigger real FCM push notifications here
    }
    // Admin: Get all notices with filters
    async getAllNotices(filters, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        if (filters.type)
            where.type = filters.type;
        if (filters.priority)
            where.priority = filters.priority;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { titleBn: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [notices, total] = await Promise.all([
            prisma_1.default.notice.findMany({
                where,
                select: adminNoticeSelect,
                orderBy: [
                    { displayOrder: 'asc' },
                    { priority: 'desc' },
                    { publishDate: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma_1.default.notice.count({ where }),
        ]);
        return {
            notices,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Public: Get active notices for users
    async getActiveNotices(filters, page = 1, limit = 20, userId) {
        const skip = (page - 1) * limit;
        const now = new Date();
        const where = {
            isActive: true,
            publishDate: { lte: now },
            OR: [
                { expiryDate: null },
                { expiryDate: { gte: now } },
            ],
        };
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        if (filters.type)
            where.type = filters.type;
        // Location-based filtering
        if (filters.zoneId) {
            where.OR = [
                { targetZones: { has: filters.zoneId } },
                { targetZones: { isEmpty: true } },
            ];
        }
        if (filters.wardId) {
            where.OR = [
                { targetWards: { has: filters.wardId } },
                { targetWards: { isEmpty: true } },
            ];
        }
        if (filters.cityId) {
            where.OR = [
                { targetCities: { has: filters.cityId } },
                { targetCities: { isEmpty: true } },
            ];
        }
        const [notices, total] = await Promise.all([
            prisma_1.default.notice.findMany({
                where,
                select: publicNoticeSelect,
                orderBy: [
                    { displayOrder: 'asc' },
                    { priority: 'desc' },
                    { publishDate: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma_1.default.notice.count({ where }),
        ]);
        // Fetch interactions for these notices
        const noticeIds = notices.map(n => n.id);
        const interactions = await Promise.all(notices.map(notice => this.getNoticeInteractions(notice.id, userId)));
        const noticesWithInteractions = notices.map((notice, index) => ({
            ...notice,
            interactions: interactions[index],
        }));
        return {
            notices: noticesWithInteractions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    // Get notice by ID
    async getNoticeById(id, userId) {
        const notice = await prisma_1.default.notice.findUnique({
            where: { id },
            select: adminNoticeSelect,
        });
        if (!notice)
            return null;
        const interactions = await this.getNoticeInteractions(id, userId);
        return {
            ...notice,
            interactions,
        };
    }
    // Update notice
    async updateNotice(id, data) {
        try {
            console.log('🔵 Notice service updateNotice:', {
                id,
                data,
                imageUrl: data.imageUrl || 'NO IMAGE URL',
                targetCities: data.targetCities,
                targetZones: data.targetZones,
                targetWards: data.targetWards
            });
            const notice = await prisma_1.default.notice.update({
                where: { id },
                data,
                select: adminNoticeSelect,
            });
            console.log('✅ Notice updated in database:', {
                id: notice.id,
                imageUrl: notice.imageUrl || 'NO IMAGE URL'
            });
            return notice;
        }
        catch (error) {
            console.error('❌ Prisma update error:', {
                message: error.message,
                code: error.code,
                meta: error.meta
            });
            throw error;
        }
    }
    // Toggle notice active status
    async toggleNoticeStatus(id) {
        const notice = await prisma_1.default.notice.findUnique({ where: { id } });
        if (!notice)
            throw new Error('Notice not found');
        return await prisma_1.default.notice.update({
            where: { id },
            data: { isActive: !notice.isActive },
        });
    }
    // Delete notice
    async deleteNotice(id) {
        return await prisma_1.default.notice.delete({
            where: { id },
        });
    }
    // Increment view count
    async incrementViewCount(id, userId) {
        if (userId) {
            try {
                await prisma_1.default.noticeInteraction.upsert({
                    where: {
                        noticeId_userId_type: {
                            noticeId: id,
                            userId,
                            type: 'VIEW',
                        },
                    },
                    update: {},
                    create: {
                        noticeId: id,
                        userId,
                        type: 'VIEW',
                    },
                });
            }
            catch (error) {
                console.error('Failed to record view interaction:', error);
            }
        }
        return await prisma_1.default.notice.update({
            where: { id },
            data: {
                viewCount: { increment: 1 },
            },
        });
    }
    // Increment read count
    async incrementReadCount(id, userId) {
        if (userId) {
            try {
                await prisma_1.default.noticeInteraction.upsert({
                    where: {
                        noticeId_userId_type: {
                            noticeId: id,
                            userId,
                            type: 'READ',
                        },
                    },
                    update: {},
                    create: {
                        noticeId: id,
                        userId,
                        type: 'READ',
                    },
                });
            }
            catch (error) {
                console.error('Failed to record read interaction:', error);
            }
        }
        return await prisma_1.default.notice.update({
            where: { id },
            data: {
                readCount: { increment: 1 },
            },
        });
    }
    // Admin: Get user notice interactions
    async getUserInteractionsByUserId(userId) {
        return await prisma_1.default.noticeInteraction.findMany({
            where: { userId },
            include: {
                notice: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        category: {
                            select: {
                                name: true,
                                nameBn: true,
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    // Get analytics
    async getAnalytics() {
        const [totalNotices, activeNotices, expiredNotices, urgentNotices, totalViews, totalReads, categoryStats, interactionStats,] = await Promise.all([
            prisma_1.default.notice.count(),
            prisma_1.default.notice.count({ where: { isActive: true } }),
            prisma_1.default.notice.count({
                where: {
                    expiryDate: { lt: new Date() },
                },
            }),
            prisma_1.default.notice.count({
                where: {
                    type: 'URGENT',
                    isActive: true,
                },
            }),
            prisma_1.default.notice.aggregate({
                _sum: { viewCount: true },
            }),
            prisma_1.default.notice.aggregate({
                _sum: { readCount: true },
            }),
            prisma_1.default.notice.groupBy({
                by: ['categoryId'],
                _count: true,
                _sum: {
                    viewCount: true,
                    readCount: true,
                },
            }),
            prisma_1.default.noticeInteraction.groupBy({
                by: ['type'],
                _count: true,
            }),
        ]);
        return {
            totalNotices,
            activeNotices,
            expiredNotices,
            urgentNotices,
            totalViews: totalViews._sum.viewCount || 0,
            totalReads: totalReads._sum.readCount || 0,
            categoryStats,
            interactionStats,
        };
    }
    // Toggle Interaction (Like, Love, RSVP)
    async toggleInteraction(noticeId, userId, type) {
        const notice = await prisma_1.default.notice.findUnique({
            where: { id: noticeId },
            select: { id: true },
        });
        if (!notice) {
            throw new Error('Notice not found');
        }
        // Fetch all interactions for this user and notice to handle mutual exclusivity
        const userInteractions = await prisma_1.default.noticeInteraction.findMany({
            where: {
                noticeId,
                userId,
            },
        });
        const existingInteraction = userInteractions.find(i => i.type === type);
        if (existingInteraction) {
            // If strictly same type exists, toggle it off (remove)
            await prisma_1.default.noticeInteraction.delete({
                where: { id: existingInteraction.id },
            });
            return { action: 'removed', type };
        }
        // Handle mutual exclusivity for LIKE/LOVE
        if (type === 'LIKE' || type === 'LOVE') {
            const conflictingTypes = ['LIKE', 'LOVE'];
            const conflictingInteraction = userInteractions.find(i => conflictingTypes.includes(i.type));
            if (conflictingInteraction) {
                await prisma_1.default.noticeInteraction.delete({
                    where: { id: conflictingInteraction.id },
                });
            }
        }
        // Handle mutual exclusivity for RSVP
        if (['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'].includes(type)) {
            const rsvpTypes = ['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'];
            const conflictingRsvps = userInteractions.filter(i => rsvpTypes.includes(i.type));
            if (conflictingRsvps.length > 0) {
                await prisma_1.default.noticeInteraction.deleteMany({
                    where: {
                        id: { in: conflictingRsvps.map(i => i.id) },
                    },
                });
            }
        }
        // Create new interaction
        await prisma_1.default.noticeInteraction.create({
            data: {
                noticeId,
                userId,
                type,
            },
        });
        return { action: 'added', type };
    }
    // Get interactions for a notice
    async getNoticeInteractions(noticeId, userId) {
        const [counts, userInteractions] = await Promise.all([
            prisma_1.default.noticeInteraction.groupBy({
                by: ['type'],
                where: { noticeId },
                _count: true,
            }),
            userId ? prisma_1.default.noticeInteraction.findMany({
                where: { noticeId, userId },
                select: { type: true },
            }) : Promise.resolve([]),
        ]);
        const interactionCounts = counts.reduce((acc, curr) => {
            acc[curr.type] = curr._count;
            return acc;
        }, {});
        return {
            counts: interactionCounts,
            userInteractions: userInteractions.map(i => i.type),
        };
    }
    // Admin: Reorder notices
    async reorderNotices(orders) {
        const updates = orders.map((item) => prisma_1.default.notice.update({
            where: { id: item.id },
            data: { displayOrder: item.displayOrder },
        }));
        await prisma_1.default.$transaction(updates);
        return { success: true, message: 'Notices reordered successfully' };
    }
    // Auto-archive expired notices (Cron Job)
    async archiveExpiredNotices() {
        const now = new Date();
        return await prisma_1.default.notice.updateMany({
            where: {
                isActive: true,
                expiryDate: { lt: now },
            },
            data: {
                isActive: false,
            },
        });
    }
}
exports.default = new NoticeService();
