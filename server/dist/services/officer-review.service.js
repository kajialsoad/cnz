"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.officerReviewService = exports.OfficerReviewService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class OfficerReviewService {
    // Get all active officer reviews with messages
    async getAllActive() {
        return await prisma_1.default.officerReview.findMany({
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
        return await prisma_1.default.officerReview.findMany({
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { displayOrder: 'asc' },
        });
    }
    // Get single officer review by ID
    async getById(id) {
        return await prisma_1.default.officerReview.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
    }
    // Create officer review
    async create(data) {
        return await prisma_1.default.officerReview.create({
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
    async update(id, data) {
        // If messages are provided, delete existing and create new ones
        if (data.messages) {
            await prisma_1.default.officerReviewMessage.deleteMany({
                where: { officerReviewId: id },
            });
        }
        return await prisma_1.default.officerReview.update({
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
    async delete(id) {
        return await prisma_1.default.officerReview.delete({
            where: { id },
        });
    }
    // Toggle active status
    async toggleActive(id) {
        const review = await prisma_1.default.officerReview.findUnique({
            where: { id },
        });
        if (!review) {
            throw new Error('Officer review not found');
        }
        return await prisma_1.default.officerReview.update({
            where: { id },
            data: { isActive: !review.isActive },
        });
    }
    // Reorder officer reviews
    async reorder(orders) {
        const updates = orders.map((order) => prisma_1.default.officerReview.update({
            where: { id: order.id },
            data: { displayOrder: order.displayOrder },
        }));
        await prisma_1.default.$transaction(updates);
        return { success: true };
    }
}
exports.OfficerReviewService = OfficerReviewService;
exports.officerReviewService = new OfficerReviewService();
