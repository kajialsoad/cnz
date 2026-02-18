import { NoticeType, NoticePriority, InteractionType } from '@prisma/client';
import notificationService from './notification.service';
import prisma from '../utils/prisma';

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
} as const;

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
} as const;

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
                select: adminNoticeSelect,
                orderBy: [
                    { displayOrder: 'asc' },
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
                select: publicNoticeSelect,
                orderBy: [
                    { displayOrder: 'asc' },
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
            select: adminNoticeSelect,
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
        try {
            console.log('🔵 Notice service updateNotice:', {
                id,
                data,
                imageUrl: data.imageUrl || 'NO IMAGE URL',
                targetCities: data.targetCities,
                targetZones: data.targetZones,
                targetWards: data.targetWards
            });

            const notice = await prisma.notice.update({
                where: { id },
                data,
                select: adminNoticeSelect,
            });

            console.log('✅ Notice updated in database:', {
                id: notice.id,
                imageUrl: notice.imageUrl || 'NO IMAGE URL'
            });

            return notice;
        } catch (error: any) {
            console.error('❌ Prisma update error:', {
                message: error.message,
                code: error.code,
                meta: error.meta
            });
            throw error;
        }
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
    async incrementViewCount(id: number, userId?: number) {
        if (userId) {
            try {
                await prisma.noticeInteraction.upsert({
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
            } catch (error) {
                console.error('Failed to record view interaction:', error);
            }
        }

        return await prisma.notice.update({
            where: { id },
            data: {
                viewCount: { increment: 1 },
            },
        });
    }

    // Increment read count
    async incrementReadCount(id: number, userId?: number) {
        if (userId) {
            try {
                await prisma.noticeInteraction.upsert({
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
            } catch (error) {
                console.error('Failed to record read interaction:', error);
            }
        }

        return await prisma.notice.update({
            where: { id },
            data: {
                readCount: { increment: 1 },
            },
        });
    }

    // Admin: Get user notice interactions
    async getUserInteractionsByUserId(userId: number) {
        return await prisma.noticeInteraction.findMany({
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
        const notice = await prisma.notice.findUnique({
            where: { id: noticeId },
            select: { id: true },
        });

        if (!notice) {
            throw new Error('Notice not found');
        }

        // Fetch all interactions for this user and notice to handle mutual exclusivity
        const userInteractions = await prisma.noticeInteraction.findMany({
            where: {
                noticeId,
                userId,
            },
        });

        const existingInteraction = userInteractions.find(i => i.type === type);

        if (existingInteraction) {
            // If strictly same type exists, toggle it off (remove)
            await prisma.noticeInteraction.delete({
                where: { id: existingInteraction.id },
            });
            return { action: 'removed', type };
        }

        // Handle mutual exclusivity for LIKE/LOVE
        if (type === 'LIKE' || type === 'LOVE') {
            const conflictingTypes = ['LIKE', 'LOVE'];
            const conflictingInteraction = userInteractions.find(i => conflictingTypes.includes(i.type));

            if (conflictingInteraction) {
                await prisma.noticeInteraction.delete({
                    where: { id: conflictingInteraction.id },
                });
            }
        }

        // Handle mutual exclusivity for RSVP
        if (['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'].includes(type)) {
            const rsvpTypes = ['RSVP_YES', 'RSVP_NO', 'RSVP_MAYBE'];
            const conflictingRsvps = userInteractions.filter(i => rsvpTypes.includes(i.type));

            if (conflictingRsvps.length > 0) {
                await prisma.noticeInteraction.deleteMany({
                    where: {
                        id: { in: conflictingRsvps.map(i => i.id) },
                    },
                });
            }
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

    // Admin: Reorder notices
    async reorderNotices(orders: Array<{ id: number; displayOrder: number }>) {
        const updates = orders.map((item) =>
            prisma.notice.update({
                where: { id: item.id },
                data: { displayOrder: item.displayOrder },
            })
        );

        await prisma.$transaction(updates);
        return { success: true, message: 'Notices reordered successfully' };
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
