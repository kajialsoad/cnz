
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'customer1@demo.com';
    console.log(`Fetching profile for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            cityCorporationCode: true,
            zoneId: true,
            wardId: true,
            cityCorporation: {
                select: {
                    code: true,
                    name: true,
                }
            },
            zone: {
                select: {
                    id: true,
                    name: true,
                    zoneNumber: true,
                }
            },
            ward: {
                select: {
                    id: true,
                    wardNumber: true,
                    number: true,
                }
            }
        }
    });

    console.log('User Data:', JSON.stringify(user, null, 2));

    if (user?.zoneId && !user.zone) {
        console.error('ERROR: zoneId is set but zone relation is null!');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
