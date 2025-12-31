import prisma from '../utils/prisma';

interface CreateWardDto {
    wardNumber: number;
    zoneId: number;
    inspectorName?: string;
    inspectorSerialNumber?: string;
    inspectorPhone?: string;
}

interface UpdateWardDto {
    wardNumber?: number;
    zoneId?: number;
    inspectorName?: string;
    inspectorSerialNumber?: string;
    inspectorPhone?: string;
    status?: 'ACTIVE' | 'INACTIVE';
}

interface WardStats {
    totalUsers: number;
    totalComplaints: number;
    totalImages: number;
}

class WardService {
    /**
     * Get wards with flexible filtering
     */
    async getWards(params: {
        zoneId?: number;
        cityCorporationCode?: string;
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    }) {
        const where: any = {};

        if (params.zoneId) {
            where.zoneId = params.zoneId;
        }

        if (params.cityCorporationCode && !params.zoneId) {
            where.zone = {
                cityCorporation: {
                    code: params.cityCorporationCode
                }
            };
        }

        if (params.status && params.status !== 'ALL') {
            where.status = params.status;
        }

        const wards = await prisma.ward.findMany({
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
     * Get wards by zone with optional status filter
     */
    async getWardsByZone(
        zoneId: number,
        status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
    ) {
        const where: any = {
            zoneId,
        };

        if (status && status !== 'ALL') {
            where.status = status;
        }

        const wards = await prisma.ward.findMany({
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
    async getWardById(id: number) {
        const ward = await prisma.ward.findUnique({
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
    async createWard(data: CreateWardDto) {
        // Validate zone exists and get city corporation with limits
        const zone = await prisma.zone.findUnique({
            where: { id: data.zoneId },
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
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

        // Validate ward number is within city corporation's range
        const minWard = zone.cityCorporation.minWard || 1;
        const maxWard = zone.cityCorporation.maxWard || 100;

        if (data.wardNumber < minWard || data.wardNumber > maxWard) {
            throw new Error(`Ward number must be between ${minWard} and ${maxWard} for ${zone.cityCorporation.name}`);
        }

        // Check ward limit (max 999 wards per zone - effectively unlimited)
        if (zone._count.wards >= 999) {
            throw new Error(
                `Cannot add ward. Zone ${zone.zoneNumber} already has the maximum of 999 wards.`
            );
        }

        // Check if ward number already exists in this city corporation (globally unique)
        const existing = await prisma.ward.findFirst({
            where: {
                wardNumber: data.wardNumber,
                cityCorporationId: zone.cityCorporationId,
            },
        });

        if (existing) {
            const existingZone = await prisma.zone.findUnique({
                where: { id: existing.zoneId },
                select: { zoneNumber: true, name: true },
            });
            throw new Error(
                `Ward ${data.wardNumber} is already used in ${existingZone?.name || 'Zone ' + existingZone?.zoneNumber}. Each ward number can only be used once per city corporation.`
            );
        }

        const ward = await prisma.ward.create({
            data: {
                wardNumber: data.wardNumber,
                number: data.wardNumber, // Required field
                zoneId: data.zoneId,
                cityCorporationId: zone.cityCorporationId, // Required field
                inspectorName: data.inspectorName,
                inspectorSerialNumber: data.inspectorSerialNumber,
                inspectorPhone: data.inspectorPhone,
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
    async createWardsBulk(zoneId: number, wardNumbers: number[]) {
        // Validate zone exists and get city corporation with limits
        const zone = await prisma.zone.findUnique({
            where: { id: zoneId },
            include: {
                cityCorporation: {
                    select: {
                        id: true,
                        name: true,
                        minWard: true,
                        maxWard: true,
                    },
                },
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

        // Validate ward numbers are within city corporation's range
        const uniqueWardNumbers = Array.from(new Set(wardNumbers));
        const minWard = zone.cityCorporation.minWard || 1;
        const maxWard = zone.cityCorporation.maxWard || 100;

        const invalidWards = uniqueWardNumbers.filter(num => num < minWard || num > maxWard);
        if (invalidWards.length > 0) {
            throw new Error(`Ward numbers must be between ${minWard} and ${maxWard} for ${zone.cityCorporation.name}. Invalid: ${invalidWards.join(', ')}`);
        }

        // Check ward limit (max 999 wards per zone - effectively unlimited)
        const totalWardsAfterAdd = zone._count.wards + uniqueWardNumbers.length;
        if (totalWardsAfterAdd > 999) {
            throw new Error(
                `Cannot add ${uniqueWardNumbers.length} wards. Zone ${zone.zoneNumber} would exceed the maximum of 999 wards (currently has ${zone._count.wards}).`
            );
        }

        // Check if any ward numbers already exist in this city corporation (globally unique)
        const existingWards = await prisma.ward.findMany({
            where: {
                cityCorporationId: zone.cityCorporationId,
                wardNumber: {
                    in: uniqueWardNumbers,
                },
            },
            select: {
                wardNumber: true,
                zone: {
                    select: {
                        zoneNumber: true,
                        name: true,
                    },
                },
            },
        });

        if (existingWards.length > 0) {
            const existingDetails = existingWards.map(
                w => `Ward ${w.wardNumber} (in ${w.zone.name || 'Zone ' + w.zone.zoneNumber})`
            );
            throw new Error(
                `The following wards are already used in this city corporation: ${existingDetails.join(', ')}. Each ward number can only be used once per city corporation.`
            );
        }

        // Create wards in a transaction
        const wards = await prisma.$transaction(
            uniqueWardNumbers.map(wardNumber =>
                prisma.ward.create({
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
                })
            )
        );

        return wards;
    }

    /**
     * Update ward
     */
    async updateWard(id: number, data: UpdateWardDto) {
        // Check if ward exists
        const existingWard = await this.getWardById(id);

        let targetZoneId = existingWard.zoneId;
        const targetWardNumber = data.wardNumber ?? existingWard.wardNumber; // Valid since existingWard.wardNumber is Int
        let isMovingZone = false;

        // If updating zone, validate new zone
        if (data.zoneId && data.zoneId !== existingWard.zoneId) {
            isMovingZone = true;
            targetZoneId = data.zoneId;

            // Validate new zone exists
            const newZone = await prisma.zone.findUnique({
                where: { id: data.zoneId },
                include: { _count: { select: { wards: true } } }
            });

            if (!newZone) {
                throw new Error(`Zone with ID ${data.zoneId} not found`);
            }

            // Check ward limits in new zone (max 999 - effectively unlimited)
            if (newZone._count.wards >= 999) {
                throw new Error(`Cannot move ward to Zone ${newZone.zoneNumber}. It already has the maximum of 999 wards.`);
            }
        }

        // If ward number OR zone is changing, validate uniqueness in the TARGET City Corporation
        if (isMovingZone || (data.wardNumber && data.wardNumber !== existingWard.wardNumber)) {
            // Get City Corp of target zone
            const targetZone = await prisma.zone.findUnique({
                where: { id: targetZoneId },
                select: { cityCorporationId: true, cityCorporation: true, zoneNumber: true, name: true }
            });

            if (!targetZone) throw new Error("Target zone not found");

            // Check uniqueness in target City Corp
            const conflict = await prisma.ward.findFirst({
                where: {
                    wardNumber: targetWardNumber,
                    cityCorporationId: targetZone.cityCorporationId,
                    id: { not: id } // Exclude self
                },
                include: { zone: true }
            });

            if (conflict) {
                throw new Error(`Ward number ${targetWardNumber} is already used in ${conflict.zone.name || 'Zone ' + conflict.zone.zoneNumber} (City Corp: ${targetZone.cityCorporation.name})`);
            }

            // Also validate range for target city corp
            const min = targetZone.cityCorporation.minWard || 1;
            const max = targetZone.cityCorporation.maxWard || 100;

            // Should not happen as wardNumber is required, but TS needs assurance
            if (targetWardNumber === undefined || targetWardNumber === null) {
                throw new Error("Ward number is missing");
            }

            if (targetWardNumber < min || targetWardNumber > max) {
                throw new Error(`Ward number ${targetWardNumber} is invalid for ${targetZone.cityCorporation.name} (Range: ${min}-${max})`);
            }
        }

        const ward = await prisma.ward.update({
            where: { id },
            data: {
                wardNumber: data.wardNumber,
                number: data.wardNumber, // Sync 'number' field
                zoneId: data.zoneId, // Update Zone if provided
                cityCorporationId: isMovingZone ? (await prisma.zone.findUnique({ where: { id: targetZoneId } }))?.cityCorporationId : undefined, // Update CityCorp if moving zone
                inspectorName: data.inspectorName,
                inspectorSerialNumber: data.inspectorSerialNumber,
                inspectorPhone: data.inspectorPhone,
                status: data.status,
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
    async deleteWard(id: number): Promise<void> {
        // Check if ward exists
        const ward = await this.getWardById(id);

        // Check if ward has users
        const userCount = await prisma.user.count({
            where: { wardId: id },
        });

        if (userCount > 0) {
            throw new Error(
                `Cannot delete ward. It has ${userCount} user(s) assigned. Please reassign all users first.`
            );
        }

        await prisma.ward.delete({
            where: { id },
        });
    }

    /**
     * Get ward statistics
     */
    async getWardStats(id: number): Promise<WardStats> {
        // Verify ward exists
        await this.getWardById(id);

        // Get total users
        const totalUsers = await prisma.user.count({
            where: {
                wardId: id,
            },
        });

        // Get total complaints (through user relationship)
        const totalComplaints = await prisma.complaint.count({
            where: {
                user: {
                    wardId: id,
                },
            },
        });

        // Get total images (sum of wardImageCount for all users in this ward)
        const imageCountResult = await prisma.user.aggregate({
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
    async canUserUploadImage(userId: number, wardId: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
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

        // Check if user has already uploaded the maximum (10 images per ward)
        return user.wardImageCount < 10;
    }

    /**
     * Validate ward number for zone (checks city corporation level uniqueness)
     */
    async validateWardNumber(zoneId: number, wardNumber: number): Promise<boolean> {
        // Get zone to find city corporation with limits
        const zone = await prisma.zone.findUnique({
            where: { id: zoneId },
            select: {
                cityCorporationId: true,
                cityCorporation: {
                    select: {
                        minWard: true,
                        maxWard: true,
                    },
                },
            },
        });

        if (!zone) {
            return false;
        }

        // Validate ward number is within city corporation's range
        const minWard = zone.cityCorporation.minWard || 1;
        const maxWard = zone.cityCorporation.maxWard || 100;

        if (wardNumber < minWard || wardNumber > maxWard) {
            return false;
        }

        // Check if ward number already exists in this city corporation (globally unique)
        const existing = await prisma.ward.findFirst({
            where: {
                wardNumber,
                cityCorporationId: zone.cityCorporationId,
            },
        });

        // Return true if ward number is available (doesn't exist)
        return !existing;
    }

    /**
     * Check if ward is active
     */
    async isActive(id: number): Promise<boolean> {
        const ward = await prisma.ward.findUnique({
            where: { id },
            select: { status: true },
        });

        return ward?.status === 'ACTIVE';
    }

    /**
     * Validate ward belongs to zone
     */
    async validateWardBelongsToZone(
        wardId: number,
        zoneId: number
    ): Promise<boolean> {
        const ward = await prisma.ward.findUnique({
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
    async updateWardInspector(
        id: number,
        inspectorData: {
            inspectorName?: string;
            inspectorSerialNumber?: string;
            inspectorPhone?: string;
        }
    ) {
        // Check if ward exists
        await this.getWardById(id);

        // Validate inspector data if provided
        if (inspectorData.inspectorName !== undefined && inspectorData.inspectorName.trim() === '') {
            throw new Error('Inspector name cannot be empty');
        }

        const ward = await prisma.ward.update({
            where: { id },
            data: {
                inspectorName: inspectorData.inspectorName,
                inspectorSerialNumber: inspectorData.inspectorSerialNumber,
                inspectorPhone: inspectorData.inspectorPhone,
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
    async getWardInspector(id: number) {
        const ward = await prisma.ward.findUnique({
            where: { id },
            select: {
                id: true,
                wardNumber: true,
                inspectorName: true,
                inspectorSerialNumber: true,
                inspectorPhone: true,
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
                phone: ward.inspectorPhone,
            },
        };
    }

    /**
     * Validate inspector data
     */
    validateInspectorData(inspectorData: {
        inspectorName?: string;
        inspectorSerialNumber?: string;
        inspectorPhone?: string;
    }): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Inspector name validation
        if (inspectorData.inspectorName !== undefined) {
            if (typeof inspectorData.inspectorName !== 'string') {
                errors.push('Inspector name must be a string');
            } else if (inspectorData.inspectorName.trim() === '') {
                errors.push('Inspector name cannot be empty');
            } else if (inspectorData.inspectorName.length > 255) {
                errors.push('Inspector name cannot exceed 255 characters');
            }
        }

        // Inspector serial number validation
        if (inspectorData.inspectorSerialNumber !== undefined) {
            if (typeof inspectorData.inspectorSerialNumber !== 'string') {
                errors.push('Inspector serial number must be a string');
            } else if (inspectorData.inspectorSerialNumber.length > 100) {
                errors.push('Inspector serial number cannot exceed 100 characters');
            }
        }

        // Inspector phone validation
        if (inspectorData.inspectorPhone !== undefined) {
            if (typeof inspectorData.inspectorPhone !== 'string') {
                errors.push('Inspector phone must be a string');
            } else if (inspectorData.inspectorPhone.length > 20) {
                errors.push('Inspector phone cannot exceed 20 characters');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get available ward numbers for a zone (not already used in city corporation)
     * Ward numbers are unique per city corporation, not per zone
     */
    async getAvailableWardNumbers(zoneId: number): Promise<number[]> {
        // Validate zone exists and get city corporation with limits
        const zone = await prisma.zone.findUnique({
            where: { id: zoneId },
            select: {
                id: true,
                cityCorporationId: true,
                cityCorporation: {
                    select: {
                        minWard: true,
                        maxWard: true,
                    },
                },
            },
        });

        if (!zone) {
            throw new Error(`Zone with ID ${zoneId} not found`);
        }

        // Get ward range from city corporation
        const minWard = zone.cityCorporation.minWard || 1;
        const maxWard = zone.cityCorporation.maxWard || 100;

        // Get existing ward numbers for this CITY CORPORATION (not just this zone)
        // Ward numbers are unique per city corporation
        const existingWards = await prisma.ward.findMany({
            where: {
                cityCorporationId: zone.cityCorporationId
            },
            select: { wardNumber: true },
        });

        const existingNumbers = existingWards.map(w => w.wardNumber);

        // Generate available numbers (minWard to maxWard, excluding existing)
        const availableNumbers: number[] = [];
        for (let i = minWard; i <= maxWard; i++) {
            if (!existingNumbers.includes(i)) {
                availableNumbers.push(i);
            }
        }

        return availableNumbers;
    }

    /**
     * Check ward limit for zone
     */
    async checkWardLimit(zoneId: number): Promise<{ canAddMore: boolean; currentCount: number; maxAllowed: number }> {
        const currentCount = await prisma.ward.count({
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

export default new WardService();