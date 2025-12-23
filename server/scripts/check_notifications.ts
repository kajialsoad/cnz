
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Checking Recent Notifications ---');

        // count total
        const count = await prisma.notification.count();
        console.log(`Total Notifications in DB: ${count}`);

        // Fetch last 5
        const notifications = await prisma.notification.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        console.log('Last 5 Notifications:');
        notifications.forEach(n => {
            console.log(`[${n.id}] To: ${n.user.email} (${n.user.role}) | Type: ${n.type} | Title: ${n.title} | Read: ${n.isRead} | Created: ${n.createdAt}`);
        });

        console.log('-------------------------------------');

        // Check Admins
        const admins = await prisma.user.findMany({
            where: {
                role: {
                    in: ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN']
                },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true
            }
        });
        console.log(`Found ${admins.length} Active Admins:`);
        admins.forEach(a => console.log(`- ${a.email} (${a.role}) [${a.status}] ID: ${a.id}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
