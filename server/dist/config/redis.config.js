"use strict";
/**
 * Redis Configuration
 *
 * Configures Redis connection for caching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.closeRedisConnection = closeRedisConnection;
exports.isRedisAvailable = isRedisAvailable;
const ioredis_1 = __importDefault(require("ioredis"));
// Redis connection options
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
};
// Create Redis client
let redisClient = null;
/**
 * Get Redis client instance
 */
function getRedisClient() {
    // If Redis is disabled, return null
    if (process.env.REDIS_ENABLED === 'false') {
        return null;
    }
    // Create client if it doesn't exist
    if (!redisClient) {
        try {
            redisClient = new ioredis_1.default(redisOptions);
            redisClient.on('connect', () => {
                console.log('✅ Redis connected successfully');
            });
            redisClient.on('error', (error) => {
                console.error('❌ Redis connection error:', error.message);
                // Don't throw error - allow app to continue without Redis
            });
            redisClient.on('close', () => {
                console.log('🔌 Redis connection closed');
            });
            // Connect to Redis
            redisClient.connect().catch((error) => {
                console.error('❌ Failed to connect to Redis:', error.message);
                console.log('⚠️  Continuing without Redis caching');
                redisClient = null;
            });
        }
        catch (error) {
            console.error('❌ Failed to create Redis client:', error);
            console.log('⚠️  Continuing without Redis caching');
            redisClient = null;
        }
    }
    return redisClient;
}
/**
 * Close Redis connection
 */
async function closeRedisConnection() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('🔌 Redis connection closed');
    }
}
/**
 * Check if Redis is available
 */
function isRedisAvailable() {
    return redisClient !== null && redisClient.status === 'ready';
}
