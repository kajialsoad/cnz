"use strict";
/**
 * Redis Cache Service
 *
 * Provides Redis-based caching with fallback to in-memory cache
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateRedisCache = exports.RedisCacheKeys = exports.redisCache = exports.RedisCacheTTL = void 0;
exports.withRedisCache = withRedisCache;
const redis_config_1 = require("../config/redis.config");
const query_cache_1 = require("./query-cache");
/**
 * Cache TTL constants (in seconds for Redis)
 */
exports.RedisCacheTTL = {
    USER_LIST: 2 * 60, // 2 minutes
    USER_STATS: 5 * 60, // 5 minutes
    USER_DETAILS: 5 * 60, // 5 minutes
    COMPLAINT_STATS: 5 * 60, // 5 minutes
    ACTIVITY_LOGS: 1 * 60, // 1 minute
    DASHBOARD_STATS: 5 * 60, // 5 minutes
};
/**
 * Redis cache service with fallback to in-memory cache
 */
class RedisCacheService {
    /**
     * Get cached data
     * @param key Cache key
     * @returns Cached data or null if not found
     */
    async get(key) {
        const redis = (0, redis_config_1.getRedisClient)();
        // Use Redis if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                const data = await redis.get(key);
                if (data) {
                    return JSON.parse(data);
                }
                return null;
            }
            catch (error) {
                console.error('Redis get error:', error);
                // Fallback to in-memory cache
                return query_cache_1.queryCache.get(key);
            }
        }
        // Fallback to in-memory cache
        return query_cache_1.queryCache.get(key);
    }
    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in seconds
     */
    async set(key, data, ttl) {
        const redis = (0, redis_config_1.getRedisClient)();
        // Use Redis if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                await redis.setex(key, ttl, JSON.stringify(data));
                return;
            }
            catch (error) {
                console.error('Redis set error:', error);
                // Fallback to in-memory cache
                query_cache_1.queryCache.set(key, data, ttl * 1000); // Convert to milliseconds
                return;
            }
        }
        // Fallback to in-memory cache
        query_cache_1.queryCache.set(key, data, ttl * 1000); // Convert to milliseconds
    }
    /**
     * Delete cached data
     * @param key Cache key
     */
    async delete(key) {
        const redis = (0, redis_config_1.getRedisClient)();
        // Use Redis if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                await redis.del(key);
            }
            catch (error) {
                console.error('Redis delete error:', error);
            }
        }
        // Also delete from in-memory cache
        query_cache_1.queryCache.delete(key);
    }
    /**
     * Delete multiple keys matching a pattern
     * @param pattern Pattern to match (e.g., "users:*")
     */
    async deletePattern(pattern) {
        const redis = (0, redis_config_1.getRedisClient)();
        // Use Redis if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            }
            catch (error) {
                console.error('Redis deletePattern error:', error);
            }
        }
        // Also invalidate in-memory cache
        const regexPattern = new RegExp(pattern.replace('*', '.*'));
        query_cache_1.queryCache.invalidatePattern(regexPattern);
    }
    /**
     * Clear all cached data
     */
    async clear() {
        const redis = (0, redis_config_1.getRedisClient)();
        // Use Redis if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                await redis.flushdb();
            }
            catch (error) {
                console.error('Redis clear error:', error);
            }
        }
        // Also clear in-memory cache
        query_cache_1.queryCache.clear();
    }
    /**
     * Get cache statistics
     */
    async getStats() {
        const redis = (0, redis_config_1.getRedisClient)();
        const inMemoryStats = query_cache_1.queryCache.getStats();
        const stats = {
            redis: {
                available: (0, redis_config_1.isRedisAvailable)(),
            },
            inMemory: {
                size: inMemoryStats.size,
                keys: inMemoryStats.keys,
            },
        };
        // Get Redis stats if available
        if (redis && (0, redis_config_1.isRedisAvailable)()) {
            try {
                const dbsize = await redis.dbsize();
                const info = await redis.info('memory');
                const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
                stats.redis.keys = dbsize;
                stats.redis.memory = memoryMatch ? memoryMatch[1] : 'unknown';
            }
            catch (error) {
                console.error('Redis stats error:', error);
            }
        }
        return stats;
    }
    /**
     * Check if Redis is available
     */
    isRedisAvailable() {
        return (0, redis_config_1.isRedisAvailable)();
    }
}
// Create singleton instance
exports.redisCache = new RedisCacheService();
/**
 * Helper function to wrap async functions with Redis caching
 */
async function withRedisCache(key, ttl, fetchFn) {
    // Try to get from cache
    const cached = await exports.redisCache.get(key);
    if (cached !== null) {
        return cached;
    }
    // Fetch fresh data
    const data = await fetchFn();
    // Store in cache
    await exports.redisCache.set(key, data, ttl);
    return data;
}
/**
 * Cache key generators (same as query-cache)
 */
exports.RedisCacheKeys = {
    userList: (query) => `users:list:${JSON.stringify(query)}`,
    userStats: (cityCorp, zone, ward, role) => `users:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}:${role || 'all'}`,
    userById: (id) => `users:${id}`,
    complaintStats: (userId) => `complaints:stats:${userId}`,
    activityLogs: (query) => `activity:logs:${JSON.stringify(query)}`,
    dashboardStats: (cityCorp, zone, ward) => `dashboard:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}`,
};
/**
 * Invalidate Redis cache on data changes
 */
exports.invalidateRedisCache = {
    user: async (userId) => {
        if (userId) {
            await exports.redisCache.delete(exports.RedisCacheKeys.userById(userId));
            await exports.redisCache.delete(exports.RedisCacheKeys.complaintStats(userId));
        }
        await exports.redisCache.deletePattern('users:list:*');
        await exports.redisCache.deletePattern('users:stats:*');
        await exports.redisCache.deletePattern('dashboard:stats:*');
    },
    complaint: async () => {
        await exports.redisCache.deletePattern('complaints:stats:*');
        await exports.redisCache.deletePattern('users:stats:*');
        await exports.redisCache.deletePattern('dashboard:stats:*');
    },
    activity: async () => {
        await exports.redisCache.deletePattern('activity:logs:*');
    },
    all: async () => {
        await exports.redisCache.clear();
    },
};
