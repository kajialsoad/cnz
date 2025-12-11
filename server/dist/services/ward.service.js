"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../utils/prisma"));
class WardService {
    /**
     * Get wards by zone with optional status filter
     */
    async getWardsByZone(zoneId, status) {
        const where = {
            zoneId,
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const wards = await prisma_1.default.ward.findMany({
            where,
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: {
                wardNumber: 'asc',
            },
        });
        return wards;
    }
    /**
     * Get single ward by ID
     */
    async getWardById(id) {
        const ward = await prisma_1.default.ward.findUnique({
            where: { id },
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                users: {
                    where: {
                        status: 'ACTIVE',
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        wardImageCount: true,
                    },
                    orderBy: {
                        firstName: 'asc',
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        if (!ward) {
            throw new Error(`Ward with ID ${id} not found`);
        }
        return ward;
    }
    /**
     * Create new ward
     */
    async createWard(data) {
        // Validate ward number is positive
        if (data.wardNumber < 1) {
            throw new Error('Ward number must be a positive integer');
        }
        // Validate zone exists
        const zone = await prisma_1.default.zone.findUnique({
            where: { id: data.zoneId },
            include: {
                _count: {
                    select: {
                        wards: true,
                    },
                },
            },
        });
        if (!zone) {
            throw new Error(`Zone with ID ${data.zoneId} not found`);
        }
        // Check ward limit (max 12 wards per zone)
        if (zone._count.wards >= 12) {
            throw new Error(`Cannot add ward. Zone ${zone.zoneNumber} already has the maximum of 12 wards.`);
        }
        // Check if ward number already exists for this zone
        const existing = await prisma_1.default.ward.findFirst({
            where: {
                wardNumber: data.wardNumber,
                zoneId: data.zoneId,
            },
        });
        if (existing) {
            throw new Error(`Ward ${data.wardNumber} already exists in Zone ${zone.zoneNumber}`);
        }
        const ward = await prisma_1.default.ward.create({
            data: {
                wardNumber: data.wardNumber,
                number: data.wardNumber, // Required field
                zoneId: data.zoneId,
                cityCorporationId: zone.cityCorporationId, // Required field
                inspectorName: data.inspectorName,
                inspectorSerialNumber: data.inspectorSerialNumber,
                status: 'ACTIVE',
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        return ward;
    }
    /**
     * Bulk create wards for a zone
     */
    async createWardsBulk(zoneId, wardNumbers) {
        // Validate zone exists
        const zone = await prisma_1.default.zone.findUnique({
            where: { id: zoneId },
            include: {
                _count: {
                    select: {
                        wards: true,
                    },
                },
            },
        });
        if (!zone) {
            throw new Error(`Zone with ID ${zoneId} not found`);
        }
        // Validate ward numbers are positive and unique
        const uniqueWardNumbers = Array.from(new Set(wardNumbers));
        if (uniqueWardNumbers.some(num => num < 1)) {
            throw new Error('All ward numbers must be positive integers');
        }
        // Check ward limit (max 12 wards per zone)
        const totalWardsAfterAdd = zone._count.wards + uniqueWardNumbers.length;
        if (totalWardsAfterAdd > 12) {
            throw new Error(`Cannot add ${uniqueWardNumbers.length} wards. Zone ${zone.zoneNumber} would exceed the maximum of 12 wards (currently has ${zone._count.wards}).`);
        }
        // Check if any ward numbers already exist for this zone
        const existingWards = await prisma_1.default.ward.findMany({
            where: {
                zoneId,
                wardNumber: {
                    in: uniqueWardNumbers,
                },
            },
            select: {
                wardNumber: true,
            },
        });
        if (existingWards.length > 0) {
            const existingNumbers = existingWards.map(w => w.wardNumber);
            throw new Error(`Ward numbers ${existingNumbers.join(', ')} already exist in Zone ${zone.zoneNumber}`);
        }
        // Create wards in a transaction
        const wards = await prisma_1.default.$transaction(uniqueWardNumbers.map(wardNumber => prisma_1.default.ward.create({
            data: {
                wardNumber,
                number: wardNumber, // Required field
                zoneId,
                cityCorporationId: zone.cityCorporationId, // Required field
                status: 'ACTIVE',
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })));
        return wards;
    }
    /**
     * Update ward
     */
    async updateWard(id, data) {
        // Check if ward exists
        await this.getWardById(id);
        const ward = await prisma_1.default.ward.update({
            where: { id },
            data,
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        return ward;
    }
    /**
     * Delete ward (only if no users assigned)
     */
    async deleteWard(id) {
        // Check if ward exists
        const ward = await this.getWardById(id);
        // Check if ward has users
        const userCount = await prisma_1.default.user.count({
            where: { wardId: id },
        });
        if (userCount > 0) {
            throw new Error(`Cannot delete ward. It has ${userCount} user(s) assigned. Please reassign all users first.`);
        }
        await prisma_1.default.ward.delete({
            where: { id },
        });
    }
    /**
     * Get ward statistics
     */
    async getWardStats(id) {
        // Verify ward exists
        await this.getWardById(id);
        // Get total users
        const totalUsers = await prisma_1.default.user.count({
            where: {
                wardId: id,
            },
        });
        // Get total complaints (through user relationship)
        const totalComplaints = await prisma_1.default.complaint.count({
            where: {
                user: {
                    wardId: id,
                },
            },
        });
        // Get total images (sum of wardImageCount for all users in this ward)
        const imageCountResult = await prisma_1.default.user.aggregate({
            where: {
                wardId: id,
            },
            _sum: {
                wardImageCount: true,
            },
        });
        const totalImages = imageCountResult._sum.wardImageCount || 0;
        return {
            totalUsers,
            totalComplaints,
            totalImages,
        };
    }
    /**
     * Check if user can upload image to ward
     */
    async canUserUploadImage(userId, wardId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                wardId: true,
                wardImageCount: true,
            },
        });
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }
        // Verify user belongs to the ward
        if (user.wardId !== wardId) {
            throw new Error('User does not belong to this ward');
        }
        // Check if user has already uploaded the maximum (1 image per ward)
        return user.wardImageCount < 1;
    }
    /**
     * Validate ward number for zone
     */
    async validateWardNumber(zoneId, wardNumber) {
        // Validate ward number is positive
        if (wardNumber < 1) {
            return false;
        }
        // Check if ward number already exists for this zone
        const existing = await prisma_1.default.ward.findFirst({
            where: {
                wardNumber,
                zoneId,
            },
        });
        // Return true if ward number is available (doesn't exist)
        return !existing;
    }
    /**
     * Check if ward is active
     */
    async isActive(id) {
        const ward = await prisma_1.default.ward.findUnique({
            where: { id },
            select: { status: true },
        });
        return ward?.status === 'ACTIVE';
    }
    /**
     * Validate ward belongs to zone
     */
    async validateWardBelongsToZone(wardId, zoneId) {
        const ward = await prisma_1.default.ward.findUnique({
            where: { id: wardId },
            select: {
                zoneId: true,
            },
        });
        if (!ward) {
            return false;
        }
        return ward.zoneId === zoneId;
    }
    /**
     * Update ward inspector information
     */
    async updateWardInspector(id, inspectorData) {
        // Check if ward exists
        await this.getWardById(id);
        // Validate inspector data if provided
        if (inspectorData.inspectorName !== undefined && inspectorData.inspectorName.trim() === '') {
            throw new Error('Inspector name cannot be empty');
        }
        const ward = await prisma_1.default.ward.update({
            where: { id },
            data: {
                inspectorName: inspectorData.inspectorName,
                inspectorSerialNumber: inspectorData.inspectorSerialNumber,
            },
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        return ward;
    }
    /**
     * Get ward inspector information
     */
    async getWardInspector(id) {
        const ward = await prisma_1.default.ward.findUnique({
            where: { id },
            select: {
                id: true,
                wardNumber: true,
                inspectorName: true,
                inspectorSerialNumber: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporation: {
                            select: {
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!ward) {
            throw new Error(`Ward with ID ${id} not found`);
        }
        return {
            wardId: ward.id,
            wardNumber: ward.wardNumber,
            zone: ward.zone,
            inspector: {
                name: ward.inspectorName,
                serialNumber: ward.inspectorSerialNumber,
            },
        };
    }
    /**
     * Validate inspector data
     */
    validateInspectorData(inspectorData) {
        const errors = [];
        // Inspector name validation
        if (inspectorData.inspectorName !== undefined) {
            if (typeof inspectorData.inspectorName !== 'string') {
                errors.push('Inspector name must be a string');
            }
            else if (inspectorData.inspectorName.trim() === '') {
                errors.push('Inspector name cannot be empty');
            }
            else if (inspectorData.inspectorName.length > 255) {
                errors.push('Inspector name cannot exceed 255 characters');
            }
        }
        // Inspector serial number validation
        if (inspectorData.inspectorSerialNumber !== undefined) {
            if (typeof inspectorData.inspectorSerialNumber !== 'string') {
                errors.push('Inspector serial number must be a string');
            }
            else if (inspectorData.inspectorSerialNumber.length > 100) {
                errors.push('Inspector serial number cannot exceed 100 characters');
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Get available ward numbers for a zone (not already used)
     */
    async getAvailableWardNumbers(zoneId, maxWardNumber = 100) {
        // Validate zone exists
        const zone = await prisma_1.default.zone.findUnique({
            where: { id: zoneId },
        });
        if (!zone) {
            throw new Error(`Zone with ID ${zoneId} not found`);
        }
        // Get existing ward numbers for this zone
        const existingWards = await prisma_1.default.ward.findMany({
            where: { zoneId },
            select: { wardNumber: true },
        });
        const existingNumbers = existingWards.map(w => w.wardNumber);
        // Generate available numbers (1 to maxWardNumber, excluding existing)
        const availableNumbers = [];
        for (let i = 1; i <= maxWardNumber; i++) {
            if (!existingNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }
        return availableNumbers;
    }
    /**
     * Check ward limit for zone
     */
    async checkWardLimit(zoneId) {
        const currentCount = await prisma_1.default.ward.count({
            where: { zoneId },
        });
        const maxAllowed = 12;
        const canAddMore = currentCount < maxAllowed;
        return {
            canAddMore,
            currentCount,
            maxAllowed,
        };
    }
}
exports.default = new WardService();
