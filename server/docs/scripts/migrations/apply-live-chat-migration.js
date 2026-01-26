const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
    console.log('🚀 Applying Live Chat Migration...\n');

    try {
        // Step 1: Add VOICE to ChatMessageType enum
        console.log('Step 1: Adding VOICE to ChatMessageType enum...');
        try {
            await prisma.$executeRaw`
        ALTER TABLE \`ChatMessage\` 
        MODIFY COLUMN \`type\` ENUM('TEXT', 'IMAGE', 'FILE', 'VOICE') NOT NULL DEFAULT 'TEXT'
      `;
            console.log('✓ Success\n');
        } catch (error) {
            if (error.message.includes('already')) {
                console.log('⚠ Already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // Step 2: Add voiceUrl field
        console.log('Step 2: Adding voiceUrl field...');
        try {
            await prisma.$executeRaw`
        ALTER TABLE \`ChatMessage\` 
        ADD COLUMN \`voiceUrl\` VARCHAR(500) NULL AFTER \`fileUrl\`
      `;
            console.log('✓ Success\n');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('⚠ Column already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // Step 3: Add senderType field
        console.log('Step 3: Adding senderType field...');
        try {
            await prisma.$executeRaw`
        ALTER TABLE \`ChatMessage\` 
        ADD COLUMN \`senderType\` ENUM('ADMIN', 'CITIZEN') NOT NULL DEFAULT 'CITIZEN' AFTER \`voiceUrl\`
      `;
            console.log('✓ Success\n');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('⚠ Column already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // Step 4: Add index
        console.log('Step 4: Adding idx_receiver_unread index...');
        try {
            await prisma.$executeRaw`
        ALTER TABLE \`ChatMessage\` 
        ADD INDEX \`idx_receiver_unread\` (\`receiverId\`, \`isRead\`)
      `;
            console.log('✓ Success\n');
        } catch (error) {
            if (error.message.includes('Duplicate key name')) {
                console.log('⚠ Index already exists, skipping...\n');
            } else {
                throw error;
            }
        }

        // Step 5: Rename table
        console.log('Step 5: Renaming table to chat_messages...');
        try {
            await prisma.$executeRaw`
        ALTER TABLE \`ChatMessage\` RENAME TO \`chat_messages\`
      `;
            console.log('✓ Success\n');
        } catch (error) {
            if (error.message.includes("doesn't exist") || error.message.includes('already exists')) {
                console.log('⚠ Table already renamed, skipping...\n');
            } else {
                throw error;
            }
        }

        console.log('✅ Migration applied successfully!');
        console.log('\n📋 Changes made:');
        console.log('  1. Added VOICE to ChatMessageType enum');
        console.log('  2. Added voiceUrl field (VARCHAR 500)');
        console.log('  3. Added senderType field (ENUM: ADMIN, CITIZEN)');
        console.log('  4. Added idx_receiver_unread index');
        console.log('  5. Renamed table to chat_messages');
        console.log('\n🎉 Live Chat database schema is ready!');
        console.log('\nNext steps:');
        console.log('  1. Run: npx prisma generate');
        console.log('  2. Run: node verify-live-chat-migration.js');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyMigration();
