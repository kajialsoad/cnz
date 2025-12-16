"use strict";
/**
 * Query Result Caching Utility
 *
 * Provides in-memory caching for database query results
 * to reduce database load and improve response times.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateCache = exports.CacheTTL = exports.CacheKeys = exports.queryCache = void 0;
exports.withCache = withCache;
class QueryCache {
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
    get(key) {
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
        return entry.data;
    }
    /**
     * Set cached data
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds
     */
    set(key, data, ttl) {
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
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear all cached data
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Invalidate cache entries matching a pattern
     * @param pattern RegExp pattern to match keys
     */
    invalidatePattern(pattern) {
        const keysToDelete = [];
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
    getStats() {
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
    startCleanupInterval() {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000);
    }
    /**
     * Clean up expired entries
     */
    cleanupExpired() {
        const now = Date.now();
        const keysToDelete = [];
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
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
    }
}
// Create singleton instance
exports.queryCache = new QueryCache();
/**
 * Cache key generators for common queries
 */
exports.CacheKeys = {
    userList: (query) => `users:list:${JSON.stringify(query)}`,
    userStats: (cityCorp, zone, ward, role) => `users:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}:${role || 'all'}`,
    userById: (id) => `users:${id}`,
    complaintStats: (userId) => `complaints:stats:${userId}`,
    activityLogs: (query) => `activity:logs:${JSON.stringify(query)}`,
    dashboardStats: (cityCorp, zone, ward) => `dashboard:stats:${cityCorp || 'all'}:${zone || 'all'}:${ward || 'all'}`,
};
/**
 * Cache TTL constants (in milliseconds)
 */
exports.CacheTTL = {
    USER_LIST: 2 * 60 * 1000, // 2 minutes
    USER_STATS: 5 * 60 * 1000, // 5 minutes
    USER_DETAILS: 5 * 60 * 1000, // 5 minutes
    COMPLAINT_STATS: 5 * 60 * 1000, // 5 minutes
    ACTIVITY_LOGS: 1 * 60 * 1000, // 1 minute
    DASHBOARD_STATS: 5 * 60 * 1000, // 5 minutes
};
/**
 * Helper function to wrap async functions with caching
 */
async function withCache(key, ttl, fetchFn) {
    // Try to get from cache
    const cached = exports.queryCache.get(key);
    if (cached !== null) {
        return cached;
    }
    // Fetch fresh data
    const data = await fetchFn();
    // Store in cache
    exports.queryCache.set(key, data, ttl);
    return data;
}
/**
 * Invalidate cache on data changes
 */
exports.invalidateCache = {
    user: (userId) => {
        if (userId) {
            exports.queryCache.delete(exports.CacheKeys.userById(userId));
            exports.queryCache.delete(exports.CacheKeys.complaintStats(userId));
        }
        exports.queryCache.invalidatePattern(/^users:list:/);
        exports.queryCache.invalidatePattern(/^users:stats:/);
        exports.queryCache.invalidatePattern(/^dashboard:stats:/);
    },
    complaint: () => {
        exports.queryCache.invalidatePattern(/^complaints:stats:/);
        exports.queryCache.invalidatePattern(/^users:stats:/);
        exports.queryCache.invalidatePattern(/^dashboard:stats:/);
    },
    activity: () => {
        exports.queryCache.invalidatePattern(/^activity:logs:/);
    },
    all: () => {
        exports.queryCache.clear();
    },
};
