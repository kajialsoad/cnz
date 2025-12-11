import { PrismaClient, CityCorporationStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCityCorporationDto {
    code: string;
    name: string;
    minWard: number;
    maxWard: number;
}

interface UpdateCityCorporationDto {
    name?: string;
    minWard?: number;
    maxWard?: number;
    status?: CityCorporationStatus;
}

interface CityCorporationStats {
    totalUsers: number;
    totalComplaints: number;
    resolvedComplaints: number;
    activeZones: number;
}

class CityCorporationService {
    /**
     * Get all city corporations with optional status filter
     */
    async getCityCorporations(status?: CityCorporationStatus | 'ALL') {
        const where: any = {};

        if (status && status !== 'ALL') {
            where.status = status;
        }

        const cityCorporations = await prisma.cityCorporation.findMany({
            where,
            orderBy: {
                code: 'asc',
            },
            include: {
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
            const totalComplaints = await prisma.complaint.count({
                where: {
                    user: {
                        cityCorporationCode: cc.code,
                    },
                },
            });

            // Get active zones count
            const activeZones = await prisma.zone.count({
                where: {
                    cityCorporationId: cc.id,
                    status: 'ACTIVE',
                },
            });

            // Get total wards count (using direct relation for better performance)
            const totalWards = await prisma.ward.count({
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
    async getCityCorporationByCode(code: string) {
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code },
            include: {
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

        return cityCorporation;
    }

    /**
     * Create new city corporation
     */
    async createCityCorporation(data: CreateCityCorporationDto) {
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
    async updateCityCorporation(code: string, data: UpdateCityCorporationDto) {
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
    async getCityCorporationStats(code: string): Promise<CityCorporationStats> {
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

        // Get active zones count
        const activeZones = await prisma.zone.count({
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
    async validateWard(cityCorporationCode: string, ward: number): Promise<boolean> {
        const cityCorporation = await this.getCityCorporationByCode(cityCorporationCode);

        if (ward < cityCorporation.minWard || ward > cityCorporation.maxWard) {
            return false;
        }

        return true;
    }

    /**
     * Check if city corporation is active
     */
    async isActive(code: string): Promise<boolean> {
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code },
            select: { status: true },
        });

        return cityCorporation?.status === 'ACTIVE';
    }

    /**
     * Delete city corporation (only if no zones assigned)
     */
    async deleteCityCorporation(code: string): Promise<void> {
        // Check if city corporation exists
        const cityCorporation = await this.getCityCorporationByCode(code);

        // Check if city corporation has zones
        const zoneCount = await prisma.zone.count({
            where: { cityCorporationId: cityCorporation.id },
        });

        if (zoneCount > 0) {
            throw new Error(
                `Cannot delete city corporation. It has ${zoneCount} zone(s) assigned. Please remove all zones first.`
            );
        }

        await prisma.cityCorporation.delete({
            where: { code },
        });
    }
}

export default new CityCorporationService();
