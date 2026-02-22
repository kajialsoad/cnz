"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notice_service_1 = __importDefault(require("../services/notice.service"));
const auth_service_1 = require("../services/auth.service");
/**
 * Initialize cron jobs
 */
const initCronJobs = () => {
    // Run at midnight every day
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('🕒 Running cron job: Daily maintenance...');
        // Archive expired notices
        try {
            console.log('📦 Archiving expired notices...');
            const result = await notice_service_1.default.archiveExpiredNotices();
            console.log(`✅ Successfully archived ${result.count} expired notices.`);
        }
        catch (error) {
            console.error('❌ Error in archiving expired notices cron job:', error);
        }
        // Cleanup pending accounts
        try {
            console.log('🧹 Cleaning up expired pending accounts...');
            const result = await auth_service_1.authService.cleanupExpiredAccounts();
            console.log(`✅ Successfully cleaned up ${result.count} expired pending accounts.`);
        }
        catch (error) {
            console.error('❌ Error in cleaning up expired accounts cron job:', error);
        }
    });
    console.log('🚀 Cron jobs initialized successfully');
};
exports.initCronJobs = initCronJobs;
