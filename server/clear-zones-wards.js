const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearZonesWards() {
    console.log('🧹 Clearing existing zones and wards...\n');

    try {
        // Delete all wards first (foreign key)
        const deletedWards = await prisma.ward.deleteMany({});
        console.log(`✅ Deleted ${deletedWards.count} wards`);

        // Delete all zones
        const deletedZones = await prisma.zone.deleteMany({});
        console.log(`✅ Deleted ${deletedZones.count} zones`);

        console.log('\n🎉 Database cleared!');
        console.log('\n📝 Next: Run fresh migration');
        console.log('   node migrate-thana-to-zone-ward.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

clearZonesWards();
