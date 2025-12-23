"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardAnalyticsService = exports.DashboardAnalyticsService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const client_1 = require("@prisma/client");
const multi_zone_service_1 = require("./multi-zone.service");
class DashboardAnalyticsService {
    /**
     * Get dashboard statistics with geographical filtering and role-based access control
     */
    async getStatisticsByGeography(requestingUser, filters) {
        try {
            // Build geographical filter based on role and provided filters
            const userWhere = await this.buildGeographicalFilter(requestingUser, filters);
            // Get user counts
            const totalUsers = await prisma_1.default.user.count({ where: userWhere });
            // Build complaint filter via user relationship
            const complaintWhere = {};
            if (Object.keys(userWhere).length > 0) {
                complaintWhere.user = userWhere;
            }
            // Get complaint counts
            const [totalComplaints, resolvedComplaints, pendingComplaints, inProgressComplaints, rejectedComplaints] = await Promise.all([
                prisma_1.default.complaint.count({ where: complaintWhere }),
                prisma_1.default.complaint.count({
                    where: { ...complaintWhere, status: client_1.Complaint_status.RESOLVED }
                }),
                prisma_1.default.complaint.count({
                    where: { ...complaintWhere, status: client_1.Complaint_status.PENDING }
                }),
                prisma_1.default.complaint.count({
                    where: { ...complaintWhere, status: client_1.Complaint_status.IN_PROGRESS }
                }),
                prisma_1.default.complaint.count({
                    where: { ...complaintWhere, status: client_1.Complaint_status.REJECTED }
                })
            ]);
            const unresolvedComplaints = totalComplaints - resolvedComplaints - rejectedComplaints;
            const successRate = totalComplaints > 0
                ? Math.round((resolvedComplaints / totalComplaints) * 100 * 100) / 100
                : 0;
            // Calculate average resolution time (optional)
            const averageResolutionTime = await this.calculateAverageResolutionTime(complaintWhere);
            return {
                totalUsers,
                totalComplaints,
                resolvedComplaints,
                unresolvedComplaints,
                pendingComplaints,
                inProgressComplaints,
                rejectedComplaints,
                successRate,
                averageResolutionTime
            };
        }
        catch (error) {
            console.error('Error getting statistics by geography:', error);
            throw new Error(`Failed to fetch statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get City Corporation comparison data (MASTER_ADMIN only)
     */
    async getCityCorporationComparison(requestingUser) {
        try {
            // Only MASTER_ADMIN can access this
            if (requestingUser.role !== client_1.users_role.MASTER_ADMIN) {
                throw new Error('Only MASTER_ADMIN can access City Corporation comparison');
            }
            // Get all active city corporations
            const cityCorps = await prisma_1.default.cityCorporation.findMany({
                where: { status: 'ACTIVE' },
                select: {
                    code: true,
                    name: true
                },
                orderBy: { name: 'asc' }
            });
            // Get statistics for each city corporation
            const comparison = await Promise.all(cityCorps.map(async (cc) => {
                const stats = await this.getStatisticsByGeography(requestingUser, { cityCorporationCode: cc.code });
                return {
                    cityCorporation: cc,
                    statistics: stats
                };
            }));
            return comparison;
        }
        catch (error) {
            console.error('Error getting City Corporation comparison:', error);
            throw new Error(`Failed to fetch City Corporation comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Build geographical filter based on user role and provided filters
     * @private
     */
    async buildGeographicalFilter(requestingUser, filters) {
        const where = {};
        // Apply role-based automatic filtering
        if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
            // Get assigned zones for SUPER_ADMIN
            const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(requestingUser.id);
            if (assignedZoneIds.length > 0) {
                where.zoneId = { in: assignedZoneIds };
            }
        }
        else if (requestingUser.role === client_1.users_role.ADMIN) {
            // Filter by assigned ward for ADMIN
            if (requestingUser.wardId) {
                where.wardId = requestingUser.wardId;
            }
        }
        // MASTER_ADMIN has no automatic filtering
        // Apply additional user-provided filters (respecting role restrictions)
        if (filters) {
            if (filters.cityCorporationCode) {
                // MASTER_ADMIN can filter by any city corporation
                // SUPER_ADMIN and ADMIN: filter is applied if it doesn't conflict with their restrictions
                if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
                    where.cityCorporationCode = filters.cityCorporationCode;
                }
                else if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
                    // Only apply if zones belong to this city corporation
                    where.cityCorporationCode = filters.cityCorporationCode;
                }
                else if (requestingUser.role === client_1.users_role.ADMIN) {
                    // Only apply if admin's ward belongs to this city corporation
                    where.cityCorporationCode = filters.cityCorporationCode;
                }
            }
            if (filters.zoneId) {
                if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
                    where.zoneId = filters.zoneId;
                }
                else if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
                    // Only apply if zone is in assigned zones
                    const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(requestingUser.id);
                    if (assignedZoneIds.includes(filters.zoneId)) {
                        where.zoneId = filters.zoneId;
                    }
                }
                // ADMIN cannot filter by zone (fixed to their ward)
            }
            if (filters.wardId) {
                if (requestingUser.role === client_1.users_role.MASTER_ADMIN) {
                    where.wardId = filters.wardId;
                }
                else if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
                    // Only apply if ward belongs to assigned zones
                    const ward = await prisma_1.default.ward.findUnique({
                        where: { id: filters.wardId },
                        select: { zoneId: true }
                    });
                    if (ward) {
                        const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(requestingUser.id);
                        if (assignedZoneIds.includes(ward.zoneId)) {
                            where.wardId = filters.wardId;
                        }
                    }
                }
                else if (requestingUser.role === client_1.users_role.ADMIN) {
                    // Only apply if it's their assigned ward
                    if (filters.wardId === requestingUser.wardId) {
                        where.wardId = filters.wardId;
                    }
                }
            }
        }
        return where;
    }
    /**
     * Calculate average resolution time for complaints
     * @private
     */
    async calculateAverageResolutionTime(complaintWhere) {
        try {
            const resolvedComplaints = await prisma_1.default.complaint.findMany({
                where: {
                    ...complaintWhere,
                    status: client_1.Complaint_status.RESOLVED,
                    updatedAt: { not: null }
                },
                select: {
                    createdAt: true,
                    updatedAt: true
                }
            });
            if (resolvedComplaints.length === 0) {
                return undefined;
            }
            const totalResolutionTime = resolvedComplaints.reduce((sum, complaint) => {
                const resolutionTime = complaint.updatedAt.getTime() - complaint.createdAt.getTime();
                return sum + resolutionTime;
            }, 0);
            // Return average in hours
            const averageMs = totalResolutionTime / resolvedComplaints.length;
            const averageHours = Math.round((averageMs / (1000 * 60 * 60)) * 100) / 100;
            return averageHours;
        }
        catch (error) {
            console.error('Error calculating average resolution time:', error);
            return undefined;
        }
    }
    /**
     * Get statistics by zone (for zone-level analysis)
     */
    async getStatisticsByZone(requestingUser, zoneId) {
        return this.getStatisticsByGeography(requestingUser, { zoneId });
    }
    /**
     * Get statistics by ward (for ward-level analysis)
     */
    async getStatisticsByWard(requestingUser, wardId) {
        return this.getStatisticsByGeography(requestingUser, { wardId });
    }
    /**
     * Get zone comparison within a city corporation
     */
    async getZoneComparison(requestingUser, cityCorporationCode) {
        try {
            // Get zones for the city corporation
            const cityCorpId = await prisma_1.default.cityCorporation.findUnique({
                where: { code: cityCorporationCode },
                select: { id: true }
            });
            if (!cityCorpId) {
                throw new Error('City Corporation not found');
            }
            let zones = await prisma_1.default.zone.findMany({
                where: {
                    cityCorporationId: cityCorpId.id,
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    name: true,
                    zoneNumber: true
                },
                orderBy: { zoneNumber: 'asc' }
            });
            // Filter zones based on role
            if (requestingUser.role === client_1.users_role.SUPER_ADMIN) {
                const assignedZoneIds = await multi_zone_service_1.multiZoneService.getAssignedZoneIds(requestingUser.id);
                zones = zones.filter(z => assignedZoneIds.includes(z.id));
            }
            else if (requestingUser.role === client_1.users_role.ADMIN) {
                // ADMIN can only see their ward's zone
                if (requestingUser.zoneId) {
                    zones = zones.filter(z => z.id === requestingUser.zoneId);
                }
                else {
                    zones = [];
                }
            }
            // Get statistics for each zone
            const comparison = await Promise.all(zones.map(async (zone) => {
                const stats = await this.getStatisticsByZone(requestingUser, zone.id);
                return {
                    zone,
                    statistics: stats
                };
            }));
            return comparison;
        }
        catch (error) {
            console.error('Error getting zone comparison:', error);
            throw new Error(`Failed to fetch zone comparison: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.DashboardAnalyticsService = DashboardAnalyticsService;
exports.dashboardAnalyticsService = new DashboardAnalyticsService();
