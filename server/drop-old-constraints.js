const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dropOldConstraints() {
    console.log('🔧 Dropping old constraints...\n');

    try {
        // Drop old ward unique constraint
        console.log('1️⃣ Dropping old ward unique constraint...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE wards DROP INDEX wards_number_zoneId_cityCorporationId_key
      `);
            console.log('   ✅ Old constraint dropped');
        } catch (e) {
            console.log('   ⏭️  Constraint not found');
        }

        // Add new unique constraint
        console.log('\n2️⃣ Adding new unique constraint...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE wards ADD UNIQUE KEY wards_wardNumber_zoneId_key (wardNumber, zoneId)
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
        console.log('\n📝 Next: Run data migration');
        console.log('   node migrate-thana-to-zone-ward.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

dropOldConstraints();
