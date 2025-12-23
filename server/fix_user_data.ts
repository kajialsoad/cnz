
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'customer1@demo.com';

    // 1. Find valid CC
    const cc = await prisma.cityCorporation.findFirst({
        where: { status: 'ACTIVE' }
    });
    if (!cc) throw new Error('No active City Corporation found');

    // 2. Find valid Zone
    const zone = await prisma.zone.findFirst({
        where: { cityCorporationId: cc.id, status: 'ACTIVE' }
    });
    if (!zone) throw new Error('No active Zone found for CC ' + cc.code);

    // 3. Find valid Ward
    const ward = await prisma.ward.findFirst({
        where: { zoneId: zone.id, status: 'ACTIVE' }
    });
    if (!ward) throw new Error('No active Ward found for Zone ' + zone.id);

    console.log(`Assigning: CC=${cc.code}, Zone=${zone.id}, Ward=${ward.id} to ${email}`);

    // 4. Update User
    const user = await prisma.user.update({
        where: { email },
        data: {
            cityCorporationCode: cc.code,
            zoneId: zone.id,
            wardId: ward.id
        },
        select: {
            email: true,
            cityCorporation: { select: { name: true } },
            zone: { select: { name: true } },
            ward: { select: { wardNumber: true } }
        }
    });

    console.log('User Updated Successfully:', JSON.stringify(user, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
