import cron from 'node-cron';
import noticeService from '../services/notice.service';
import { authService } from '../services/auth.service';

/**
 * Initialize cron jobs
 */
export const initCronJobs = () => {
    // Run at midnight every day
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 Running cron job: Daily maintenance...');
        
        // Archive expired notices
        try {
            console.log('📦 Archiving expired notices...');
            const result = await noticeService.archiveExpiredNotices();
            console.log(`✅ Successfully archived ${result.count} expired notices.`);
        } catch (error) {
            console.error('❌ Error in archiving expired notices cron job:', error);
        }

        // Cleanup pending accounts
        try {
            console.log('🧹 Cleaning up expired pending accounts...');
            const result = await authService.cleanupExpiredAccounts();
            console.log(`✅ Successfully cleaned up ${result.count} expired pending accounts.`);
        } catch (error) {
            console.error('❌ Error in cleaning up expired accounts cron job:', error);
        }
    });

    console.log('🚀 Cron jobs initialized successfully');
};
