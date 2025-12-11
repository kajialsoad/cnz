"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ZoneService {
    /**
     * Get zones by city corporation with optional status filter
     */
    async getZonesByCityCorporation(cityCorporationId, status) {
        const where = {
            cityCorporationId,
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const zones = await prisma.zone.findMany({
            where,
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        wards: true,
                        users: true,
                    },
                },
            },
            orderBy: {
                zoneNumber: 'asc',
            },
        });
        return zones;
    }
    /**
     * Get single zone by ID
     */
    async getZoneById(id) {
        const zone = await prisma.zone.findUnique({
            where: { id },
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                wards: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        wardNumber: 'asc',
                    },
                },
                _count: {
                    select: {
                        wards: true,
                        users: true,
                    },
                },
            },
        });
        if (!zone) {
            throw new Error(`Zone with ID ${id} not found`);
        }
        return zone;
    }
    /**
     * Create new zone
     */
    async createZone(data) {
        // Validate zone number is between 1-20
        if (data.zoneNumber < 1 || data.zoneNumber > 20) {
            throw new Error('Zone number must be between 1 and 20');
        }
        // Validate city corporation exists
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { id: data.cityCorporationId },
        });
        if (!cityCorporation) {
            throw new Error(`City Corporation with ID ${data.cityCorporationId} not found`);
        }
        // Check if zone number already exists for this city corporation
        const existing = await prisma.zone.findFirst({
            where: {
                zoneNumber: data.zoneNumber,
                cityCorporationId: data.cityCorporationId,
            },
        });
        if (existing) {
            throw new Error(`Zone ${data.zoneNumber} already exists in ${cityCorporation.name}`);
        }
        const zone = await prisma.zone.create({
            data: {
                zoneNumber: data.zoneNumber,
                number: data.zoneNumber, // Required field
                name: data.name || `Zone ${data.zoneNumber}`, // Required field with default
                cityCorporationId: data.cityCorporationId,
                officerName: data.officerName,
                officerDesignation: data.officerDesignation,
                officerSerialNumber: data.officerSerialNumber,
                status: 'ACTIVE',
            },
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return zone;
    }
    /**
     * Update zone
     */
    async updateZone(id, data) {
        // Check if zone exists
        await this.getZoneById(id);
        const zone = await prisma.zone.update({
            where: { id },
            data,
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        wards: true,
                        users: true,
                    },
                },
            },
        });
        return zone;
    }
    /**
     * Delete zone (only if no wards assigned)
     */
    async deleteZone(id) {
        // Check if zone exists
        const zone = await this.getZoneById(id);
        // Check if zone has wards
        const wardCount = await prisma.ward.count({
            where: { zoneId: id },
        });
        if (wardCount > 0) {
            throw new Error(`Cannot delete zone. It has ${wardCount} ward(s) assigned. Please remove all wards first.`);
        }
        await prisma.zone.delete({
            where: { id },
        });
    }
    /**
     * Get zone statistics
     */
    async getZoneStats(id) {
        // Verify zone exists
        await this.getZoneById(id);
        // Get total wards
        const totalWards = await prisma.ward.count({
            where: {
                zoneId: id,
            },
        });
        // Get total users
        const totalUsers = await prisma.user.count({
            where: {
                zoneId: id,
            },
        });
        // Get total complaints (through user relationship)
        const totalComplaints = await prisma.complaint.count({
            where: {
                user: {
                    zoneId: id,
                },
            },
        });
        return {
            totalWards,
            totalUsers,
            totalComplaints,
        };
    }
    /**
     * Validate zone number for city corporation
     */
    async validateZoneNumber(cityCorporationId, zoneNumber) {
        // Validate zone number is between 1-20
        if (zoneNumber < 1 || zoneNumber > 20) {
            return false;
        }
        // Check if zone number already exists for this city corporation
        const existing = await prisma.zone.findFirst({
            where: {
                zoneNumber,
                cityCorporationId,
            },
        });
        // Return true if zone number is available (doesn't exist)
        return !existing;
    }
    /**
     * Check if zone is active
     */
    async isActive(id) {
        const zone = await prisma.zone.findUnique({
            where: { id },
            select: { status: true },
        });
        return zone?.status === 'ACTIVE';
    }
    /**
     * Validate zone belongs to city corporation
     */
    async validateZoneBelongsToCityCorporation(zoneId, cityCorporationId) {
        const zone = await prisma.zone.findUnique({
            where: { id: zoneId },
            select: {
                cityCorporationId: true,
            },
        });
        if (!zone) {
            return false;
        }
        return zone.cityCorporationId === cityCorporationId;
    }
    /**
     * Update zone officer information
     */
    async updateZoneOfficer(id, officerData) {
        // Check if zone exists
        await this.getZoneById(id);
        // Validate officer data if provided
        if (officerData.officerName !== undefined && officerData.officerName.trim() === '') {
            throw new Error('Officer name cannot be empty');
        }
        const zone = await prisma.zone.update({
            where: { id },
            data: {
                officerName: officerData.officerName,
                officerDesignation: officerData.officerDesignation,
                officerSerialNumber: officerData.officerSerialNumber,
            },
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        return zone;
    }
    /**
     * Get zone officer information
     */
    async getZoneOfficer(id) {
        const zone = await prisma.zone.findUnique({
            where: { id },
            select: {
                id: true,
                zoneNumber: true,
                name: true,
                officerName: true,
                officerDesignation: true,
                officerSerialNumber: true,
                cityCorporation: {
                    select: {
                        code: true,
                        name: true,
                    },
                },
            },
        });
        if (!zone) {
            throw new Error(`Zone with ID ${id} not found`);
        }
        return {
            zoneId: zone.id,
            zoneNumber: zone.zoneNumber,
            zoneName: zone.name,
            cityCorporation: zone.cityCorporation,
            officer: {
                name: zone.officerName,
                designation: zone.officerDesignation,
                serialNumber: zone.officerSerialNumber,
            },
        };
    }
    /**
     * Validate officer data
     */
    validateOfficerData(officerData) {
        const errors = [];
        // Officer name validation
        if (officerData.officerName !== undefined) {
            if (typeof officerData.officerName !== 'string') {
                errors.push('Officer name must be a string');
            }
            else if (officerData.officerName.trim() === '') {
                errors.push('Officer name cannot be empty');
            }
            else if (officerData.officerName.length > 255) {
                errors.push('Officer name cannot exceed 255 characters');
            }
        }
        // Officer designation validation
        if (officerData.officerDesignation !== undefined) {
            if (typeof officerData.officerDesignation !== 'string') {
                errors.push('Officer designation must be a string');
            }
            else if (officerData.officerDesignation.length > 255) {
                errors.push('Officer designation cannot exceed 255 characters');
            }
        }
        // Officer serial number validation
        if (officerData.officerSerialNumber !== undefined) {
            if (typeof officerData.officerSerialNumber !== 'string') {
                errors.push('Officer serial number must be a string');
            }
            else if (officerData.officerSerialNumber.length > 100) {
                errors.push('Officer serial number cannot exceed 100 characters');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.default = new ZoneService();
