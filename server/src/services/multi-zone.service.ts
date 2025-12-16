import prisma from '../utils/prisma';
import { users_role } from '@prisma/client';
import { activityLogService } from './activity-log.service';

export interface AssignZonesDto {
    userId: number;
    zoneIds: number[];
    cityCorporationCode?: string;
}

export interface AssignedZone {
    id: number;
    zoneNumber: number | null;
    number: number;
    name: string;
    cityCorporationId: number;
    officerName: string | null;
    officerDesignation: string | null;
    status: string;
}

export class MultiZoneService {
    /**
     * Assign multiple zones to a Super Admin
     * Validates: 2-5 zones, same city corporation, user is SUPER_ADMIN
     */
    async assignZonesToSuperAdmin(
        data: AssignZonesDto,
        assignedBy: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        // Validation 1: Check zone count (2-5)
        if (data.zoneIds.length < 2 || data.zoneIds.length > 5) {
            throw new Error('Super Admin must be assigned 2 to 5 zones');
        }

        // Validation 2: Check user exists and is SUPER_ADMIN
        const user = await prisma.user.findUnique({
            where: { id: data.userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role !== users_role.SUPER_ADMIN) {
            throw new Error('Only Super Admins can be assigned multiple zones');
        }

        // Validation 3: Check all zones exist and belong to same city corporation
        const zones = await prisma.zone.findMany({
            where: {
                id: { in: data.zoneIds },
            },
        });

        if (zones.length !== data.zoneIds.length) {
            throw new Error('One or more zones not found');
        }

        const allSameCityCorp = zones.every(
            (z) => z.cityCorporationId === zones[0].cityCorporationId
        );

        if (!allSameCityCorp) {
            throw new Error('All zones must belong to the same City Corporation');
        }

        // Validation 4: Check for duplicate zone assignments
        const uniqueZoneIds = [...new Set(data.zoneIds)];
        if (uniqueZoneIds.length !== data.zoneIds.length) {
            throw new Error('Duplicate zone assignments are not allowed');
        }

        // Get city corporation code from zones
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { id: zones[0].cityCorporationId },
        });

        if (!cityCorporation) {
            throw new Error('City Corporation not found');
        }

        // Delete existing zone assignments
        await prisma.userZone.deleteMany({
            where: { userId: data.userId },
        });

        // Create new zone assignments
        await prisma.userZone.createMany({
            data: data.zoneIds.map((zoneId) => ({
                userId: data.userId,
                zoneId,
                assignedBy,
            })),
        });

        // Update user's primary zoneId to first assigned zone (for backward compatibility)
        await prisma.user.update({
            where: { id: data.userId },
            data: {
                zoneId: data.zoneIds[0],
                cityCorporationCode: cityCorporation.code,
            },
        });

        // Log activity
        await activityLogService.logActivity({
            userId: assignedBy,
            action: 'ASSIGN_ZONES',
            entityType: 'USER',
            entityId: data.userId,
            newValue: { zoneIds: data.zoneIds },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Get all zones assigned to a user
     */
    async getAssignedZones(userId: number): Promise<AssignedZone[]> {
        const userZones = await prisma.userZone.findMany({
            where: { userId },
            include: {
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        number: true,
                        name: true,
                        cityCorporationId: true,
                        officerName: true,
                        officerDesignation: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                zone: {
                    zoneNumber: 'asc',
                },
            },
        });

        return userZones.map((uz) => uz.zone);
    }

    /**
     * Get zone IDs for filtering queries
     */
    async getAssignedZoneIds(userId: number): Promise<number[]> {
        const userZones = await prisma.userZone.findMany({
            where: { userId },
            select: { zoneId: true },
        });

        return userZones.map((uz) => uz.zoneId);
    }

    /**
     * Update zone assignments
     */
    async updateZoneAssignments(
        userId: number,
        zoneIds: number[],
        updatedBy: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        // Get old assignments for logging
        const oldZoneIds = await this.getAssignedZoneIds(userId);

        // Use assignZonesToSuperAdmin for validation and update
        await this.assignZonesToSuperAdmin(
            {
                userId,
                zoneIds,
            },
            updatedBy,
            ipAddress,
            userAgent
        );

        // Log activity
        await activityLogService.logActivity({
            userId: updatedBy,
            action: 'UPDATE_ZONE_ASSIGNMENTS',
            entityType: 'USER',
            entityId: userId,
            oldValue: { zoneIds: oldZoneIds },
            newValue: { zoneIds },
            ipAddress,
            userAgent,
        });
    }

    /**
     * Check if user has access to a specific zone
     */
    async hasZoneAccess(userId: number, zoneId: number): Promise<boolean> {
        const count = await prisma.userZone.count({
            where: {
                userId,
                zoneId,
            },
        });

        return count > 0;
    }

    /**
     * Get all Super Admins assigned to a zone
     */
    async getSuperAdminsByZone(zoneId: number) {
        const userZones = await prisma.userZone.findMany({
            where: { zoneId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        avatar: true,
                        status: true,
                    },
                },
            },
        });

        return userZones.map((uz) => uz.user);
    }

    /**
     * Remove a specific zone from a Super Admin
     */
    async removeZoneFromSuperAdmin(
        userId: number,
        zoneId: number,
        removedBy: number,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        // Check if user has this zone assigned
        const userZone = await prisma.userZone.findUnique({
            where: {
                userId_zoneId: {
                    userId,
                    zoneId,
                },
            },
        });

        if (!userZone) {
            throw new Error('Zone not assigned to this user');
        }

        // Check remaining zones count
        const remainingZones = await prisma.userZone.count({
            where: { userId },
        });

        if (remainingZones <= 2) {
            throw new Error('Cannot remove zone. Super Admin must have at least 2 zones assigned');
        }

        // Remove the zone
        await prisma.userZone.delete({
            where: {
                userId_zoneId: {
                    userId,
                    zoneId,
                },
            },
        });

        // Update user's primary zoneId if it was the removed zone
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (user?.zoneId === zoneId) {
            // Get first remaining zone
            const firstZone = await prisma.userZone.findFirst({
                where: { userId },
                select: { zoneId: true },
            });

            if (firstZone) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { zoneId: firstZone.zoneId },
                });
            }
        }

        // Log activity
        await activityLogService.logActivity({
            userId: removedBy,
            action: 'REMOVE_ZONE',
            entityType: 'USER',
            entityId: userId,
            oldValue: { zoneId },
            ipAddress,
            userAgent,
        });
    }
}

export const multiZoneService = new MultiZoneService();
