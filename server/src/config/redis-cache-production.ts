/**
 * Production Redis Cache Configuration
 * Optimized for 500K users with proper connection pooling and error handling
 */

import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),

    // Connection pooling
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false, // Auto-connect on startup

    // Retry strategy
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
    },

    // Connection timeout
    connectTimeout: 10000,

    // Keep-alive
    keepAlive: 30000,
};

// Create Redis client
const redis = new Redis(redisConfig);

// Error handling
redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
    console.log('✅ Redis ready to accept commands');
});

redis.on('close', () => {
    console.warn('⚠️ Redis connection closed');
});

// Cache TTL configuration (in seconds)
export const CACHE_TTL = {
    // Static data (changes rarely)
    CITY_CORPORATIONS: 3600, // 1 hour
    ZONES: 1800, // 30 minutes
    WARDS: 1800, // 30 minutes
    CATEGORIES: 3600, // 1 hour

    // User data
    USER_PROFILE: 900, // 15 minutes
    USER_PERMISSIONS: 900, // 15 minutes
    USER_ZONES: 900, // 15 minutes

    // Dashboard data
    DASHBOARD_STATS: 300, // 5 minutes
    ANALYTICS: 600, // 10 minutes

    // Complaint data
    COMPLAINT_LIST: 180, // 3 minutes
    COMPLAINT_DETAILS: 300, // 5 minutes

    // Short-lived data
    RATE_LIMIT: 60, // 1 minute
    SESSION: 1800, // 30 minutes
};

// Cache key prefixes
export const CACHE_PREFIX = {
    CITY_CORPORATION: 'cc',
    ZONE: 'zone',
    WARD: 'ward',
    USER: 'user',
    COMPLAINT: 'complaint',
    DASHBOARD: 'dashboard',
    ANALYTICS: 'analytics',
    RATE_LIMIT: 'rate_limit',
    SESSION: 'session',
};

/**
 * Generate cache key with prefix
 */
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
}

/**
 * Get data from cache with fallback
 */
export async function getOrSetCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    try {
        // Try to get from cache
        const cached = await redis.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch fresh data
        const data = await fetchFn();

        // Store in cache
        await redis.setex(key, ttl, JSON.stringify(data));

        return data;
    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        // Fallback to direct fetch if cache fails
        return fetchFn();
    }
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`Invalidated ${keys.length} cache keys matching ${pattern}`);
        }
    } catch (error) {
        console.error(`Error invalidating cache pattern ${pattern}:`, error);
    }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Error invalidating cache key ${key}:`, error);
    }
}

/**
 * Cache invalidation helpers
 */
export const invalidateCacheHelpers = {
    // City Corporation
    cityCorporation: (code?: string) => {
        if (code) {
            return invalidateCache(getCacheKey(CACHE_PREFIX.CITY_CORPORATION, code));
        }
        return invalidateCachePattern(`${CACHE_PREFIX.CITY_CORPORATION}:*`);
    },

    // Zone
    zone: (id?: number) => {
        if (id) {
            return invalidateCache(getCacheKey(CACHE_PREFIX.ZONE, id));
        }
        return invalidateCachePattern(`${CACHE_PREFIX.ZONE}:*`);
    },

    // Ward
    ward: (id?: number) => {
        if (id) {
            return invalidateCache(getCacheKey(CACHE_PREFIX.WARD, id));
        }
        return invalidateCachePattern(`${CACHE_PREFIX.WARD}:*`);
    },

    // User
    user: (id?: number) => {
        if (id) {
            return Promise.all([
                invalidateCache(getCacheKey(CACHE_PREFIX.USER, id)),
                invalidateCache(getCacheKey(CACHE_PREFIX.USER, 'permissions', id)),
                invalidateCache(getCacheKey(CACHE_PREFIX.USER, 'zones', id)),
            ]);
        }
        return invalidateCachePattern(`${CACHE_PREFIX.USER}:*`);
    },

    // Complaint
    complaint: (id?: number) => {
        if (id) {
            return invalidateCache(getCacheKey(CACHE_PREFIX.COMPLAINT, id));
        }
        return invalidateCachePattern(`${CACHE_PREFIX.COMPLAINT}:*`);
    },

    // Dashboard
    dashboard: (userId?: number) => {
        if (userId) {
            return invalidateCache(getCacheKey(CACHE_PREFIX.DASHBOARD, userId));
        }
        return invalidateCachePattern(`${CACHE_PREFIX.DASHBOARD}:*`);
    },

    // Analytics
    analytics: () => {
        return invalidateCachePattern(`${CACHE_PREFIX.ANALYTICS}:*`);
    },
};

/**
 * Health check
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
    }
}

export default redis;
