"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../utils/prisma"));
class CityCorporationService {
    /**
     * Get all city corporations with optional status filter
     */
    async getCityCorporations(status) {
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const cityCorporations = await prisma_1.default.cityCorporation.findMany({
            where,
            orderBy: {
                code: 'asc',
            },
            select: {
                id: true,
                code: true,
                name: true,
                minWard: true,
                maxWard: true,
                minZone: true,
                maxZone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        users: true,
                        zones: true,
                    },
                },
            },
        });
        // Fetch statistics for each city corporation sequentially to avoid DB connection exhaustion
        const cityCorporationsWithStats = [];
        for (const cc of cityCorporations) {
            // Get total complaints
            const totalComplaints = await prisma_1.default.complaint.count({
                where: {
                    user: {
                        cityCorporationCode: cc.code,
                    },
                },
            });
            // Get active zones count
            const activeZones = await prisma_1.default.zone.count({
                where: {
                    cityCorporationId: cc.id,
                    status: 'ACTIVE',
                },
            });
            // Get total wards count (using direct relation for better performance)
            const totalWards = await prisma_1.default.ward.count({
                where: {
                    cityCorporationId: cc.id,
                },
            });
            cityCorporationsWithStats.push({
                ...cc,
                totalUsers: cc._count.users,
                totalComplaints,
                totalZones: cc._count.zones,
                activeZones,
                totalWards,
            });
        }
        return cityCorporationsWithStats;
    }
    /**
     * Get single city corporation by code
     */
    async getCityCorporationByCode(code) {
        const cityCorporation = await prisma_1.default.cityCorporation.findUnique({
            where: { code },
            select: {
                id: true,
                code: true,
                name: true,
                minWard: true,
                maxWard: true,
                minZone: true,
                maxZone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                zones: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        zoneNumber: 'asc',
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
        // Get actual max zone and ward numbers from database
        const maxExistingZone = await prisma_1.default.zone.findFirst({
            where: {
                cityCorporationId: cityCorporation.id,
            },
            orderBy: {
                zoneNumber: 'desc',
            },
            select: {
                zoneNumber: true,
            },
        });
        const maxExistingWard = await prisma_1.default.ward.findFirst({
            where: {
                cityCorporationId: cityCorporation.id,
            },
            orderBy: {
                wardNumber: 'desc',
            },
            select: {
                wardNumber: true,
            },
        });
        return {
            ...cityCorporation,
            actualMaxZone: maxExistingZone?.zoneNumber || null,
            actualMaxWard: maxExistingWard?.wardNumber || null,
        };
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
        // Validate zone range
        if (data.minZone >= data.maxZone) {
            throw new Error('minZone must be less than maxZone');
        }
        if (data.minZone < 1) {
            throw new Error('minZone must be at least 1');
        }
        // Check if code already exists
        const existing = await prisma_1.default.cityCorporation.findUnique({
            where: { code: data.code },
        });
        if (existing) {
            throw new Error(`City Corporation with code ${data.code} already exists`);
        }
        const cityCorporation = await prisma_1.default.cityCorporation.create({
            data: {
                code: data.code,
                name: data.name,
                minWard: data.minWard,
                maxWard: data.maxWard,
                minZone: data.minZone,
                maxZone: data.maxZone,
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
            // Check if there are existing wards beyond the new maxWard
            const maxExistingWard = await prisma_1.default.ward.findFirst({
                where: {
                    cityCorporationId: existing.id,
                },
                orderBy: {
                    wardNumber: 'desc',
                },
                select: {
                    wardNumber: true,
                },
            });
            if (maxExistingWard && maxExistingWard.wardNumber && maxExistingWard.wardNumber > maxWard) {
                throw new Error(`Cannot set maximum ward to ${maxWard}. Ward ${maxExistingWard.wardNumber} already exists. Please set maximum ward to at least ${maxExistingWard.wardNumber} or delete existing wards first.`);
            }
        }
        // Validate zone range if being updated (minZone and maxZone)
        if (data.minZone !== undefined || data.maxZone !== undefined) {
            const minZone = data.minZone ?? existing.minZone;
            const maxZone = data.maxZone ?? existing.maxZone;
            if (minZone >= maxZone) {
                throw new Error('minZone must be less than maxZone');
            }
            if (minZone < 1) {
                throw new Error('minZone must be at least 1');
            }
            // Check if there are existing zones beyond the new maxZone
            const maxExistingZone = await prisma_1.default.zone.findFirst({
                where: {
                    cityCorporationId: existing.id,
                },
                orderBy: {
                    zoneNumber: 'desc',
                },
                select: {
                    zoneNumber: true,
                },
            });
            if (maxExistingZone && maxExistingZone.zoneNumber && maxExistingZone.zoneNumber > maxZone) {
                throw new Error(`Cannot set maximum zone to ${maxZone}. Zone ${maxExistingZone.zoneNumber} already exists. Please set maximum zone to at least ${maxExistingZone.zoneNumber} or delete existing zones first.`);
            }
        }
        const cityCorporation = await prisma_1.default.cityCorporation.update({
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
        const totalUsers = await prisma_1.default.user.count({
            where: {
                cityCorporationCode: code,
            },
        });
        // Get total complaints (through user relationship)
        const totalComplaints = await prisma_1.default.complaint.count({
            where: {
                user: {
                    cityCorporationCode: code,
                },
            },
        });
        // Get resolved complaints
        const resolvedComplaints = await prisma_1.default.complaint.count({
            where: {
                user: {
                    cityCorporationCode: code,
                },
                status: 'RESOLVED',
            },
        });
        // Get active zones count
        const activeZones = await prisma_1.default.zone.count({
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
            activeZones,
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
        const cityCorporation = await prisma_1.default.cityCorporation.findUnique({
            where: { code },
            select: { status: true },
        });
        return cityCorporation?.status === 'ACTIVE';
    }
    /**
     * Delete city corporation (only if no zones assigned)
     */
    async deleteCityCorporation(code) {
        // Check if city corporation exists
        const cityCorporation = await this.getCityCorporationByCode(code);
        // Check if city corporation has zones
        const zoneCount = await prisma_1.default.zone.count({
            where: { cityCorporationId: cityCorporation.id },
        });
        if (zoneCount > 0) {
            throw new Error(`Cannot delete city corporation. It has ${zoneCount} zone(s) assigned. Please remove all zones first.`);
        }
        await prisma_1.default.cityCorporation.delete({
            where: { code },
        });
    }
}
exports.default = new CityCorporationService();
