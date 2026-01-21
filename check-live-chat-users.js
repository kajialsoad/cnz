const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLiveChatUsers() {
    try {
        console.log('=== Live Chat Users Check ===\n');

        // Check total CUSTOMER users
        const totalCustomers = await prisma.user.count({
            where: { role: 'CUSTOMER', status: 'ACTIVE' }
        });
        console.log(`Total CUSTOMER users: ${totalCustomers}\n`);

        // Get sample admins
        const admins = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN'] },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true
            },
            take: 5
        });

        console.log('Sample Admins:');
        admins.forEach(admin => {
            console.log(`  - ${admin.firstName} ${admin.lastName} (ID: ${admin.id})`);
            console.log(`    Role: ${admin.role}`);
            console.log(`    Ward: ${admin.wardId || 'N/A'}`);
            console.log(`    Zone: ${admin.zoneId || 'N/A'}`);
            console.log(`    City Corp: ${admin.cityCorporationCode || 'N/A'}\n`);
        });

        // Check users for each admin
        for (const admin of admins) {
            let userCount = 0;
            let whereClause = { role: 'CUSTOMER', status: 'ACTIVE' };

            if (admin.role === 'ADMIN' && admin.wardId) {
                whereClause.wardId = admin.wardId;
                userCount = await prisma.user.count({ where: whereClause });
                console.log(`Users in ${admin.role} ${admin.id}'s ward (${admin.wardId}): ${userCount}`);
            } else if (admin.role === 'SUPER_ADMIN' && admin.zoneId) {
                whereClause.zoneId = admin.zoneId;
                userCount = await prisma.user.count({ where: whereClause });
                console.log(`Users in ${admin.role} ${admin.id}'s zone (${admin.zoneId}): ${userCount}`);
            } else if (admin.role === 'MASTER_ADMIN' && admin.cityCorporationCode) {
                whereClause.cityCorporationCode = admin.cityCorporationCode;
                userCount = await prisma.user.count({ where: whereClause });
                console.log(`Users in ${admin.role} ${admin.id}'s city corp (${admin.cityCorporationCode}): ${userCount}`);

                // Show breakdown by zones for MASTER_ADMIN
                const zones = await prisma.zone.findMany({
                    where: { cityCorporationCode: admin.cityCorporationCode },
                    select: { id: true, name: true, number: true }
                });
                console.log(`  Zones in ${admin.cityCorporationCode}:`);
                for (const zone of zones) {
                    const zoneUserCount = await prisma.user.count({
                        where: {
                            role: 'CUSTOMER',
                            status: 'ACTIVE',
                            zoneId: zone.id
                        }
                    });
                    console.log(`    - Zone ${zone.number} (${zone.name}): ${zoneUserCount} users`);
                }
            }
            console.log('');
        }

        // Check if there are any users without ward/zone assignment
        const unassignedUsers = await prisma.user.count({
            where: {
                role: 'CUSTOMER',
                status: 'ACTIVE',
                wardId: null,
                zoneId: null
            }
        });
        console.log(`\nUnassigned users (no ward/zone): ${unassignedUsers}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkLiveChatUsers();
