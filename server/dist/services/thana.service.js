"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ThanaService {
    /**
     * Get thanas by city corporation with optional status filter
     */
    async getThanasByCityCorporation(cityCorporationCode, status) {
        // First, get the city corporation to get its ID
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code: cityCorporationCode },
        });
        if (!cityCorporation) {
            throw new Error(`City Corporation with code ${cityCorporationCode} not found`);
        }
        const where = {
            cityCorporationId: cityCorporation.id,
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const thanas = await prisma.thana.findMany({
            where,
            include: {
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
        return thanas;
    }
    /**
     * Get single thana by ID
     */
    async getThanaById(id) {
        const thana = await prisma.thana.findUnique({
            where: { id },
            include: {
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        if (!thana) {
            throw new Error(`Thana with ID ${id} not found`);
        }
        return thana;
    }
    /**
     * Create new thana
     */
    async createThana(data) {
        // Validate city corporation exists
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code: data.cityCorporationCode },
        });
        if (!cityCorporation) {
            throw new Error(`City Corporation with code ${data.cityCorporationCode} not found`);
        }
        // Check if thana name already exists for this city corporation
        const existing = await prisma.thana.findFirst({
            where: {
                name: data.name,
                cityCorporationId: cityCorporation.id,
            },
        });
        if (existing) {
            throw new Error(`Thana with name "${data.name}" already exists in ${cityCorporation.name}`);
        }
        const thana = await prisma.thana.create({
            data: {
                name: data.name,
                cityCorporationId: cityCorporation.id,
                status: 'ACTIVE',
            },
            include: {
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return thana;
    }
    /**
     * Update thana
     */
    async updateThana(id, data) {
        // Check if thana exists
        const existing = await this.getThanaById(id);
        // If updating name, check for duplicates within the same city corporation
        if (data.name && data.name !== existing.name) {
            const duplicate = await prisma.thana.findFirst({
                where: {
                    name: data.name,
                    cityCorporationId: existing.cityCorporationId,
                    id: {
                        not: id,
                    },
                },
            });
            if (duplicate) {
                throw new Error(`Thana with name "${data.name}" already exists in this city corporation`);
            }
        }
        const thana = await prisma.thana.update({
            where: { id },
            data,
            include: {
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return thana;
    }
    /**
     * Get statistics for thana
     */
    async getThanaStats(id) {
        // Verify thana exists
        await this.getThanaById(id);
        // Get total users
        const totalUsers = await prisma.user.count({
            where: {
                thanaId: id,
            },
        });
        // Get total complaints (through user relationship)
        const totalComplaints = await prisma.complaint.count({
            where: {
                user: {
                    thanaId: id,
                },
            },
        });
        return {
            totalUsers,
            totalComplaints,
        };
    }
    /**
     * Check if thana is active
     */
    async isActive(id) {
        const thana = await prisma.thana.findUnique({
            where: { id },
            select: { status: true },
        });
        return thana?.status === 'ACTIVE';
    }
    /**
     * Validate thana belongs to city corporation
     */
    async validateThanaBelongsToCityCorporation(thanaId, cityCorporationCode) {
        const thana = await prisma.thana.findUnique({
            where: { id: thanaId },
            include: {
                cityCorporation: true,
            },
        });
        if (!thana) {
            return false;
        }
        return thana.cityCorporation.code === cityCorporationCode;
    }
}
exports.default = new ThanaService();
