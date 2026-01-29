import { PrismaClient, NoticeType, NoticePriority, InteractionType } from '@prisma/client';
import notificationService from './notification.service';

const prisma = new PrismaClient();

export interface CreateNoticeDTO {
    title: string;
    titleBn?: string;
    description: string;
    descriptionBn?: string;
    content: string;
    contentBn?: string;
    categoryId: number;
    type?: NoticeType;
    priority?: NoticePriority;
    publishDate?: Date;
    expiryDate?: Date;
    imageUrl?: string;
    attachments?: any;
    targetZones?: number[];
    targetWards?: number[];
    targetCities?: number[];
}

export interface UpdateNoticeDTO extends Partial<CreateNoticeDTO> {
    isActive?: boolean;
}

export interface NoticeFilters {
    categoryId?: number;
    type?: NoticeType;
    priority?: NoticePriority;
    isActive?: boolean;
    search?: string;
    zoneId?: number;
    wardId?: number;
    cityId?: number;
}

class NoticeService {
    // Admin: Create notice
    async createNotice(data: CreateNoticeDTO, createdBy: number) {
        const notice = await prisma.notice.create({
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
            this.notifyUsersAboutNotice(notice).catch(err =>
                console.error('Failed to notify users about new notice:', err)
            );
        }

        return notice;
    }

    // Notify users about a new notice based on targeting
    async notifyUsersAboutNotice(notice: any) {
        const { targetCities, targetZones, targetWards } = notice;

        const where: any = {
            status: 'ACTIVE',
            role: 'CUSTOMER',
        };

        if (targetWards && (targetWards as number[]).length > 0) {
            where.wardId = { in: targetWards };
        } else if (targetZones && (targetZones as number[]).length > 0) {
            where.zoneId = { in: targetZones };
        } else if (targetCities && (targetCities as string[]).length > 0) {
            where.cityCorporationCode = { in: targetCities };
        }

        const users = await prisma.user.findMany({
            where,
            select: { id: true },
        });

        if (users.length === 0) return;

        // Create database notifications in batches
        const notificationData = users.map(user => ({
            userId: user.id,
            title: notice.title,
            message: notice.description,
            type: 'NOTICE',
            metadata: JSON.stringify({ noticeId: notice.id }),
        }));

        await prisma.notification.createMany({
            data: notificationData,
        });

        console.log(`✅ Created ${users.length} notifications for notice: ${notice.title}`);

        // TODO: Trigger real FCM push notifications here
    }

    // Admin: Get all notices with filters
    async getAllNotices(filters: NoticeFilters, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.type) where.type = filters.type;
        if (filters.priority) where.priority = filters.priority;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;

        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { titleBn: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [notices, total] = await Promise.all([
            prisma.notice.findMany({
                where,
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
                orderBy: [
                    { priority: 'desc' },
                    { publishDate: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.notice.count({ where }),
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
    async getActiveNotices(filters: NoticeFilters, page = 1, limit = 20, userId?: number) {
        const skip = (page - 1) * limit;
        const now = new Date();

        const where: any = {
            isActive: true,
            publishDate: { lte: now },
            OR: [
                { expiryDate: null },
                { expiryDate: { gte: now } },
            ],
        };

        if (filters.categoryId) where.categoryId = filters.categoryId;
        if (filters.type) where.type = filters.type;

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
            prisma.notice.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: [
                    { priority: 'desc' },
                    { publishDate: 'desc' },
                ],
                skip,
                take: limit,
            }),
            prisma.notice.count({ where }),
        ]);

        // Fetch interactions for these notices
        const noticeIds = notices.map(n => n.id);
        const interactions = await Promise.all(
            notices.map(notice => this.getNoticeInteractions(notice.id, userId))
        );

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
    async getNoticeById(id: number, userId?: number) {
        const notice = await prisma.notice.findUnique({
            where: { id },
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

        if (!notice) return null;

        const interactions = await this.getNoticeInteractions(id, userId);

        return {
            ...notice,
            interactions,
        };
    }

    // Update notice
    async updateNotice(id: number, data: UpdateNoticeDTO) {
        return await prisma.notice.update({
            where: { id },
            data,
            include: {
                category: true,
            },
        });
    }

    // Toggle notice active status
    async toggleNoticeStatus(id: number) {
        const notice = await prisma.notice.findUnique({ where: { id } });
        if (!notice) throw new Error('Notice not found');

        return await prisma.notice.update({
            where: { id },
            data: { isActive: !notice.isActive },
        });
    }

    // Delete notice
    async deleteNotice(id: number) {
        return await prisma.notice.delete({
            where: { id },
        });
    }

    // Increment view count
    async incrementViewCount(id: number) {
        return await prisma.notice.update({
            where: { id },
            data: {
                viewCount: { increment: 1 },
            },
        });
    }

    // Increment read count
    async incrementReadCount(id: number) {
        return await prisma.notice.update({
            where: { id },
            data: {
                readCount: { increment: 1 },
            },
        });
    }

    // Get analytics
    async getAnalytics() {
        const [
            totalNotices,
            activeNotices,
            expiredNotices,
            urgentNotices,
            totalViews,
            totalReads,
            categoryStats,
            interactionStats,
        ] = await Promise.all([
            prisma.notice.count(),
            prisma.notice.count({ where: { isActive: true } }),
            prisma.notice.count({
                where: {
                    expiryDate: { lt: new Date() },
                },
            }),
            prisma.notice.count({
                where: {
                    type: 'URGENT',
                    isActive: true,
                },
            }),
            prisma.notice.aggregate({
                _sum: { viewCount: true },
            }),
            prisma.notice.aggregate({
                _sum: { readCount: true },
            }),
            prisma.notice.groupBy({
                by: ['categoryId'],
                _count: true,
                _sum: {
                    viewCount: true,
                    readCount: true,
                },
            }),
            prisma.noticeInteraction.groupBy({
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
    async toggleInteraction(noticeId: number, userId: number, type: InteractionType) {
        const existing = await prisma.noticeInteraction.findUnique({
            where: {
                noticeId_userId_type: {
                    noticeId,
                    userId,
                    type,
                },
            },
        });

        if (existing) {
            // Remove the interaction
            await prisma.noticeInteraction.delete({
                where: { id: existing.id },
            });
            return { action: 'removed', type };
        } else {
            // If it's an RSVP, remove other RSVP types first
            if (type === 'RSVP_YES' || type === 'RSVP_NO' || type === 'RSVP_MAYBE') {
                await prisma.noticeInteraction.deleteMany({
                    where: {
                        noticeId,
                        userId,
                        type: { in: ['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'] },
                    },
                });
            }

            // Create new interaction
            await prisma.noticeInteraction.create({
                data: {
                    noticeId,
                    userId,
                    type,
                },
            });
            return { action: 'added', type };
        }
    }

    // Get interactions for a notice
    async getNoticeInteractions(noticeId: number, userId?: number) {
        const [counts, userInteractions] = await Promise.all([
            prisma.noticeInteraction.groupBy({
                by: ['type'],
                where: { noticeId },
                _count: true,
            }),
            userId ? prisma.noticeInteraction.findMany({
                where: { noticeId, userId },
                select: { type: true },
            }) : Promise.resolve([]),
        ]);

        const interactionCounts = counts.reduce((acc: any, curr) => {
            acc[curr.type] = curr._count;
            return acc;
        }, {});

        return {
            counts: interactionCounts,
            userInteractions: userInteractions.map(i => i.type),
        };
    }

    // Auto-archive expired notices (Cron Job)
    async archiveExpiredNotices() {
        const now = new Date();
        return await prisma.notice.updateMany({
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

export default new NoticeService();
