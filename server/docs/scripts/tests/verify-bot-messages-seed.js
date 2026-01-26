const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyBotMessages() {
    console.log('🔍 Verifying bot message seed data...\n');

    try {
        // Check Live Chat messages
        console.log('📱 Live Chat Messages:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const liveChatMessages = await prisma.botMessageConfig.findMany({
            where: { chatType: 'LIVE_CHAT' },
            orderBy: { stepNumber: 'asc' },
        });

        if (liveChatMessages.length === 0) {
            console.log('❌ No Live Chat messages found!');
        } else {
            liveChatMessages.forEach((msg) => {
                console.log(`\nStep ${msg.stepNumber}: ${msg.messageKey}`);
                console.log(`   English: ${msg.content}`);
                console.log(`   Bangla: ${msg.contentBn}`);
                console.log(`   Active: ${msg.isActive ? '✅' : '❌'}`);
                console.log(`   Display Order: ${msg.displayOrder}`);
            });
        }

        // Check Complaint Chat messages
        console.log('\n\n📋 Complaint Chat Messages:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const complaintChatMessages = await prisma.botMessageConfig.findMany({
            where: { chatType: 'COMPLAINT_CHAT' },
            orderBy: { stepNumber: 'asc' },
        });

        if (complaintChatMessages.length === 0) {
            console.log('❌ No Complaint Chat messages found!');
        } else {
            complaintChatMessages.forEach((msg) => {
                console.log(`\nStep ${msg.stepNumber}: ${msg.messageKey}`);
                console.log(`   English: ${msg.content}`);
                console.log(`   Bangla: ${msg.contentBn}`);
                console.log(`   Active: ${msg.isActive ? '✅' : '❌'}`);
                console.log(`   Display Order: ${msg.displayOrder}`);
            });
        }

        // Check Trigger Rules
        console.log('\n\n⚙️  Bot Trigger Rules:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const triggerRules = await prisma.botTriggerRule.findMany();

        if (triggerRules.length === 0) {
            console.log('❌ No trigger rules found!');
        } else {
            triggerRules.forEach((rule) => {
                console.log(`\n${rule.chatType}:`);
                console.log(`   Enabled: ${rule.isEnabled ? '✅' : '❌'}`);
                console.log(`   Reactivation Threshold: ${rule.reactivationThreshold} messages`);
                console.log(`   Reset Steps on Reactivate: ${rule.resetStepsOnReactivate ? 'Yes' : 'No'}`);
            });
        }

        // Summary
        console.log('\n\n📊 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Total Bot Messages: ${liveChatMessages.length + complaintChatMessages.length}`);
        console.log(`   Live Chat Steps: ${liveChatMessages.length}`);
        console.log(`   Complaint Chat Steps: ${complaintChatMessages.length}`);
        console.log(`   Trigger Rules: ${triggerRules.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const allActive = [...liveChatMessages, ...complaintChatMessages].every(msg => msg.isActive);
        const allRulesEnabled = triggerRules.every(rule => rule.isEnabled);

        if (allActive && allRulesEnabled) {
            console.log('\n✅ All bot messages are active and trigger rules are enabled!');
            console.log('🎯 Bot message system is ready to use!');
        } else {
            console.log('\n⚠️  Some messages or rules are disabled. Check configuration.');
        }

    } catch (error) {
        console.error('\n❌ Error verifying bot messages:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifyBotMessages()
    .then(() => {
        console.log('\n✅ Verification complete!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    });
