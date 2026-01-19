"use strict";
/**
 * Optimized City Corporation Service
 * Fixes N+1 query problem by using batch queries and Promise.all
 * Implements Redis caching for frequently accessed data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCityCorporationsWithStats = getCityCorporationsWithStats;
exports.getCityCorporationWithStats = getCityCorporationWithStats;
exports.getZonesByCityCorporation = getZonesByCityCorporation;
exports.getWardsByZone = getWardsByZone;
exports.invalidateCityCorporationCache = invalidateCityCorporationCache;
const client_1 = require("@prisma/client");
const redis_cache_production_1 = require("../config/redis-cache-production");
const prisma = new client_1.PrismaClient();
/**
 * Get all city corporations with statistics
 * OPTIMIZED: Uses batch queries instead of N+1 queries
 */
async function getCityCorporationsWithStats() {
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.CITY_CORPORATION, 'all', 'with-stats');
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.CITY_CORPORATIONS, async () => {
        // Step 1: Get all city corporations with basic counts
        const cityCorporations = await prisma.cityCorporation.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        zones: true,
                    },
                },
            },
        });
        // Step 2: Batch fetch all statistics in parallel (OPTIMIZED)
        const [complaintCounts, activeZoneCounts, wardCounts] = await Promise.all([
            // Get complaint counts grouped by city corporation
            prisma.complaint.groupBy({
                by: ['userId'],
                _count: { id: true },
            }).then(async (results) => {
                // Get user city corporation mapping
                const userIds = results.map(r => r.userId);
                const users = await prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, cityCorporationCode: true },
                });
                const userCityMap = new Map(users.map(u => [u.id, u.cityCorporationCode]));
                // Group by city corporation
                const cityComplaintMap = new Map();
                results.forEach(r => {
                    const cityCode = userCityMap.get(r.userId);
                    if (cityCode) {
                        cityComplaintMap.set(cityCode, (cityComplaintMap.get(cityCode) || 0) + r._count.id);
                    }
                });
                return cityComplaintMap;
            }),
            // Get active zone counts grouped by city corporation
            prisma.zone.groupBy({
                by: ['cityCorporationId'],
                where: { status: 'ACTIVE' },
                _count: { id: true },
            }).then(results => new Map(results.map(r => [r.cityCorporationId, r._count.id]))),
            // Get ward counts grouped by city corporation
            prisma.ward.groupBy({
                by: ['cityCorporationId'],
                _count: { id: true },
            }).then(results => new Map(results.map(r => [r.cityCorporationId, r._count.id]))),
        ]);
        // Step 3: Merge all data
        return cityCorporations.map(cc => ({
            id: cc.id,
            code: cc.code,
            name: cc.name,
            minWard: cc.minWard,
            maxWard: cc.maxWard,
            status: cc.status,
            totalUsers: cc._count.users,
            totalComplaints: complaintCounts.get(cc.code) || 0,
            totalZones: cc._count.zones,
            activeZones: activeZoneCounts.get(cc.id) || 0,
            totalWards: wardCounts.get(cc.id) || 0,
        }));
    });
}
/**
 * Get single city corporation with statistics
 */
async function getCityCorporationWithStats(code) {
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.CITY_CORPORATION, code, 'with-stats');
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.CITY_CORPORATIONS, async () => {
        const cityCorporation = await prisma.cityCorporation.findUnique({
            where: { code },
            include: {
                _count: {
                    select: {
                        users: true,
                        zones: true,
                    },
                },
            },
        });
        if (!cityCorporation) {
            return null;
        }
        // Batch fetch statistics
        const [totalComplaints, activeZones, totalWards] = await Promise.all([
            prisma.complaint.count({
                where: {
                    user: {
                        cityCorporationCode: code,
                    },
                },
            }),
            prisma.zone.count({
                where: {
                    cityCorporationId: cityCorporation.id,
                    status: 'ACTIVE',
                },
            }),
            prisma.ward.count({
                where: {
                    cityCorporationId: cityCorporation.id,
                },
            }),
        ]);
        return {
            id: cityCorporation.id,
            code: cityCorporation.code,
            name: cityCorporation.name,
            minWard: cityCorporation.minWard,
            maxWard: cityCorporation.maxWard,
            status: cityCorporation.status,
            totalUsers: cityCorporation._count.users,
            totalComplaints,
            totalZones: cityCorporation._count.zones,
            activeZones,
            totalWards,
        };
    });
}
/**
 * Get zones for a city corporation with caching
 */
async function getZonesByCityCorporation(cityCorporationId) {
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.ZONE, 'city', cityCorporationId);
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.ZONES, async () => {
        return prisma.zone.findMany({
            where: {
                cityCorporationId,
                status: 'ACTIVE',
            },
            orderBy: {
                number: 'asc',
            },
        });
    });
}
/**
 * Get wards for a zone with caching
 */
async function getWardsByZone(zoneId) {
    const cacheKey = (0, redis_cache_production_1.getCacheKey)(redis_cache_production_1.CACHE_PREFIX.WARD, 'zone', zoneId);
    return (0, redis_cache_production_1.getOrSetCache)(cacheKey, redis_cache_production_1.CACHE_TTL.WARDS, async () => {
        return prisma.ward.findMany({
            where: {
                zoneId,
                status: 'ACTIVE',
            },
            orderBy: {
                number: 'asc',
            },
        });
    });
}
/**
 * Invalidate city corporation cache
 */
async function invalidateCityCorporationCache(code) {
    await redis_cache_production_1.invalidateCacheHelpers.cityCorporation(code);
    await redis_cache_production_1.invalidateCacheHelpers.zone();
    await redis_cache_production_1.invalidateCacheHelpers.ward();
}
exports.default = {
    getCityCorporationsWithStats,
    getCityCorporationWithStats,
    getZonesByCityCorporation,
    getWardsByZone,
    invalidateCityCorporationCache,
};
