import prisma from './src/utils/prisma';

async function main() {
    const userId = 659; // The user from the second screenshot
    console.log('Testing deletion for user', userId);

    try {
        const notifs = await prisma.notification.findMany({ where: { userId } });
        console.log('User has notifications:', notifs.length);

        // Let's call the actual service methods
        const { AdminUserService } = require('./src/services/admin.user.service');
        const adminUserService = new AdminUserService();

        console.log('Calling bulkDeleteUsers...');
        await adminUserService.bulkDeleteUsers([userId], 1, '127.0.0.1', 'Debug Script');
        console.log(`Successfully deleted user ${userId}!`);
    } catch (error) {
        console.error('Error during deletion:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
