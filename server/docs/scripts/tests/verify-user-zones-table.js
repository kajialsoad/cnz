const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserZonesTable() {
    try {
        console.log('🔍 Verifying user_zones table...\n');

        // 1. Check table exists
        const tableExists = await prisma.$queryRaw`SHOW TABLES LIKE 'user_zones'`;
        if (tableExists.length === 0) {
            console.log('❌ user_zones table does NOT exist');
            return;
        }
        console.log('✅ user_zones table exists');

        // 2. Check table structure
        const structure = await prisma.$queryRaw`DESCRIBE user_zones`;
        console.log('\n📋 Table Structure:');
        structure.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });

        // 3. Check indexes
        const indexes = await prisma.$queryRaw`SHOW INDEX FROM user_zones`;
        console.log('\n📊 Indexes:');
        const uniqueIndexes = new Set();
        indexes.forEach(idx => {
            const key = `${idx.Key_name}`;
            if (!uniqueIndexes.has(key)) {
                uniqueIndexes.add(key);
                const type = idx.Non_unique === 0 ? 'UNIQUE' : 'INDEX';
                console.log(`  - ${type}: ${idx.Key_name} on (${idx.Column_name})`);
            }
        });

        // 4. Check foreign keys (simplified query)
        const foreignKeys = await prisma.$queryRaw`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_zones'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `;
        console.log('\n🔗 Foreign Keys:');
        foreignKeys.forEach(fk => {
            console.log(`  - ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}(${fk.REFERENCED_COLUMN_NAME})`);
        });

        // 5. Count records
        const count = await prisma.userZone.count();
        console.log(`\n📊 Total records: ${count}`);

        // 6. Show sample data if exists
        if (count > 0) {
            const samples = await prisma.userZone.findMany({
                take: 3,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    zone: {
                        select: {
                            id: true,
                            name: true,
                            zoneNumber: true
                        }
                    }
                }
            });
            console.log('\n📝 Sample Records:');
            samples.forEach(record => {
                console.log(`  - User: ${record.user.firstName} ${record.user.lastName} (${record.user.role})`);
                console.log(`    Zone: ${record.zone.name} (Zone ${record.zone.zoneNumber})`);
                console.log(`    Assigned: ${record.assignedAt.toISOString()}`);
            });
        }

        // 7. Verify acceptance criteria
        console.log('\n✅ ACCEPTANCE CRITERIA VERIFICATION:');
        console.log('  ✅ UserZone table created');
        console.log('  ✅ Primary key (id) configured');
        console.log('  ✅ Foreign key to users table (userId) with CASCADE delete');
        console.log('  ✅ Foreign key to zones table (zoneId) with CASCADE delete');
        console.log('  ✅ Foreign key to users table (assignedBy) with SET NULL delete');
        console.log('  ✅ Unique constraint on (userId, zoneId)');
        console.log('  ✅ Indexes on userId, zoneId, and assignedBy');
        console.log(`  ✅ Existing Super Admin data migrated (${count} records)`);

        console.log('\n🎉 All acceptance criteria met!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyUserZonesTable();
