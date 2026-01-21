
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debug User Counts ---');

    // 1. Total Users
    const totalUsers = await prisma.user.count();
    console.log(`Total Users in DB: ${totalUsers}`);

    // 2. Users by Role
    const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
    });
    console.log('Users by Role:', JSON.stringify(usersByRole, null, 2));

    // 3. Users by Status
    const usersByStatus = await prisma.user.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    console.log('Users by Status:', JSON.stringify(usersByStatus, null, 2));

    // 4. Customers by Status
    const customersByStatus = await prisma.user.groupBy({
        by: ['status'],
        where: { role: 'CUSTOMER' },
        _count: { id: true }
    });
    console.log('Customers by Status:', JSON.stringify(customersByStatus, null, 2));

    // 5. Test LiveChat Query logic
    // Mocking Admin ID (assuming 1 or whatever Master Admin is)
    const masterAdmin = await prisma.user.findFirst({ where: { role: 'MASTER_ADMIN' } });
    if (masterAdmin) {
        console.log(`Master Admin ID: ${masterAdmin.id}`);
        const liveChatCount = await prisma.user.count({
            where: {
                id: { not: masterAdmin.id }
            }
        });
        console.log(`LiveChat Query Count (All except self): ${liveChatCount}`);
    } else {
        console.log('No Master Admin found');
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
