const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserZonesTable() {
    try {
        // Check if user_zones table exists
        const result = await prisma.$queryRaw`SHOW TABLES LIKE 'user_zones'`;

        if (result.length > 0) {
            console.log('✅ user_zones table EXISTS in database');

            // Check table structure
            const structure = await prisma.$queryRaw`DESCRIBE user_zones`;
            console.log('\n📋 Table Structure:');
            console.table(structure);

            // Check foreign keys
            const foreignKeys = await prisma.$queryRaw`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME,
          DELETE_RULE,
          UPDATE_RULE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'user_zones'
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `;
            console.log('\n🔗 Foreign Keys:');
            console.table(foreignKeys);

            // Check indexes
            const indexes = await prisma.$queryRaw`SHOW INDEX FROM user_zones`;
            console.log('\n📊 Indexes:');
            console.table(indexes.map(idx => ({
                Key_name: idx.Key_name,
                Column_name: idx.Column_name,
                Non_unique: idx.Non_unique,
                Index_type: idx.Index_type
            })));

            // Count records
            const count = await prisma.userZone.count();
            console.log(`\n📈 Total records in user_zones: ${count}`);

        } else {
            console.log('❌ user_zones table DOES NOT EXIST in database');
        }
    } catch (error) {
        console.error('Error checking user_zones table:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserZonesTable();
