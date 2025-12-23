
import { PrismaClient } from '@prisma/client';
import notificationService from '../src/services/notification.service';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Creating Test Notification ---');

        await notificationService.notifyAdmins(
            'Test Notification',
            'This is a manually triggered test notification to verify the system.',
            'INFO'
        );

        console.log('--- Verification ---');

        // Check last 5 notifications
        const notifications = await prisma.notification.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, id: true } } }
        });

        console.log('Recent Notifications in DB:');
        notifications.forEach(n => {
            console.log(`[${n.id}] To: ${n.user.email} (ID: ${n.user.id}) | Title: ${n.title} | Time: ${n.createdAt}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
