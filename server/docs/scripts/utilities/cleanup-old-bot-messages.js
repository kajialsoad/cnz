const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOldBotMessages() {
    console.log('🧹 Cleaning up old bot message entries...\n');

    try {
        // Delete old Live Chat messages (with old naming convention)
        const oldLiveChatKeys = [
            'live_chat_step_1',
            'live_chat_step_2',
            'live_chat_step_3',
        ];

        console.log('📱 Removing old Live Chat messages...');
        for (const key of oldLiveChatKeys) {
            const deleted = await prisma.botMessageConfig.deleteMany({
                where: { messageKey: key },
            });
            if (deleted.count > 0) {
                console.log(`   ✅ Deleted: ${key}`);
            }
        }

        // Delete old Complaint Chat messages (with old naming convention)
        const oldComplaintChatKeys = [
            'complaint_step_1',
            'complaint_step_2',
            'complaint_step_3',
        ];

        console.log('\n📋 Removing old Complaint Chat messages...');
        for (const key of oldComplaintChatKeys) {
            const deleted = await prisma.botMessageConfig.deleteMany({
                where: { messageKey: key },
            });
            if (deleted.count > 0) {
                console.log(`   ✅ Deleted: ${key}`);
            }
        }

        // Verify remaining messages
        console.log('\n🔍 Verifying remaining messages...');
        const liveChatCount = await prisma.botMessageConfig.count({
            where: { chatType: 'LIVE_CHAT' },
        });
        const complaintChatCount = await prisma.botMessageConfig.count({
            where: { chatType: 'COMPLAINT_CHAT' },
        });

        console.log('\n📊 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Live Chat Messages: ${liveChatCount}`);
        console.log(`   Complaint Chat Messages: ${complaintChatCount}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (liveChatCount === 3 && complaintChatCount === 3) {
            console.log('\n✅ Cleanup successful! Only new bot messages remain.');
        } else {
            console.log('\n⚠️  Warning: Unexpected message count. Please verify manually.');
        }

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanupOldBotMessages()
    .then(() => {
        console.log('\n✅ Cleanup complete!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Cleanup failed:', error);
        process.exit(1);
    });
