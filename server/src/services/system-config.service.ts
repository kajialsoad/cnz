import prisma from '../utils/prisma';

export class SystemConfigService {
    /**
     * Get a configuration value by key
     */
    async get(key: string, defaultValue: string = ''): Promise<string> {
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key }
            });
            return config ? config.value : defaultValue;
        } catch (error) {
            console.error(`Error fetching config ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Set a configuration value
     */
    async set(key: string, value: string, description?: string): Promise<any> {
        try {
            return await prisma.systemConfig.upsert({
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
        } catch (error) {
            console.error(`Error setting config ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get all configurations
     */
    async getAll() {
        return prisma.systemConfig.findMany();
    }
}

export const systemConfigService = new SystemConfigService();
