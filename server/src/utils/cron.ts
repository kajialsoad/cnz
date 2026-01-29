import cron from 'node-cron';
import noticeService from '../services/notice.service';

/**
 * Initialize cron jobs
 */
export const initCronJobs = () => {
    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 Running cron job: Archiving expired notices...');
        try {
            const result = await noticeService.archiveExpiredNotices();
            console.log(`✅ Successfully archived ${result.count} expired notices.`);
        } catch (error) {
            console.error('❌ Error in archiving expired notices cron job:', error);
        }
    });

    console.log('🚀 Cron jobs initialized successfully');
};
