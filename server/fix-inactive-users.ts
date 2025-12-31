
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup of INACTIVE users...');

    // Find all INACTIVE users
    const inactiveUsers = await prisma.user.findMany({
        where: {
            status: 'INACTIVE',
        },
    });

    console.log(`Found ${inactiveUsers.length} inactive users.`);

    for (const user of inactiveUsers) {
        let updated = false;
        const updateData: any = {};

        // Check if phone needs update
        if (user.phone && !user.phone.includes('_deleted_')) {
            updateData.phone = `${user.phone}_deleted_${Date.now()}`;
            updated = true;
        }

        // Check if email needs update
        if (user.email && !user.email.includes('_deleted_')) {
            updateData.email = `${user.email}_deleted_${Date.now()}`;
            updated = true;
        }

        if (updated) {
            console.log(`Updating user ${user.id}:`, updateData);
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
            } catch (error) {
                console.error(`Failed to update user ${user.id}:`, error);
            }
        }
    }

    console.log('Cleanup complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
