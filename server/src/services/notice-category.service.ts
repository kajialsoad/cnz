import prisma from '../utils/prisma';

export interface CreateCategoryDTO {
    name: string;
    nameBn?: string;
    color?: string;
    icon?: string;
    parentId?: number;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
    isActive?: boolean;
}

class NoticeCategoryService {
    // Create category
    async createCategory(data: CreateCategoryDTO) {
        return await prisma.noticeCategory.create({
            data,
            include: {
                parent: true,
                children: true,
            },
        });
    }

    // Get all categories
    async getAllCategories(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };

        return await prisma.noticeCategory.findMany({
            where,
            include: {
                parent: true,
                children: true,
                _count: {
                    select: {
                        notices: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    // Get category tree (hierarchical)
    async getCategoryTree() {
        const categories = await prisma.noticeCategory.findMany({
            where: {
                isActive: true,
                parentId: null,
            },
            include: {
                children: {
                    where: { isActive: true },
                    include: {
                        _count: {
                            select: {
                                notices: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        notices: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });

        return categories;
    }

    // Get category by ID
    async getCategoryById(id: number) {
        return await prisma.noticeCategory.findUnique({
            where: { id },
            include: {
                parent: true,
                children: true,
                _count: {
                    select: {
                        notices: true,
                    },
                },
            },
        });
    }

    // Update category
    async updateCategory(id: number, data: UpdateCategoryDTO) {
        return await prisma.noticeCategory.update({
            where: { id },
            data,
            include: {
                parent: true,
                children: true,
            },
        });
    }

    // Delete category
    async deleteCategory(id: number) {
        // Check if category has notices
        const noticeCount = await prisma.notice.count({
            where: { categoryId: id },
        });

        if (noticeCount > 0) {
            throw new Error('Cannot delete category with existing notices');
        }

        // Check if category has children
        const childrenCount = await prisma.noticeCategory.count({
            where: { parentId: id },
        });

        if (childrenCount > 0) {
            throw new Error('Cannot delete category with subcategories');
        }

        return await prisma.noticeCategory.delete({
            where: { id },
        });
    }

    // Toggle category status
    async toggleCategoryStatus(id: number) {
        const category = await prisma.noticeCategory.findUnique({ where: { id } });
        if (!category) throw new Error('Category not found');

        return await prisma.noticeCategory.update({
            where: { id },
            data: { isActive: !category.isActive },
        });
    }
}

export default new NoticeCategoryService();
