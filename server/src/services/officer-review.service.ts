import prisma from '../utils/prisma';

export class OfficerReviewService {
    // Get all active officer reviews with messages
    async getAllActive() {
        return await prisma.officerReview.findMany({
            where: { isActive: true },
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
    }

    // Get all officer reviews (admin)
    async getAll() {
        return await prisma.officerReview.findMany({
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
    }

    // Get single officer review by ID
    async getById(id: number) {
        return await prisma.officerReview.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
    }

    // Create officer review
    async create(data: {
        name: string;
        nameBn?: string;
        designation: string;
        designationBn?: string;
        imageUrl: string;
        displayOrder?: number;
        messages: Array<{
            content: string;
            contentBn?: string;
            displayOrder?: number;
        }>;
    }) {
        return await prisma.officerReview.create({
            data: {
                name: data.name,
                nameBn: data.nameBn,
                designation: data.designation,
                designationBn: data.designationBn,
                imageUrl: data.imageUrl,
                displayOrder: data.displayOrder || 0,
                messages: {
                    create: data.messages.map((msg, index) => ({
                        content: msg.content,
                        contentBn: msg.contentBn,
                        displayOrder: msg.displayOrder ?? index,
                    })),
                },
            },
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
    }

    // Update officer review
    async update(
        id: number,
        data: {
            name?: string;
            nameBn?: string;
            designation?: string;
            designationBn?: string;
            imageUrl?: string;
            isActive?: boolean;
            displayOrder?: number;
            messages?: Array<{
                id?: number;
                content: string;
                contentBn?: string;
                displayOrder?: number;
            }>;
        }
    ) {
        // If messages are provided, delete existing and create new ones
        if (data.messages) {
            await prisma.officerReviewMessage.deleteMany({
                where: { officerReviewId: id },
            });
        }

        return await prisma.officerReview.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.nameBn !== undefined && { nameBn: data.nameBn }),
                ...(data.designation && { designation: data.designation }),
                ...(data.designationBn !== undefined && { designationBn: data.designationBn }),
                ...(data.imageUrl && { imageUrl: data.imageUrl }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
                ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
                ...(data.messages && {
                    messages: {
                        create: data.messages.map((msg, index) => ({
                            content: msg.content,
                            contentBn: msg.contentBn,
                            displayOrder: msg.displayOrder ?? index,
                        })),
                    },
                }),
            },
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
    }

    // Delete officer review
    async delete(id: number) {
        return await prisma.officerReview.delete({
            where: { id },
        });
    }

    // Toggle active status
    async toggleActive(id: number) {
        const review = await prisma.officerReview.findUnique({
            where: { id },
        });

        if (!review) {
            throw new Error('Officer review not found');
        }

        return await prisma.officerReview.update({
            where: { id },
            data: { isActive: !review.isActive },
        });
    }

    // Reorder officer reviews
    async reorder(orders: Array<{ id: number; displayOrder: number }>) {
        const updates = orders.map((order) =>
            prisma.officerReview.update({
                where: { id: order.id },
                data: { displayOrder: order.displayOrder },
            })
        );

        await prisma.$transaction(updates);
        return { success: true };
    }
}

export const officerReviewService = new OfficerReviewService();
