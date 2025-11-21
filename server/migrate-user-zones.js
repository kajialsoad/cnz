const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateUserZones() {
    console.log('🔄 Migrating existing user zone data to cityCorporationCode...');

    try {
        // Get all users with zone data
        const users = await prisma.user.findMany({
            where: {
                zone: {
                    not: null,
                },
            },
            select: {
                id: true,
                zone: true,
                ward: true,
            },
        });

        console.log(`Found ${users.length} users with zone data`);

        let dsccCount = 0;
        let dnccCount = 0;
        let unknownCount = 0;

        for (const user of users) {
            let cityCorporationCode = null;

            // Map zone to cityCorporationCode
            if (user.zone) {
                const zoneLower = user.zone.toLowerCase();
                if (zoneLower.includes('dscc') || zoneLower.includes('south')) {
                    cityCorporationCode = 'DSCC';
                    dsccCount++;
                } else if (zoneLower.includes('dncc') || zoneLower.includes('north')) {
                    cityCorporationCode = 'DNCC';
                    dnccCount++;
                } else {
                    // Default to DSCC if zone is unclear
                    cityCorporationCode = 'DSCC';
                    unknownCount++;
                    console.log(`  ⚠️  Unknown zone "${user.zone}" for user ${user.id}, defaulting to DSCC`);
                }
            }

            if (cityCorporationCode) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        cityCorporationCode: cityCorporationCode,
                    },
                });
            }
        }

        console.log('\n✅ Migration completed!');
        console.log(`  - DSCC users: ${dsccCount}`);
        console.log(`  - DNCC users: ${dnccCount}`);
        console.log(`  - Unknown zones (defaulted to DSCC): ${unknownCount}`);
        console.log(`  - Total migrated: ${users.length}`);
    } catch (error) {
        console.error('❌ Error migrating user zones:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateUserZones()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
