const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkZones() {
    try {
        const zones = await prisma.zone.findMany({
            include: {
                cityCorporation: true,
                wards: true
            }
        });

        console.log(`\n📊 Total Zones: ${zones.length}\n`);

        for (const zone of zones) {
            console.log(`Zone ${zone.id}:`);
            console.log(`  - Zone Number: ${zone.zoneNumber || 'NOT SET'}`);
            console.log(`  - Name: ${zone.name || 'No name'}`);
            console.log(`  - City Corp: ${zone.cityCorporation.code}`);
            console.log(`  - Officer: ${zone.officerName || 'Not assigned'}`);
            console.log(`  - Wards: ${zone.wards.length}`);
            console.log('');
        }

        const wards = await prisma.ward.findMany();
        console.log(`\n📊 Total Wards: ${wards.length}\n`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkZones();
