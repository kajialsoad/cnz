import { WastePostCategory, WastePostStatus } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateWastePostDto {
    title: string;
    content: string;
    imageUrl?: string;
    category: WastePostCategory;
    createdBy: number;
}

export interface UpdateWastePostDto {
    title?: string;
    content?: string;
    imageUrl?: string;
    category?: WastePostCategory;
    status?: WastePostStatus;
}

export interface WastePostWithStats {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
    category: WastePostCategory;
    status: WastePostStatus;
    createdBy: number;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    likeCount: number;
    loveCount: number;
    userReaction?: 'LIKE' | 'LOVE' | null;
}

class WasteManagementService {
    // Admin: Create new post
    async createPost(data: CreateWastePostDto): Promise<any> {
        return await prisma.wastePost.create({
            data: {
                ...data,
                status: 'DRAFT',
            },
        });
    }

    // Admin: Update post
    async updatePost(postId: number, data: UpdateWastePostDto): Promise<any> {
        return await prisma.wastePost.update({
            where: { id: postId },
            data,
        });
    }

    // Admin: Publish post
    async publishPost(postId: number): Promise<any> {
        return await prisma.wastePost.update({
            where: { id: postId },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
    }

    // Admin: Unpublish post
    async unpublishPost(postId: number): Promise<any> {
        return await prisma.wastePost.update({
            where: { id: postId },
            data: {
                status: 'DRAFT',
                publishedAt: null,
            },
        });
    }

    // Admin: Delete post
    async deletePost(postId: number): Promise<void> {
        await prisma.wastePost.delete({
            where: { id: postId },
        });
    }

    // Admin: Get all posts (including drafts)
    async getAllPostsForAdmin(): Promise<WastePostWithStats[]> {
        const posts = await prisma.wastePost.findMany({
            orderBy: [
                { displayOrder: 'asc' },
                { status: 'asc' }, // PUBLISHED first
                { createdAt: 'desc' },
            ],
        });

        return await Promise.all(
            posts.map(async (post) => {
                const stats = await this.getPostStats(post.id);
                return {
                    ...post,
                    ...stats,
                };
            })
        );
    }

    // Admin: Reorder posts
    async reorder(orders: Array<{ id: number; displayOrder: number }>): Promise<void> {
        await prisma.$transaction(
            orders.map((item) =>
                prisma.wastePost.update({
                    where: { id: item.id },
                    data: { displayOrder: item.displayOrder },
                })
            )
        );
    }

    // User: Get published posts only
    async getPublishedPosts(userId?: number): Promise<WastePostWithStats[]> {
        const posts = await prisma.wastePost.findMany({
            where: {
                status: 'PUBLISHED',
            },
            orderBy: [
                { displayOrder: 'asc' },
                { publishedAt: 'desc' },
            ],
        });

        return await Promise.all(
            posts.map(async (post) => {
                const stats = await this.getPostStats(post.id, userId);
                return {
                    ...post,
                    ...stats,
                };
            })
        );
    }

    // Get post by ID with stats
    async getPostById(postId: number, userId?: number): Promise<WastePostWithStats | null> {
        const post = await prisma.wastePost.findUnique({
            where: { id: postId },
        });

        if (!post) return null;

        const stats = await this.getPostStats(postId, userId);
        return {
            ...post,
            ...stats,
        };
    }

    // Get post statistics
    private async getPostStats(
        postId: number,
        userId?: number
    ): Promise<{ likeCount: number; loveCount: number; userReaction?: 'LIKE' | 'LOVE' | null }> {
        const [likeCount, loveCount, userReaction] = await Promise.all([
            prisma.wastePostReaction.count({
                where: { postId, reactionType: 'LIKE' },
            }),
            prisma.wastePostReaction.count({
                where: { postId, reactionType: 'LOVE' },
            }),
            userId
                ? prisma.wastePostReaction.findUnique({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                    select: { reactionType: true },
                })
                : null,
        ]);

        return {
            likeCount,
            loveCount,
            userReaction: userReaction?.reactionType as 'LIKE' | 'LOVE' | null,
        };
    }

    // User: Toggle like/love
    async toggleReaction(
        postId: number,
        userId: number,
        reactionType: 'LIKE' | 'LOVE'
    ): Promise<{ success: boolean; action: 'added' | 'removed' | 'changed' }> {
        // Check if post exists first to avoid foreign key violation
        const post = await prisma.wastePost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new Error(`Post with ID ${postId} not found`);
        }

        const existingReaction = await prisma.wastePostReaction.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });

        if (existingReaction) {
            if (existingReaction.reactionType === reactionType) {
                // Remove reaction if clicking the same button
                await prisma.wastePostReaction.delete({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                });
                return { success: true, action: 'removed' };
            } else {
                // Change reaction type
                await prisma.wastePostReaction.update({
                    where: {
                        postId_userId: {
                            postId,
                            userId,
                        },
                    },
                    data: { reactionType },
                });
                return { success: true, action: 'changed' };
            }
        }

        // Add new reaction
        await prisma.wastePostReaction.create({
            data: {
                postId,
                userId,
                reactionType,
            },
        });

        return { success: true, action: 'added' };
    }

    // Admin: Get all reactions by a specific user
    async getUserReactions(userId: number) {
        return prisma.wastePostReaction.findMany({
            where: { userId },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Get posts by category
    async getPostsByCategory(category: WastePostCategory, userId?: number): Promise<WastePostWithStats[]> {
        const posts = await prisma.wastePost.findMany({
            where: {
                status: 'PUBLISHED',
                category,
            },
            orderBy: [
                { displayOrder: 'asc' },
                { publishedAt: 'desc' },
            ],
        });

        return await Promise.all(
            posts.map(async (post) => {
                const stats = await this.getPostStats(post.id, userId);
                return {
                    ...post,
                    ...stats,
                };
            })
        );
    }
}

export const wasteManagementService = new WasteManagementService();
