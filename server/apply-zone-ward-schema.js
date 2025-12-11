const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applySchemaChanges() {
    console.log('🔄 Applying Zone-Ward schema changes...\n');

    try {
        console.log('1️⃣ Adding missing columns to zones table...');

        const zoneColumns = [
            { name: 'zoneNumber', sql: 'ADD COLUMN zoneNumber INT AFTER id' },
            { name: 'officerName', sql: 'ADD COLUMN officerName VARCHAR(191) AFTER cityCorporationId' },
            { name: 'officerDesignation', sql: 'ADD COLUMN officerDesignation VARCHAR(191) AFTER officerName' },
            { name: 'officerSerialNumber', sql: 'ADD COLUMN officerSerialNumber VARCHAR(191) AFTER officerDesignation' }
        ];

        for (const col of zoneColumns) {
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE zones ${col.sql}`);
                console.log(`   ✅ ${col.name} added`);
            } catch (e) {
                if (e.message.includes('Duplicate column')) {
                    console.log(`   ⏭️  ${col.name} already exists`);
                } else {
                    console.log(`   ⚠️  ${col.name}: ${e.message}`);
                }
            }
        }

        console.log('\n2️⃣ Adding missing columns to wards table...');

        const wardColumns = [
            { name: 'wardNumber', sql: 'ADD COLUMN wardNumber INT AFTER id' },
            { name: 'inspectorName', sql: 'ADD COLUMN inspectorName VARCHAR(191) AFTER zoneId' },
            { name: 'inspectorSerialNumber', sql: 'ADD COLUMN inspectorSerialNumber VARCHAR(191) AFTER inspectorName' }
        ];

        for (const col of wardColumns) {
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE wards ${col.sql}`);
                console.log(`   ✅ ${col.name} added`);
            } catch (e) {
                if (e.message.includes('Duplicate column')) {
                    console.log(`   ⏭️  ${col.name} already exists`);
                } else {
                    console.log(`   ⚠️  ${col.name}: ${e.message}`);
                }
            }
        }

        console.log('\n3️⃣ Adding missing columns to users table...');

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN wardImageCount INT NOT NULL DEFAULT 0 AFTER wardId`);
            console.log('   ✅ wardImageCount added');
        } catch (e) {
            if (e.message.includes('Duplicate column')) {
                console.log('   ⏭️  wardImageCount already exists');
            } else {
                console.log(`   ⚠️  wardImageCount: ${e.message}`);
            }
        }

        console.log('\n🎉 Schema changes applied successfully!');
        console.log('\n📝 Next: Run data migration');
        console.log('   node migrate-thana-to-zone-ward.js');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

applySchemaChanges();
