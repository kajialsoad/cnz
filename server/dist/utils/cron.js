"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const notice_service_1 = __importDefault(require("../services/notice.service"));
/**
 * Initialize cron jobs
 */
const initCronJobs = () => {
    // Run at midnight every day
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log('🕒 Running cron job: Archiving expired notices...');
        try {
            const result = await notice_service_1.default.archiveExpiredNotices();
            console.log(`✅ Successfully archived ${result.count} expired notices.`);
        }
        catch (error) {
            console.error('❌ Error in archiving expired notices cron job:', error);
        }
    });
    console.log('🚀 Cron jobs initialized successfully');
};
exports.initCronJobs = initCronJobs;
