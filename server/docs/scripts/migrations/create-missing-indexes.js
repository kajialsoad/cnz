/**
 * Create Missing Composite Indexes
 * 
 * Manually creates the composite index that wasn't created by the migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingIndexes() {
    console.log('🔧 Creating missing composite indexes...\n');

    try {
        // Create the composite index for getBotMessageByStep
        console.log('Creating chatType_stepNumber_isActive_displayOrder index...');

        try {
            await prisma.$executeRaw`
                CREATE INDEX bot_msg_cfg_chat_step_active_order_idx 
                ON bot_message_configs (chatType, step_number, is_active, display_order)
            `;
            console.log('✅ Index created successfully!\n');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('⚠️  Index already exists\n');
            } else {
                throw error;
            }
        }

        // Create the composite index for analytics
        console.log('Creating chatType_messageKey_date index...');

        try {
            await prisma.$executeRaw`
                CREATE INDEX bot_msg_analytics_chat_key_date_idx 
                ON bot_message_analytics (chatType, messageKey, date)
            `;
            console.log('✅ Index created successfully!\n');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('⚠️  Index already exists\n');
            } else {
                throw error;
            }
        }

        // Verify all indexes
        console.log('🔍 Verifying all indexes...\n');

        const configIndexes = await prisma.$queryRaw`
            SHOW INDEX FROM bot_message_configs
        `;

        console.log('📊 bot_message_configs indexes:');
        const uniqueIndexes = new Set();
        configIndexes.forEach(idx => {
            if (!uniqueIndexes.has(idx.Key_name)) {
                uniqueIndexes.add(idx.Key_name);
                const columns = configIndexes
                    .filter(i => i.Key_name === idx.Key_name)
                    .map(i => i.Column_name)
                    .join(', ');
                console.log(`   ✓ ${idx.Key_name} (${columns})`);
            }
        });
        console.log('');

        const analyticsIndexes = await prisma.$queryRaw`
            SHOW INDEX FROM bot_message_analytics
        `;

        console.log('📊 bot_message_analytics indexes:');
        const uniqueAnalyticsIndexes = new Set();
        analyticsIndexes.forEach(idx => {
            if (!uniqueAnalyticsIndexes.has(idx.Key_name)) {
                uniqueAnalyticsIndexes.add(idx.Key_name);
                const columns = analyticsIndexes
                    .filter(i => i.Key_name === idx.Key_name)
                    .map(i => i.Column_name)
                    .join(', ');
                console.log(`   ✓ ${idx.Key_name} (${columns})`);
            }
        });
        console.log('');

        console.log('✅ All indexes created and verified!\n');
        console.log('Next steps:');
        console.log('1. Run performance tests to verify improvements');
        console.log('2. Monitor query performance in production');
        console.log('');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingIndexes();
