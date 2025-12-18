const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIds() {
    try {
        const zoneId = 29;
        const wardId = 221;

        console.log(`checking Zone ID: ${zoneId} and Ward ID: ${wardId}...`);

        const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
        if (zone) {
            console.log(`[ZONE FOUND] ID: ${zone.id} | Name: ${zone.name} | Number: ${zone.number} | ZoneNumber: ${zone.zoneNumber}`);
        } else {
            console.log(`[ZONE NOT FOUND] ID: ${zoneId}`);
        }

        const ward = await prisma.ward.findUnique({ where: { id: wardId } });
        if (ward) {
            console.log(`[WARD FOUND] ID: ${ward.id} | WardNumber: ${ward.wardNumber} | Number: ${ward.number} | ZoneId: ${ward.zoneId}`);
        } else {
            console.log(`[WARD NOT FOUND] ID: ${wardId}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkIds();
