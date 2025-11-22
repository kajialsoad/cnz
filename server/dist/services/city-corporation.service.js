"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class CityCorporationService {
    /**
     * Get all city corporations with optional status filter
     */
    async getCityCorporations(status) {
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const cityCorporations = await prisma.cityCorporation.findMany({
            where,
            orderBy: {
                code: 'asc',
            },
        });
        // Fetch statistics for each city corporation
        const cityCorporationsWithStats = await Promise.all(cityCorporations.map(async (cc) => {
            // Get total users
            const totalUsers = await prisma.user.count({
                where: { cityCorporationCode: cc.code },
            });
            // Get total complaints
            const totalComplaints = await prisma.complaint.count({
                where: {
                    user: {
                        cityCorporationCode: cc.code,
                    },
                },
            });
            // Get active thanas count
            const activeThanas = await prisma.thana.count({
                where: {
                    cityCorporationId: cc.id,
                    status: 'ACTIVE',
                },
            });
            return {
                ...cc,
                totalUsers,
                totalComplaints,
                activeThanas,
            };
        }));
        return cityCorporationsWithStats;
    }
    /**
     * Get single city corporation by code
     */
    async getCityCorporationByCode(code) {
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code },
            include: {
                thanas: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        if (!cityCorporation) {
            throw new Error(`City Corporation with code ${code} not found`);
        }
        return cityCorporation;
    }
    /**
     * Create new city corporation
     */
    async createCityCorporation(data) {
        // Validate ward range
        if (data.minWard >= data.maxWard) {
            throw new Error('minWard must be less than maxWard');
        }
        if (data.minWard < 1) {
            throw new Error('minWard must be at least 1');
        }
        // Check if code already exists
        const existing = await prisma.cityCorporation.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new Error(`City Corporation with code ${data.code} already exists`);
        }
        const cityCorporation = await prisma.cityCorporation.create({
            data: {
                code: data.code,
                name: data.name,
                minWard: data.minWard,
                maxWard: data.maxWard,
                status: 'ACTIVE',
            },
        });
        return cityCorporation;
    }
    /**
     * Update city corporation
     */
    async updateCityCorporation(code, data) {
        // Check if exists
        const existing = await this.getCityCorporationByCode(code);
        // Validate ward range if being updated
        if (data.minWard !== undefined || data.maxWard !== undefined) {
            const minWard = data.minWard ?? existing.minWard;
            const maxWard = data.maxWard ?? existing.maxWard;
            if (minWard >= maxWard) {
                throw new Error('minWard must be less than maxWard');
            }
            if (minWard < 1) {
                throw new Error('minWard must be at least 1');
            }
        }
        const cityCorporation = await prisma.cityCorporation.update({
            where: { code },
            data,
        });
        return cityCorporation;
    }
    /**
     * Get statistics for city corporation
     */
    async getCityCorporationStats(code) {
        // Verify city corporation exists
        await this.getCityCorporationByCode(code);
        // Get total users
        const totalUsers = await prisma.user.count({
            where: {
                cityCorporationCode: code,
            },
        });
        // Get total complaints (through user relationship)
        const totalComplaints = await prisma.complaint.count({
            where: {
                user: {
                    cityCorporationCode: code,
                },
            },
        });
        // Get resolved complaints
        const resolvedComplaints = await prisma.complaint.count({
            where: {
                user: {
                    cityCorporationCode: code,
                },
                status: 'RESOLVED',
            },
        });
        // Get active thanas count
        const activeThanas = await prisma.thana.count({
            where: {
                cityCorporation: {
                    code: code,
                },
                status: 'ACTIVE',
            },
        });
        return {
            totalUsers,
            totalComplaints,
            resolvedComplaints,
            activeThanas,
        };
    }
    /**
     * Validate ward number for city corporation
     */
    async validateWard(cityCorporationCode, ward) {
        const cityCorporation = await this.getCityCorporationByCode(cityCorporationCode);
        if (ward < cityCorporation.minWard || ward > cityCorporation.maxWard) {
            return false;
        }
        return true;
    }
    /**
     * Check if city corporation is active
     */
    async isActive(code) {
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code },
            select: { status: true },
        });
        return cityCorporation?.status === 'ACTIVE';
    }
}
exports.default = new CityCorporationService();
