/**
 * Migration script to populate complaint location from user location
 * 
 * This script copies location data from user profile to complaint location fields
 * for complaints that don't have location data.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populateComplaintLocationFromUser() {
    console.log('🚀 Starting complaint location population from user data...\n');

    try {
        // Find all complaints where complaint location fields are null
        const complaintsToPopulate = await prisma.complaint.findMany({
            where: {
                AND: [
                    { complaintCityCorporationCode: null },
                    { complaintZoneId: null },
                    { complaintWardId: null }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        cityCorporationCode: true,
                        zoneId: true,
                        wardId: true
                    }
                }
            }
        });

        console.log(`📊 Found ${complaintsToPopulate.length} complaints to populate\n`);

        if (complaintsToPopulate.length === 0) {
            console.log('✅ No complaints need population. All done!');
            return;
        }

        let populatedCount = 0;
        let skippedCount = 0;

        for (const complaint of complaintsToPopulate) {
            // Only populate if user has location data
            if (complaint.user && (complaint.user.cityCorporationCode || complaint.user.zoneId || complaint.user.wardId)) {
                await prisma.complaint.update({
                    where: { id: complaint.id },
                    data: {
                        complaintCityCorporationCode: complaint.user.cityCorporationCode,
                        complaintZoneId: complaint.user.zoneId,
                        complaintWardId: complaint.user.wardId
                    }
                });

                populatedCount++;
                console.log(`✅ Populated complaint #${complaint.id} from user ${complaint.user.firstName} ${complaint.user.lastName}`);
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped complaint #${complaint.id} (user has no location data)`);
            }
        }

        console.log(`\n📊 Population Summary:`);
        console.log(`   Total complaints processed: ${complaintsToPopulate.length}`);
        console.log(`   Successfully populated: ${populatedCount}`);
        console.log(`   Skipped (no user data): ${skippedCount}`);
        console.log(`\n✅ Population completed successfully!`);

    } catch (error) {
        console.error('❌ Population failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run population
populateComplaintLocationFromUser()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Population failed:', error);
        process.exit(1);
    });
