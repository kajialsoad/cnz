const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExistingZones() {
    console.log('🔍 Checking existing zones and wards...\n');

    try {
        const zones = await prisma.zone.findMany({
            include: {
                cityCorporation: true,
                wards: true,
                _count: {
                    select: { wards: true }
                }
            },
            orderBy: [
                { cityCorporationId: 'asc' },
                { zoneNumber: 'asc' }
            ]
        });

        console.log(`Found ${zones.length} zones in database:\n`);

        for (const zone of zones) {
            console.log(`Zone ${zone.zoneNumber}: ${zone.name || 'No name'}`);
            console.log(`  City Corp: ${zone.cityCorporation.code}`);
            console.log(`  Officer: ${zone.officerName || 'Not assigned'}`);
            console.log(`  Wards: ${zone._count.wards}`);
            console.log('');
        }

        const totalWards = await prisma.ward.count();
        console.log(`Total wards in database: ${totalWards}`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkExistingZones();
