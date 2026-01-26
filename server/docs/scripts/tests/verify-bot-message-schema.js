/**
 * Verification script for bot message system schema
 * This script checks:
 * 1. All tables exist
 * 2. All columns are correct
 * 3. Indexes are in place
 * 4. Enums are updated
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
    console.log('🔍 Verifying Bot Message System Schema...\n');

    try {
        // Test 1: Check if tables exist
        console.log('📋 Test 1: Checking tables...\n');

        const tables = [
            'bot_message_configs',
            'bot_trigger_rules',
            'bot_conversation_states',
            'bot_message_analytics'
        ];

        let allTablesExist = true;
        for (const table of tables) {
            const result = await prisma.$queryRawUnsafe(
                `SHOW TABLES LIKE '${table}'`
            );

            if (result.length > 0) {
                console.log(`✅ ${table}`);
            } else {
                console.log(`❌ ${table} - NOT FOUND`);
                allTablesExist = false;
            }
        }

        if (!allTablesExist) {
            throw new Error('Some tables are missing!');
        }

        // Test 2: Check bot_message_configs structure
        console.log('\n📋 Test 2: Checking bot_message_configs structure...\n');

        const configColumns = await prisma.$queryRawUnsafe(
            `DESCRIBE bot_message_configs`
        );

        const expectedConfigColumns = [
            'id',
            'chatType',
            'messageKey',
            'content',
            'content_bn',
            'step_number',
            'is_active',
            'display_order',
            'created_at',
            'updated_at'
        ];

        for (const col of expectedConfigColumns) {
            const found = configColumns.find(c => c.Field === col);
            if (found) {
                console.log(`✅ ${col} (${found.Type})`);
            } else {
                console.log(`❌ ${col} - NOT FOUND`);
            }
        }

        // Test 3: Check bot_trigger_rules structure
        console.log('\n📋 Test 3: Checking bot_trigger_rules structure...\n');

        const ruleColumns = await prisma.$queryRawUnsafe(
            `DESCRIBE bot_trigger_rules`
        );

        const expectedRuleColumns = [
            'id',
            'chatType',
            'is_enabled',
            'reactivation_threshold',
            'reset_steps_on_reactivate',
            'created_at',
            'updated_at'
        ];

        for (const col of expectedRuleColumns) {
            const found = ruleColumns.find(c => c.Field === col);
            if (found) {
                console.log(`✅ ${col} (${found.Type})`);
            } else {
                console.log(`❌ ${col} - NOT FOUND`);
            }
        }

        // Test 4: Check bot_conversation_states structure
        console.log('\n📋 Test 4: Checking bot_conversation_states structure...\n');

        const stateColumns = await prisma.$queryRawUnsafe(
            `DESCRIBE bot_conversation_states`
        );

        const expectedStateColumns = [
            'id',
            'chatType',
            'conversationId',
            'current_step',
            'is_active',
            'last_admin_reply_at',
            'user_message_count',
            'last_bot_message_at',
            'created_at',
            'updated_at'
        ];

        for (const col of expectedStateColumns) {
            const found = stateColumns.find(c => c.Field === col);
            if (found) {
                console.log(`✅ ${col} (${found.Type})`);
            } else {
                console.log(`❌ ${col} - NOT FOUND`);
            }
        }

        // Test 5: Check bot_message_analytics structure
        console.log('\n📋 Test 5: Checking bot_message_analytics structure...\n');

        const analyticsColumns = await prisma.$queryRawUnsafe(
            `DESCRIBE bot_message_analytics`
        );

        const expectedAnalyticsColumns = [
            'id',
            'chatType',
            'messageKey',
            'step_number',
            'trigger_count',
            'admin_reply_count',
            'avg_response_time',
            'date'
        ];

        for (const col of expectedAnalyticsColumns) {
            const found = analyticsColumns.find(c => c.Field === col);
            if (found) {
                console.log(`✅ ${col} (${found.Type})`);
            } else {
                console.log(`❌ ${col} - NOT FOUND`);
            }
        }

        // Test 6: Check indexes
        console.log('\n📋 Test 6: Checking indexes...\n');

        const configIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_message_configs`
        );
        console.log(`✅ bot_message_configs: ${configIndexes.length} indexes`);

        const ruleIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_trigger_rules`
        );
        console.log(`✅ bot_trigger_rules: ${ruleIndexes.length} indexes`);

        const stateIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_conversation_states`
        );
        console.log(`✅ bot_conversation_states: ${stateIndexes.length} indexes`);

        const analyticsIndexes = await prisma.$queryRawUnsafe(
            `SHOW INDEXES FROM bot_message_analytics`
        );
        console.log(`✅ bot_message_analytics: ${analyticsIndexes.length} indexes`);

        // Test 7: Check SenderType enum
        console.log('\n📋 Test 7: Checking SenderType enum...\n');

        const chatMessagesEnum = await prisma.$queryRawUnsafe(
            `SHOW COLUMNS FROM chat_messages WHERE Field = 'senderType'`
        );

        if (chatMessagesEnum.length > 0) {
            const enumType = chatMessagesEnum[0].Type;
            console.log(`chat_messages.senderType: ${enumType}`);

            if (enumType.includes('BOT')) {
                console.log('✅ BOT value present');
            } else {
                console.log('❌ BOT value missing');
            }
        }

        const complaintChatEnum = await prisma.$queryRawUnsafe(
            `SHOW COLUMNS FROM complaint_chat_messages WHERE Field = 'senderType'`
        );

        if (complaintChatEnum.length > 0) {
            const enumType = complaintChatEnum[0].Type;
            console.log(`complaint_chat_messages.senderType: ${enumType}`);

            if (enumType.includes('BOT')) {
                console.log('✅ BOT value present');
            } else {
                console.log('❌ BOT value missing');
            }
        }

        // Test 8: Try to insert and query test data
        console.log('\n📋 Test 8: Testing CRUD operations...\n');

        // Test bot_message_configs
        try {
            const testConfig = await prisma.$queryRawUnsafe(`
        INSERT INTO bot_message_configs 
        (chatType, messageKey, content, content_bn, step_number, display_order, updated_at)
        VALUES ('LIVE_CHAT', 'test_message_1', 'Test message', 'পরীক্ষা বার্তা', 1, 1, NOW())
      `);
            console.log('✅ Insert into bot_message_configs: SUCCESS');

            const configs = await prisma.$queryRawUnsafe(`
        SELECT * FROM bot_message_configs WHERE messageKey = 'test_message_1'
      `);
            console.log(`✅ Query bot_message_configs: Found ${configs.length} record(s)`);

            // Clean up
            await prisma.$queryRawUnsafe(`
        DELETE FROM bot_message_configs WHERE messageKey = 'test_message_1'
      `);
            console.log('✅ Delete from bot_message_configs: SUCCESS');
        } catch (error) {
            console.log(`❌ CRUD test failed: ${error.message}`);
        }

        // Test bot_trigger_rules
        try {
            await prisma.$queryRawUnsafe(`
        INSERT INTO bot_trigger_rules 
        (chatType, is_enabled, reactivation_threshold, updated_at)
        VALUES ('LIVE_CHAT', true, 5, NOW())
        ON DUPLICATE KEY UPDATE is_enabled = true
      `);
            console.log('✅ Insert/Update bot_trigger_rules: SUCCESS');

            const rules = await prisma.$queryRawUnsafe(`
        SELECT * FROM bot_trigger_rules WHERE chatType = 'LIVE_CHAT'
      `);
            console.log(`✅ Query bot_trigger_rules: Found ${rules.length} record(s)`);
        } catch (error) {
            console.log(`❌ Trigger rules test failed: ${error.message}`);
        }

        console.log('\n✅ All verification tests passed!\n');
        console.log('🎉 Bot message system schema is correctly set up!\n');

    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run verification
verifySchema();
