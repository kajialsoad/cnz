
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ccs = await prisma.cityCorporation.findMany({ select: { code: true, name: true } });
    console.log('City Corps:', ccs);

    const zones = await prisma.zone.findMany({ take: 1, select: { id: true, name: true, cityCorporationId: true } });
    console.log('Zones Sample:', zones);

    const wards = await prisma.ward.findMany({ take: 1, select: { id: true, wardNumber: true, zoneId: true } });
    console.log('Wards Sample:', wards);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
