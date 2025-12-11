const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixWardTable() {
    console.log('🔧 Fixing wards table structure...\n');

    try {
        // Drop foreign key constraint first
        console.log('1️⃣ Dropping foreign key constraint...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE wards DROP FOREIGN KEY wards_cityCorporationId_fkey
      `);
            console.log('   ✅ Foreign key dropped');
        } catch (e) {
            console.log('   ⏭️  Foreign key not found or already dropped');
        }

        // Drop cityCorporationId column
        console.log('\n2️⃣ Dropping cityCorporationId column...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE wards DROP COLUMN cityCorporationId
      `);
            console.log('   ✅ Column dropped');
        } catch (e) {
            if (e.message.includes("Can't DROP")) {
                console.log('   ⏭️  Column already dropped');
            } else {
                console.log(`   ⚠️  ${e.message}`);
            }
        }

        console.log('\n🎉 Ward table fixed!');
        console.log('\n📝 Next: Run data migration');
        console.log('   node migrate-thana-to-zone-ward.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fixWardTable();
