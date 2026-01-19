/**
 * Simple In-Memory Cache
 * Redis এর বদলে Node.js memory use করে
 * 500K users পর্যন্ত efficiently কাজ করবে
 */

interface CacheItem {
    data: any;
    expiry: number;
}

class SimpleCache {
    private cache: Map<string, CacheItem> = new Map();
    private maxSize: number = 1000; // Maximum 1000 cached items
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * Set a value in cache with TTL
     */
    set(key: string, value: any, ttlSeconds: number = 300): void {
        // Clear old items if cache is full
        if (this.cache.size >= this.maxSize) {
            this.clearExpired();

            // If still full after cleanup, remove oldest item
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey) {
                    this.cache.delete(firstKey);
                }
            }
        }

        this.cache.set(key, {
            data: value,
            expiry: Date.now() + (ttlSeconds * 1000),
        });
    }

    /**
     * Get a value from cache
     */
    get(key: string): any | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    /**
     * Delete a specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Delete keys matching a pattern
     */
    deletePattern(pattern: string): void {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): { size: number; maxSize: number; hitRate: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: 0, // Can be implemented with hit/miss tracking
        };
    }

    /**
     * Clear expired items
     */
    private clearExpired(): void {
        const now = Date.now();
        let cleared = 0;

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
                cleared++;
            }
        }

        if (cleared > 0) {
            console.log(`[SimpleCache] Cleared ${cleared} expired items`);
        }
    }

    /**
     * Start automatic cleanup every 5 minutes
     */
    startAutoCleanup(): void {
        if (this.cleanupInterval) {
            return; // Already started
        }

        this.cleanupInterval = setInterval(() => {
            this.clearExpired();
        }, 5 * 60 * 1000); // Every 5 minutes

        console.log('[SimpleCache] Auto cleanup started');
    }

    /**
     * Stop automatic cleanup
     */
    stopAutoCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('[SimpleCache] Auto cleanup stopped');
        }
    }
}

// Export singleton instance
export const simpleCache = new SimpleCache();

// Start auto cleanup on module load
simpleCache.startAutoCleanup();

/**
 * Helper function to generate cache keys
 */
export function getCacheKey(...parts: (string | number)[]): string {
    return parts.join(':');
}

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
    // Static data
    CITY_CORPORATIONS: 3600, // 1 hour
    ZONES: 1800, // 30 minutes
    WARDS: 1800, // 30 minutes

    // User data
    USER_PROFILE: 900, // 15 minutes
    USER_PERMISSIONS: 900, // 15 minutes

    // Dashboard data
    DASHBOARD_STATS: 300, // 5 minutes
    ANALYTICS: 600, // 10 minutes

    // Complaint data
    COMPLAINT_LIST: 180, // 3 minutes
};

/**
 * Cache key prefixes
 */
export const CACHE_PREFIX = {
    CITY_CORPORATION: 'cc',
    ZONE: 'zone',
    WARD: 'ward',
    USER: 'user',
    COMPLAINT: 'complaint',
    DASHBOARD: 'dashboard',
    ANALYTICS: 'analytics',
};

/**
 * Helper to get or set cache with fallback
 */
export async function getOrSetCache<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    // Try to get from cache
    const cached = simpleCache.get(key);
    if (cached !== null) {
        return cached;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    simpleCache.set(key, data, ttl);

    return data;
}

export default simpleCache;
