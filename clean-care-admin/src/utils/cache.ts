/**
 * Simple in-memory cache with TTL (Time To Live)
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

class Cache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Set a value in the cache with TTL
     */
    set<T>(key: string, data: T, ttl: number = 30000): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    /**
     * Get a value from the cache
     * Returns null if not found or expired
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        const now = Date.now();
        const age = now - entry.timestamp;

        // Check if cache entry has expired
        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Invalidate (delete) a cache entry
     */
    invalidate(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Invalidate all cache entries matching a pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern);
        const keysToDelete: string[] = [];

        this.cache.forEach((_, key) => {
            if (regex.test(key)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach((key) => this.cache.delete(key));
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        return this.get(key) !== null;
    }
}

// Export singleton instance
export const cache = new Cache();

// Export cache key generators for consistency
export const cacheKeys = {
    chatList: (filters?: string) => `chat-list${filters ? `-${filters}` : ''}`,
    chatMessages: (complaintId: number, page?: number) =>
        `chat-messages-${complaintId}${page ? `-page-${page}` : ''}`,
    chatStatistics: () => 'chat-statistics',
    complaintDetails: (complaintId: number) => `complaint-${complaintId}`,
    liveChatConversations: (filters?: string) => `live-chat-conversations${filters ? `-${filters}` : ''}`,
    liveChatMessages: (userId: number, page?: number) =>
        `live-chat-messages-${userId}${page ? `-page-${page}` : ''}`,
    liveChatStatistics: () => 'live-chat-statistics',
};
