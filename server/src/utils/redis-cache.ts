/**
 * Redis Cache Service
 * 
 * Provides Redis-based caching with fallback to in-memory cache
 */

import { getRedisClient, isRedisAvailable } from '../config/redis.config';
import { queryCache } from './query-cache';

/**
 * Cache TTL constants (in seconds for Redis)
 */
export const RedisCacheTTL = {
    USER_LIST: 2 * 60,        // 2 minutes
    USER_STATS: 5 * 60,       // 5 minutes
    USER_DETAILS: 5 * 60,     // 5 minutes
    COMPLAINT_STATS: 5 * 60,  // 5 minutes
    ACTIVITY_LOGS: 1 * 60,    // 1 minute
    DASHBOARD_STATS: 5 * 60,  // 5 minutes
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
    async get<T>(key: string): Promise<T | null> {
        const redis = getRedisClient();

        // Use Redis if available
        if (redis && isRedisAvailable()) {
            try {
                const data = await redis.get(key);
                if (data) {
                    return JSON.parse(data) as T;
                }
                return null;
            } catch (error) {
                console.error('Redis get error:', error);
                // Fallback to in-memory cache
                return queryCache.get<T>(key);
            }
        }

        // Fallback to in-memory cache
        return queryCache.get<T>(key);
    }

    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in seconds
     */
    async set<T>(key: string, data: T, ttl: number): Promise<void> {
        const redis = getRedisClient();

        // Use Redis if available
        if (redis && isRedisAvailable()) {
            try {
                await redis.setex(key, ttl, JSON.stringify(data));
                return;
            } catch (error) {
                console.error('Redis set error:', error);
                // Fallback to in-memory cache
                queryCache.set(key, data, ttl * 1000); // Convert to milliseconds
                return;
            }
        }

        // Fallback to in-memory cache
        queryCache.set(key, data, ttl * 1000); // Convert to milliseconds
    }

    /**
     * Delete cached data
     * @param key Cache key
     */
    async delete(key: string): Promise<void> {
        const redis = getRedisClient();

        // Use Redis if available
        if (redis && isRedisAvailable()) {
            try {
                await redis.del(key);
            } catch (error) {
                console.error('Redis delete error:', error);
            }
        }

        // Also delete from in-memory cache
        queryCache.delete(key);
    }

    /**
     * Delete multiple keys matching a pattern
     * @param pattern Pattern to match (e.g., "users:*")
     */
    async deletePattern(pattern: string): Promise<void> {
        const redis = getRedisClient();

        // Use Redis if available
        if (redis && isRedisAvailable()) {
            try {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                }
            } catch (error) {
                console.error('Redis deletePattern error:', error);
            }
        }

        // Also invalidate in-memory cache
        const regexPattern = new RegExp(pattern.replace('*', '.*'));
        queryCache.invalidatePattern(regexPattern);
    }

    /**
     * Clear all cached data
     */
    async clear(): Promise<void> {
        const redis = getRedisClient();

        // Use Redis if available
        if (redis && isRedisAvailable()) {
            try {
                await redis.flushdb();
            } catch (error) {
                console.error('Redis clear error:', error);
            }
        }

        // Also clear in-memory cache
        queryCache.clear();
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{
        redis: {
            available: boolean;
            keys?: number;
            memory?: string;
        };
        inMemory: {
            size: number;
            keys: string[];
        };
    }> {
        const redis = getRedisClient();
        const inMemoryStats = queryCache.getStats();

        const stats: any = {
            redis: {
                available: isRedisAvailable(),
            },
            inMemory: {
                size: inMemoryStats.size,
                keys: inMemoryStats.keys,
            },
        };

        // Get Redis stats if available
        if (redis && isRedisAvailable()) {
            try {
                const dbsize = await redis.dbsize();
                const info = await redis.info('memory');
                const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);

                stats.redis.keys = dbsize;
                stats.redis.memory = memoryMatch ? memoryMatch[1] : 'unknown';
            } catch (error) {
                console.error('Redis stats error:', error);
            }
        }

        return stats;
    }

    /**
     * Check if Redis is available
     */
    isRedisAvailable(): boolean {
        return isRedisAvailable();
    }
}

// Create singleton instance
export const redisCache = new RedisCacheService();

/**
 * Helper function to wrap async functions with Redis caching
 */
export async function withRedisCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Try to get from cache
    const cached = await redisCache.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await redisCache.set(key, data, ttl);

    return data;
}

/**
 * Cache key generators (same as query-cache)
 */
export const RedisCacheKeys = {
    userList: (query: any) => `users:list:${JSON.stringify(query)}`,
    userStats: (cityCorp?: string, zone?: number, ward?: number, role?: string) =>
        `users:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}:${role || 'all'}`,
    userById: (id: number) => `users:${id}`,
    complaintStats: (userId: number) => `complaints:stats:${userId}`,
    activityLogs: (query: any) => `activity:logs:${JSON.stringify(query)}`,
    dashboardStats: (cityCorp?: string, zone?: number, ward?: number) =>
        `dashboard:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}`,
};

/**
 * Invalidate Redis cache on data changes
 */
export const invalidateRedisCache = {
    user: async (userId?: number) => {
        if (userId) {
            await redisCache.delete(RedisCacheKeys.userById(userId));
            await redisCache.delete(RedisCacheKeys.complaintStats(userId));
        }
        await redisCache.deletePattern('users:list:*');
        await redisCache.deletePattern('users:stats:*');
        await redisCache.deletePattern('dashboard:stats:*');
    },
    complaint: async () => {
        await redisCache.deletePattern('complaints:stats:*');
        await redisCache.deletePattern('users:stats:*');
        await redisCache.deletePattern('dashboard:stats:*');
    },
    activity: async () => {
        await redisCache.deletePattern('activity:logs:*');
    },
    all: async () => {
        await redisCache.clear();
    },
};
