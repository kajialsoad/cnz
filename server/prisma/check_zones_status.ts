import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Final Status Check for Zones 5, 7, 9:');

    // Find users linked to these zones
    const users = await prisma.user.findMany({
        where: {
            zoneId: { in: [5, 7, 9] },
        },
        include: {
            zone: true
        }
    });

    for (const u of users) {
        console.log(`\n👤 User: ${u.firstName} ${u.lastName}`);
        console.log(`   Phone: ${u.phone}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Zone: ${u.zone?.zoneNumber} (ID: ${u.zoneId})`);
    }

    if (users.length === 0) {
        console.log('❌ No users found linked to Zones 5, 7, or 9.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
