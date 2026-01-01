"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function start() {
    try {
        console.log('🚀 Starting Clean Care API Server...');
        if (!env_1.default.DEMO_MODE) {
            await prisma.$connect();
            console.log('✅ Database connected');
            // Cleanup INACTIVE users (fix unique constraint violation)
            console.log('🧹 Cleaning up INACTIVE users...');
            const inactiveUsers = await prisma.user.findMany({
                where: { status: 'INACTIVE' },
            });
            let updatedCount = 0;
            for (const user of inactiveUsers) {
                let updated = false;
                const updateData = {};
                const suffix = `_deleted_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                if (user.phone && !user.phone.includes('_deleted_')) {
                    updateData.phone = `${user.phone}${suffix}`;
                    updated = true;
                }
                if (user.email && !user.email.includes('_deleted_')) {
                    updateData.email = `${user.email}${suffix}`;
                    updated = true;
                }
                if (updated) {
                    try {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: updateData,
                        });
                        updatedCount++;
                    }
                    catch (error) {
                        console.error(`Failed to cleanup user ${user.id}:`, error);
                    }
                }
            }
            console.log(`✅ Cleanup complete. Updated ${updatedCount} users.`);
        }
        app_1.default.listen(env_1.default.PORT, '0.0.0.0', () => {
            console.log(`\n✅ Server listening on:`);
            console.log(`  - Local:   http://localhost:${env_1.default.PORT}`);
            console.log(`  - Network: http://10.236.50.46:${env_1.default.PORT}`);
            console.log(`\n🌐 Server is accessible from any device on your WiFi network!`);
        });
    }
    catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}
start();
