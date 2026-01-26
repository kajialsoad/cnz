/**
 * Apply Bot Message Query Optimizations
 * 
 * This script:
 * 1. Applies the query optimization migration
 * 2. Verifies indexes are created
 * 3. Provides performance recommendations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyOptimizations() {
    console.log('🚀 Applying Bot Message Query Optimizations...\n');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20260125_optimize_bot_queries', 'migration.sql');

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('📄 Migration SQL:');
        console.log(migrationSQL);
        console.log('');

        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        // Execute each statement
        console.log('⚙️  Executing migration statements...\n');
        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
                console.log('✅ Executed:', statement.substring(0, 80) + '...');
            } catch (error) {
                if (error.message.includes('Duplicate key name')) {
                    console.log('⚠️  Index already exists, skipping...');
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ Migration applied successfully!\n');

        // Verify indexes
        console.log('🔍 Verifying indexes...\n');

        // Check bot_message_configs indexes
        const configIndexes = await prisma.$queryRaw`
            SHOW INDEX FROM bot_message_configs
        `;
        console.log('📊 bot_message_configs indexes:');
        configIndexes.forEach(idx => {
            console.log(`   - ${idx.Key_name} (${idx.Column_name})`);
        });
        console.log('');

        // Check bot_message_analytics indexes
        const analyticsIndexes = await prisma.$queryRaw`
            SHOW INDEX FROM bot_message_analytics
        `;
        console.log('📊 bot_message_analytics indexes:');
        analyticsIndexes.forEach(idx => {
            console.log(`   - ${idx.Key_name} (${idx.Column_name})`);
        });
        console.log('');

        // Performance recommendations
        console.log('💡 Performance Recommendations:\n');
        console.log('1. ✅ Composite indexes added for common query patterns');
        console.log('2. 📝 Use local database for performance testing');
        console.log('3. 🔄 Enable query result caching for frequently accessed data');
        console.log('4. 🎯 Use connection pooling (already configured in Prisma)');
        console.log('5. 📊 Monitor slow queries using Prisma query logging');
        console.log('');

        console.log('🎉 Query optimization complete!\n');
        console.log('Next steps:');
        console.log('1. Run performance tests: npm test -- bot-database-query.performance.test.ts --run');
        console.log('2. Verify query times are < 5ms for simple queries');
        console.log('3. Update DATABASE_QUERY_PERFORMANCE_RESULTS.md with new results');
        console.log('');

    } catch (error) {
        console.error('❌ Error applying optimizations:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyOptimizations();
