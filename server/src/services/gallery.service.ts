import { PrismaClient, GalleryImageStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateGalleryImageDto {
    title: string;
    description?: string;
    imageUrl: string;
    createdBy: number;
    displayOrder?: number;
}

export interface UpdateGalleryImageDto {
    title?: string;
    description?: string;
    imageUrl?: string;
    status?: GalleryImageStatus;
    displayOrder?: number;
}

class GalleryService {
    // Admin: Create new gallery image
    async createImage(data: CreateGalleryImageDto) {
        return await prisma.galleryImage.create({
            data: {
                ...data,
                status: 'ACTIVE',
            },
        });
    }

    // Admin: Update gallery image
    async updateImage(imageId: number, data: UpdateGalleryImageDto) {
        return await prisma.galleryImage.update({
            where: { id: imageId },
            data,
        });
    }

    // Admin: Delete gallery image
    async deleteImage(imageId: number): Promise<void> {
        await prisma.galleryImage.delete({
            where: { id: imageId },
        });
    }

    // Admin: Get all images (including inactive)
    async getAllImagesForAdmin() {
        return await prisma.galleryImage.findMany({
            orderBy: [
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    // Admin: Toggle image status
    async toggleStatus(imageId: number) {
        const image = await prisma.galleryImage.findUnique({
            where: { id: imageId },
        });

        if (!image) {
            throw new Error('Image not found');
        }

        const newStatus = image.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        return await prisma.galleryImage.update({
            where: { id: imageId },
            data: { status: newStatus },
        });
    }

    // Admin: Reorder images
    async reorderImages(imageIds: number[]) {
        const updates = imageIds.map((id, index) =>
            prisma.galleryImage.update({
                where: { id },
                data: { displayOrder: index },
            })
        );

        await prisma.$transaction(updates);
        return { success: true, message: 'Images reordered successfully' };
    }

    // User: Get active images only
    async getActiveImages() {
        return await prisma.galleryImage.findMany({
            where: {
                status: 'ACTIVE',
            },
            orderBy: [
                { displayOrder: 'asc' },
                { createdAt: 'desc' },
            ],
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                displayOrder: true,
                createdAt: true,
            },
        });
    }

    // User: Get image by ID
    async getImageById(imageId: number) {
        return await prisma.galleryImage.findUnique({
            where: { id: imageId },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                createdAt: true,
            },
        });
    }
}

export const galleryService = new GalleryService();
