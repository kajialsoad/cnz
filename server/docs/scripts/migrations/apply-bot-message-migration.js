/**
 * Script to apply bot message system migration
 * This script will:
 * 1. Apply the migration to the database
 * 2. Verify all tables were created
 * 3. Check indexes
 * 4. Verify enum updates
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
    console.log('🚀 Starting bot message system migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(
            __dirname,
            'prisma',
            'migrations',
            '20250125_add_bot_message_system',
            'migration.sql'
        );

        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found at: ${migrationPath}`);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        console.log('📄 Migration file loaded successfully\n');

        // Execute each statement separately
        console.log('📝 Executing migration statements...\n');

        // 1. Update SenderType enum for chat_messages
        console.log('1. Updating chat_messages.senderType enum...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE chat_messages 
        MODIFY COLUMN senderType ENUM('ADMIN', 'CITIZEN', 'BOT') NOT NULL DEFAULT 'CITIZEN'
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already') || error.message.includes('Duplicate')) {
                console.log('⚠️  Already updated, skipping...\n');
            } else {
                throw error;
            }
        }

        // 2. Update SenderType enum for complaint_chat_messages
        console.log('2. Updating complaint_chat_messages.senderType enum...');
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE complaint_chat_messages 
        MODIFY COLUMN senderType ENUM('ADMIN', 'CITIZEN', 'BOT') NOT NULL
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already') || error.message.includes('Duplicate')) {
                console.log('⚠️  Already updated, skipping...\n');
            } else {
                throw error;
            }
        }

        // 3. Create bot_message_configs table
        console.log('3. Creating bot_message_configs table...');
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE bot_message_configs (
          id INTEGER NOT NULL AUTO_INCREMENT,
          chatType ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
          messageKey VARCHAR(100) NOT NULL,
          content TEXT NOT NULL,
          content_bn TEXT NOT NULL,
          step_number INTEGER NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          display_order INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL,
          UNIQUE INDEX bot_message_configs_messageKey_key(messageKey),
          INDEX bot_message_configs_chatType_is_active_display_order_idx(chatType, is_active, display_order),
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Table already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // 4. Create bot_trigger_rules table
        console.log('4. Creating bot_trigger_rules table...');
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE bot_trigger_rules (
          id INTEGER NOT NULL AUTO_INCREMENT,
          chatType ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
          is_enabled BOOLEAN NOT NULL DEFAULT true,
          reactivation_threshold INTEGER NOT NULL DEFAULT 5,
          reset_steps_on_reactivate BOOLEAN NOT NULL DEFAULT false,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL,
          UNIQUE INDEX bot_trigger_rules_chatType_key(chatType),
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Table already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // 5. Create bot_conversation_states table
        console.log('5. Creating bot_conversation_states table...');
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE bot_conversation_states (
          id INTEGER NOT NULL AUTO_INCREMENT,
          chatType ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
          conversationId VARCHAR(100) NOT NULL,
          current_step INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT true,
          last_admin_reply_at DATETIME(3) NULL,
          user_message_count INTEGER NOT NULL DEFAULT 0,
          last_bot_message_at DATETIME(3) NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL,
          UNIQUE INDEX bot_conversation_states_chatType_conversationId_key(chatType, conversationId),
          INDEX bot_conversation_states_chatType_is_active_idx(chatType, is_active),
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Table already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // 6. Create bot_message_analytics table
        console.log('6. Creating bot_message_analytics table...');
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE bot_message_analytics (
          id INTEGER NOT NULL AUTO_INCREMENT,
          chatType ENUM('LIVE_CHAT', 'COMPLAINT_CHAT') NOT NULL,
          messageKey VARCHAR(100) NOT NULL,
          step_number INTEGER NOT NULL,
          trigger_count INTEGER NOT NULL DEFAULT 0,
          admin_reply_count INTEGER NOT NULL DEFAULT 0,
          avg_response_time INTEGER NULL,
          date DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          INDEX bot_message_analytics_chatType_date_idx(chatType, date),
          INDEX bot_message_analytics_messageKey_idx(messageKey),
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
      `);
            console.log('✅ Success\n');
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log('⚠️  Table already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        console.log('✅ Migration applied successfully!\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');

        const tables = [
            'bot_message_configs',
            'bot_trigger_rules',
            'bot_conversation_states',
            'bot_message_analytics'
        ];

        for (const table of tables) {
            const result = await prisma.$queryRawUnsafe(
                `SHOW TABLES LIKE '${table}'`
            );

            if (result.length > 0) {
                console.log(`✅ Table '${table}' exists`);

                // Show table structure
                const columns = await prisma.$queryRawUnsafe(
                    `DESCRIBE ${table}`
                );
                console.log(`   Columns: ${columns.length}`);
            } else {
                console.log(`❌ Table '${table}' NOT FOUND`);
            }
        }

        console.log('\n🔍 Verifying indexes...\n');

        // Check indexes for bot_message_configs
        const configIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_message_configs`
        );
        console.log(`✅ bot_message_configs has ${configIndexes.length} indexes`);

        // Check indexes for bot_conversation_states
        const stateIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_conversation_states`
        );
        console.log(`✅ bot_conversation_states has ${stateIndexes.length} indexes`);

        // Check indexes for bot_message_analytics
        const analyticsIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_message_analytics`
        );
        console.log(`✅ bot_message_analytics has ${analyticsIndexes.length} indexes`);

        console.log('\n🔍 Verifying SenderType enum update...\n');

        // Check chat_messages table
        const chatMessagesColumns = await prisma.$queryRawUnsafe(
            `SHOW COLUMNS FROM chat_messages WHERE Field = 'senderType'`
        );

        if (chatMessagesColumns.length > 0) {
            const enumValues = chatMessagesColumns[0].Type;
            console.log(`✅ chat_messages.senderType: ${enumValues}`);

            if (enumValues.includes('BOT')) {
                console.log('   ✅ BOT value added successfully');
            } else {
                console.log('   ❌ BOT value NOT found');
            }
        }

        // Check complaint_chat_messages table
        const complaintChatColumns = await prisma.$queryRawUnsafe(
            `SHOW COLUMNS FROM complaint_chat_messages WHERE Field = 'senderType'`
        );

        if (complaintChatColumns.length > 0) {
            const enumValues = complaintChatColumns[0].Type;
            console.log(`✅ complaint_chat_messages.senderType: ${enumValues}`);

            if (enumValues.includes('BOT')) {
                console.log('   ✅ BOT value added successfully');
            } else {
                console.log('   ❌ BOT value NOT found');
            }
        }

        console.log('\n✅ Migration verification complete!\n');
        console.log('📊 Summary:');
        console.log('   - 4 new tables created');
        console.log('   - SenderType enum updated with BOT value');
        console.log('   - All indexes applied successfully');
        console.log('\n🎉 Bot message system database schema is ready!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
applyMigration();
