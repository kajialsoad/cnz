import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { wasteManagementService } from '../services/waste-management.service';
import { WastePostCategory, WastePostStatus } from '@prisma/client';

export class WasteManagementController {
    // Admin: Create post
    async createPost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { title, content, imageUrl, category } = req.body;
            const createdBy = req.user?.id;

            if (!createdBy) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            if (!title || !content || !category) {
                res.status(400).json({ error: 'Title, content, and category are required' });
                return;
            }

            const post = await wasteManagementService.createPost({
                title,
                content,
                imageUrl,
                category: category as WastePostCategory,
                createdBy,
            });

            res.status(201).json(post);
        } catch (error) {
            console.error('Error creating waste post:', error);
            res.status(500).json({ error: 'Failed to create post' });
        }
    }

    // Admin: Update post
    async updatePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { title, content, imageUrl, category, status } = req.body;

            const post = await wasteManagementService.updatePost(parseInt(id), {
                title,
                content,
                imageUrl,
                category: category as WastePostCategory,
                status: status as WastePostStatus,
            });

            res.json(post);
        } catch (error) {
            console.error('Error updating waste post:', error);
            res.status(500).json({ error: 'Failed to update post' });
        }
    }

    // Admin: Publish post
    async publishPost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const post = await wasteManagementService.publishPost(parseInt(id));
            res.json(post);
        } catch (error) {
            console.error('Error publishing waste post:', error);
            res.status(500).json({ error: 'Failed to publish post' });
        }
    }

    // Admin: Unpublish post
    async unpublishPost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const post = await wasteManagementService.unpublishPost(parseInt(id));
            res.json(post);
        } catch (error) {
            console.error('Error unpublishing waste post:', error);
            res.status(500).json({ error: 'Failed to unpublish post' });
        }
    }

    // Admin: Delete post
    async deletePost(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            await wasteManagementService.deletePost(parseInt(id));
            res.json({ success: true, message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Error deleting waste post:', error);
            res.status(500).json({ error: 'Failed to delete post' });
        }
    }

    // Admin: Reorder posts
    async reorder(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { orders } = req.body;
            await wasteManagementService.reorder(orders);
            res.json({ success: true, message: 'Posts reordered successfully' });
        } catch (error) {
            console.error('Error reordering waste posts:', error);
            res.status(500).json({ error: 'Failed to reorder posts' });
        }
    }

    // Admin: Get all posts
    async getAllPostsForAdmin(req: AuthRequest, res: Response): Promise<void> {
        try {
            const posts = await wasteManagementService.getAllPostsForAdmin();
            res.json(posts);
        } catch (error) {
            console.error('Error fetching waste posts for admin:', error);
            res.status(500).json({ error: 'Failed to fetch posts' });
        }
    }

    // User: Get published posts
    async getPublishedPosts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            const posts = await wasteManagementService.getPublishedPosts(userId);
            res.json(posts);
        } catch (error) {
            console.error('Error fetching published waste posts:', error);
            res.status(500).json({ error: 'Failed to fetch posts' });
        }
    }

    // User: Get post by ID
    async getPostById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const post = await wasteManagementService.getPostById(parseInt(id), userId);

            if (!post) {
                res.status(404).json({ error: 'Post not found' });
                return;
            }

            res.json(post);
        } catch (error) {
            console.error('Error fetching waste post:', error);
            res.status(500).json({ error: 'Failed to fetch post' });
        }
    }

    // User: Toggle reaction (like/dislike)
    async toggleReaction(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { reactionType } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            if (!reactionType || !['LIKE', 'LOVE'].includes(reactionType)) {
                res.status(400).json({ error: 'Invalid reaction type' });
                return;
            }

            const postId = parseInt(id);
            if (isNaN(postId)) {
                res.status(400).json({ error: 'Invalid post ID' });
                return;
            }

            const result = await wasteManagementService.toggleReaction(
                postId,
                userId,
                reactionType as 'LIKE' | 'LOVE'
            );

            // Get updated post with stats
            const post = await wasteManagementService.getPostById(postId, userId);

            res.json({
                ...result,
                post,
            });
        } catch (error: any) {
            console.error('Error toggling reaction:', error);
            res.status(500).json({ 
                error: 'Failed to toggle reaction',
                message: error.message 
            });
        }
    }

    // Admin: Get reactions by user
    async getUserReactions(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const reactions = await wasteManagementService.getUserReactions(parseInt(userId));
            res.json(reactions);
        } catch (error) {
            console.error('Error fetching user reactions:', error);
            res.status(500).json({ error: 'Failed to fetch user reactions' });
        }
    }

    // User: Get posts by category
    async getPostsByCategory(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { category } = req.params;
            const userId = req.user?.id;

            if (!['CURRENT_WASTE', 'FUTURE_WASTE'].includes(category)) {
                res.status(400).json({ error: 'Invalid category' });
                return;
            }

            const posts = await wasteManagementService.getPostsByCategory(
                category as WastePostCategory,
                userId
            );

            res.json(posts);
        } catch (error) {
            console.error('Error fetching posts by category:', error);
            res.status(500).json({ error: 'Failed to fetch posts' });
        }
    }
}

export const wasteManagementController = new WasteManagementController();
