const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixZoneConstraints() {
    console.log('🔧 Fixing zone constraints...\n');

    try {
        // Drop old zone unique constraint
        console.log('1️⃣ Dropping old zone unique constraint...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE zones DROP INDEX zones_number_cityCorporationId_key
      `);
            console.log('   ✅ Old constraint dropped');
        } catch (e) {
            console.log('   ⏭️  Constraint not found');
        }

        // Add new unique constraint
        console.log('\n2️⃣ Adding new unique constraint...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE zones ADD UNIQUE KEY zones_zoneNumber_cityCorporationId_key (zoneNumber, cityCorporationId)
      `);
            console.log('   ✅ New constraint added');
        } catch (e) {
            if (e.message.includes('Duplicate key')) {
                console.log('   ⏭️  Constraint already exists');
            } else {
                console.log(`   ⚠️  ${e.message}`);
            }
        }

        console.log('\n🎉 Constraints fixed!');
        console.log('\n📝 Next: Clear and run migration');
        console.log('   node clear-zones-wards.js');
        console.log('   node migrate-thana-to-zone-ward.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixZoneConstraints();
