/**
 * Migration script to populate complaint location fields
 * 
 * This script copies location data from old fields (cityCorporationCode, zoneId, wardId)
 * to new fields (complaintCityCorporationCode, complaintZoneId, complaintWardId)
 * for existing complaints that don't have the new fields populated.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateComplaintLocationFields() {
    console.log('🚀 Starting complaint location fields migration...\n');

    try {
        // Find all complaints where new location fields are null
        const complaintsToMigrate = await prisma.complaint.findMany({
            where: {
                OR: [
                    { complaintCityCorporationCode: null },
                    { complaintZoneId: null },
                    { complaintWardId: null }
                ]
            },
            select: {
                id: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                complaintCityCorporationCode: true,
                complaintZoneId: true,
                complaintWardId: true
            }
        });

        console.log(`📊 Found ${complaintsToMigrate.length} complaints to migrate\n`);

        if (complaintsToMigrate.length === 0) {
            console.log('✅ No complaints need migration. All done!');
            return;
        }

        let migratedCount = 0;
        let skippedCount = 0;

        for (const complaint of complaintsToMigrate) {
            // Only migrate if old fields have data
            if (complaint.cityCorporationCode || complaint.zoneId || complaint.wardId) {
                await prisma.complaint.update({
                    where: { id: complaint.id },
                    data: {
                        complaintCityCorporationCode: complaint.complaintCityCorporationCode || complaint.cityCorporationCode,
                        complaintZoneId: complaint.complaintZoneId || complaint.zoneId,
                        complaintWardId: complaint.complaintWardId || complaint.wardId
                    }
                });

                migratedCount++;
                console.log(`✅ Migrated complaint #${complaint.id}`);
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped complaint #${complaint.id} (no location data)`);
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   Total complaints processed: ${complaintsToMigrate.length}`);
        console.log(`   Successfully migrated: ${migratedCount}`);
        console.log(`   Skipped (no data): ${skippedCount}`);
        console.log(`\n✅ Migration completed successfully!`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateComplaintLocationFields()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
