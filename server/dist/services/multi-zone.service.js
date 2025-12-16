"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.multiZoneService = exports.MultiZoneService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const activity_log_service_1 = require("./activity-log.service");
class MultiZoneService {
    /**
     * Assign multiple zones to a Super Admin
     * Validates: 2-5 zones, same city corporation, user is SUPER_ADMIN
     */
    async assignZonesToSuperAdmin(data, assignedBy, ipAddress, userAgent) {
        // Validation 1: Check zone count (2-5)
        if (data.zoneIds.length < 2 || data.zoneIds.length > 5) {
            throw new Error('Super Admin must be assigned 2 to 5 zones');
        }
        // Validation 2: Check user exists and is SUPER_ADMIN
        const user = await prisma_1.default.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.role !== client_1.users_role.SUPER_ADMIN) {
            throw new Error('Only Super Admins can be assigned multiple zones');
        }
        // Validation 3: Check all zones exist and belong to same city corporation
        const zones = await prisma_1.default.zone.findMany({
            where: {
                id: { in: data.zoneIds },
            },
        });
        if (zones.length !== data.zoneIds.length) {
            throw new Error('One or more zones not found');
        }
        const allSameCityCorp = zones.every((z) => z.cityCorporationId === zones[0].cityCorporationId);
        if (!allSameCityCorp) {
            throw new Error('All zones must belong to the same City Corporation');
        }
        // Validation 4: Check for duplicate zone assignments
        const uniqueZoneIds = [...new Set(data.zoneIds)];
        if (uniqueZoneIds.length !== data.zoneIds.length) {
            throw new Error('Duplicate zone assignments are not allowed');
        }
        // Get city corporation code from zones
        const cityCorporation = await prisma_1.default.cityCorporation.findUnique({
            where: { id: zones[0].cityCorporationId },
        });
        if (!cityCorporation) {
            throw new Error('City Corporation not found');
        }
        // Delete existing zone assignments
        await prisma_1.default.userZone.deleteMany({
            where: { userId: data.userId },
        });
        // Create new zone assignments
        await prisma_1.default.userZone.createMany({
            data: data.zoneIds.map((zoneId) => ({
                userId: data.userId,
                zoneId,
                assignedBy,
            })),
        });
        // Update user's primary zoneId to first assigned zone (for backward compatibility)
        await prisma_1.default.user.update({
            where: { id: data.userId },
            data: {
                zoneId: data.zoneIds[0],
                cityCorporationCode: cityCorporation.code,
            },
        });
        // Log activity
        await activity_log_service_1.activityLogService.logActivity({
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
    async getAssignedZones(userId) {
        const userZones = await prisma_1.default.userZone.findMany({
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
    async getAssignedZoneIds(userId) {
        const userZones = await prisma_1.default.userZone.findMany({
            where: { userId },
            select: { zoneId: true },
        });
        return userZones.map((uz) => uz.zoneId);
    }
    /**
     * Update zone assignments
     */
    async updateZoneAssignments(userId, zoneIds, updatedBy, ipAddress, userAgent) {
        // Get old assignments for logging
        const oldZoneIds = await this.getAssignedZoneIds(userId);
        // Use assignZonesToSuperAdmin for validation and update
        await this.assignZonesToSuperAdmin({
            userId,
            zoneIds,
        }, updatedBy, ipAddress, userAgent);
        // Log activity
        await activity_log_service_1.activityLogService.logActivity({
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
    async hasZoneAccess(userId, zoneId) {
        const count = await prisma_1.default.userZone.count({
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
    async getSuperAdminsByZone(zoneId) {
        const userZones = await prisma_1.default.userZone.findMany({
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
    async removeZoneFromSuperAdmin(userId, zoneId, removedBy, ipAddress, userAgent) {
        // Check if user has this zone assigned
        const userZone = await prisma_1.default.userZone.findUnique({
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
        const remainingZones = await prisma_1.default.userZone.count({
            where: { userId },
        });
        if (remainingZones <= 2) {
            throw new Error('Cannot remove zone. Super Admin must have at least 2 zones assigned');
        }
        // Remove the zone
        await prisma_1.default.userZone.delete({
            where: {
                userId_zoneId: {
                    userId,
                    zoneId,
                },
            },
        });
        // Update user's primary zoneId if it was the removed zone
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (user?.zoneId === zoneId) {
            // Get first remaining zone
            const firstZone = await prisma_1.default.userZone.findFirst({
                where: { userId },
                select: { zoneId: true },
            });
            if (firstZone) {
                await prisma_1.default.user.update({
                    where: { id: userId },
                    data: { zoneId: firstZone.zoneId },
                });
            }
        }
        // Log activity
        await activity_log_service_1.activityLogService.logActivity({
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
exports.MultiZoneService = MultiZoneService;
exports.multiZoneService = new MultiZoneService();
