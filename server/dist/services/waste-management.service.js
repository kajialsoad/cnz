"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wasteManagementService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class WasteManagementService {
    // Admin: Create new post
    async createPost(data) {
        return await prisma.wastePost.create({
            data: {
                ...data,
                status: 'DRAFT',
            },
        });
    }
    // Admin: Update post
    async updatePost(postId, data) {
        return await prisma.wastePost.update({
            where: { id: postId },
            data,
        });
    }
    // Admin: Publish post
    async publishPost(postId) {
        return await prisma.wastePost.update({
            where: { id: postId },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
    }
    // Admin: Unpublish post
    async unpublishPost(postId) {
        return await prisma.wastePost.update({
            where: { id: postId },
            data: {
                status: 'DRAFT',
                publishedAt: null,
            },
        });
    }
    // Admin: Delete post
    async deletePost(postId) {
        await prisma.wastePost.delete({
            where: { id: postId },
        });
    }
    // Admin: Get all posts (including drafts)
    async getAllPostsForAdmin() {
        const posts = await prisma.wastePost.findMany({
            orderBy: [
                { status: 'asc' }, // PUBLISHED first
                { createdAt: 'desc' },
            ],
        });
        return await Promise.all(posts.map(async (post) => {
            const stats = await this.getPostStats(post.id);
            return {
                ...post,
                ...stats,
            };
        }));
    }
    // User: Get published posts only
    async getPublishedPosts(userId) {
        const posts = await prisma.wastePost.findMany({
            where: {
                status: 'PUBLISHED',
            },
            orderBy: {
                publishedAt: 'desc',
            },
        });
        return await Promise.all(posts.map(async (post) => {
            const stats = await this.getPostStats(post.id, userId);
            return {
                ...post,
                ...stats,
            };
        }));
    }
    // Get post by ID with stats
    async getPostById(postId, userId) {
        const post = await prisma.wastePost.findUnique({
            where: { id: postId },
        });
        if (!post)
            return null;
        const stats = await this.getPostStats(postId, userId);
        return {
            ...post,
            ...stats,
        };
    }
    // Get post statistics
    async getPostStats(postId, userId) {
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
            userReaction: userReaction?.reactionType,
        };
    }
    // User: Toggle like/love
    async toggleReaction(postId, userId, reactionType) {
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
            }
            else {
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
    async getUserReactions(userId) {
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
    async getPostsByCategory(category, userId) {
        const posts = await prisma.wastePost.findMany({
            where: {
                status: 'PUBLISHED',
                category,
            },
            orderBy: {
                publishedAt: 'desc',
            },
        });
        return await Promise.all(posts.map(async (post) => {
            const stats = await this.getPostStats(post.id, userId);
            return {
                ...post,
                ...stats,
            };
        }));
    }
}
exports.wasteManagementService = new WasteManagementService();
