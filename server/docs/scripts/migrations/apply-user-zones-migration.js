const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20241214_add_user_zones', 'migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Applying migration...\n');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.substring(0, 80)}...`);
                try {
                    await prisma.$executeRawUnsafe(statement);
                    console.log('✅ Success\n');
                } catch (error) {
                    // Check if error is about table already existing
                    if (error.message.includes('already exists')) {
                        console.log('⚠️  Already exists, skipping\n');
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('✅ Migration applied successfully!');

        // Verify the table was created
        const result = await prisma.$queryRaw`SHOW TABLES LIKE 'user_zones'`;
        if (result.length > 0) {
            console.log('✅ user_zones table verified in database');

            // Count records
            const count = await prisma.userZone.count();
            console.log(`📊 Total records: ${count}`);
        }

    } catch (error) {
        console.error('❌ Error applying migration:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

applyMigration();
