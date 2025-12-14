/**
 * Query Result Caching Utility
 * 
 * Provides in-memory caching for database query results
 * to reduce database load and improve response times.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

class QueryCache {
    private cache: Map<string, CacheEntry<any>>;
    private cleanupInterval: NodeJS.Timeout | null;

    constructor() {
        this.cache = new Map();
        this.cleanupInterval = null;
        this.startCleanupInterval();
    }

    /**
     * Get cached data
     * @param key Cache key
     * @returns Cached data or null if not found or expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        // Check if entry has expired
        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds
     */
    set<T>(key: string, data: T, ttl: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Delete cached data
     * @param key Cache key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Invalidate cache entries matching a pattern
     * @param pattern RegExp pattern to match keys
     */
    invalidatePattern(pattern: RegExp): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        keys: string[];
        oldestEntry: number | null;
        newestEntry: number | null;
    } {
        const keys = Array.from(this.cache.keys());
        const entries = Array.from(this.cache.values());

        const timestamps = entries.map(e => e.timestamp);
        const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : null;
        const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : null;

        return {
            size: this.cache.size,
            keys,
            oldestEntry,
            newestEntry,
        };
    }

    /**
     * Start automatic cleanup of expired entries
     */
    private startCleanupInterval(): void {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }

    /**
     * Clean up expired entries
     */
    private cleanupExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
        }
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}

// Create singleton instance
export const queryCache = new QueryCache();

/**
 * Cache key generators for common queries
 */
export const CacheKeys = {
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
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
    USER_LIST: 2 * 60 * 1000,        // 2 minutes
    USER_STATS: 5 * 60 * 1000,       // 5 minutes
    USER_DETAILS: 5 * 60 * 1000,     // 5 minutes
    COMPLAINT_STATS: 5 * 60 * 1000,  // 5 minutes
    ACTIVITY_LOGS: 1 * 60 * 1000,    // 1 minute
    DASHBOARD_STATS: 5 * 60 * 1000,  // 5 minutes
};

/**
 * Helper function to wrap async functions with caching
 */
export async function withCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Try to get from cache
    const cached = queryCache.get<T>(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    queryCache.set(key, data, ttl);

    return data;
}

/**
 * Invalidate cache on data changes
 */
export const invalidateCache = {
    user: (userId?: number) => {
        if (userId) {
            queryCache.delete(CacheKeys.userById(userId));
            queryCache.delete(CacheKeys.complaintStats(userId));
        }
        queryCache.invalidatePattern(/^users:list:/);
        queryCache.invalidatePattern(/^users:stats:/);
        queryCache.invalidatePattern(/^dashboard:stats:/);
    },
    complaint: () => {
        queryCache.invalidatePattern(/^complaints:stats:/);
        queryCache.invalidatePattern(/^users:stats:/);
        queryCache.invalidatePattern(/^dashboard:stats:/);
    },
    activity: () => {
        queryCache.invalidatePattern(/^activity:logs:/);
    },
    all: () => {
        queryCache.clear();
    },
};
