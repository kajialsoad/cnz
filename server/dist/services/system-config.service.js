"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigService = exports.SystemConfigService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class SystemConfigService {
    /**
     * Get a configuration value by key
     */
    async get(key, defaultValue = '') {
        try {
            const config = await prisma_1.default.systemConfig.findUnique({
                where: { key }
            });
            return config ? config.value : defaultValue;
        }
        catch (error) {
            console.error(`Error fetching config ${key}:`, error);
            return defaultValue;
        }
    }
    /**
     * Set a configuration value
     */
    async set(key, value, description) {
        try {
            return await prisma_1.default.systemConfig.upsert({
                where: { key },
                update: {
                    value,
                    ...(description && { description })
                },
                create: {
                    key,
                    value,
                    description
                }
            });
        }
        catch (error) {
            console.error(`Error setting config ${key}:`, error);
            throw error;
        }
    }
    /**
     * Get all configurations
     */
    async getAll() {
        return prisma_1.default.systemConfig.findMany();
    }
}
exports.SystemConfigService = SystemConfigService;
exports.systemConfigService = new SystemConfigService();
