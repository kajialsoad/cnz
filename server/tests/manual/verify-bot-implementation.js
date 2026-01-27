/**
 * Bot Implementation Verification Script
 * Verifies that the bot trigger system is implemented correctly
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyBotImplementation() {
    console.log('\n========================================');
    console.log('   BOT IMPLEMENTATION VERIFICATION');
    console.log('========================================\n');

    let allChecks = true;

    try {
        // ============================================
        // CHECK 1: Bot Trigger Rules Configuration
        // ============================================
        console.log('📋 CHECK 1: Bot Trigger Rules\n');

        const liveChatRule = await prisma.botTriggerRule.findUnique({
            where: { chatType: 'LIVE_CHAT' }
        });

        const complaintChatRule = await prisma.botTriggerRule.findUnique({
            where: { chatType: 'COMPLAINT_CHAT' }
        });

        if (!liveChatRule) {
            console.log('❌ FAIL: Live Chat trigger rule NOT found');
            allChecks = false;
        } else {
            console.log('✅ PASS: Live Chat trigger rule found');
            console.log(`   - Enabled: ${liveChatRule.isEnabled}`);
            console.log(`   - Threshold: ${liveChatRule.reactivationThreshold}`);
            console.log(`   - Reset Steps: ${liveChatRule.resetStepsOnReactivate}`);
        }

        if (!complaintChatRule) {
            console.log('❌ FAIL: Complaint Chat trigger rule NOT found');
            allChecks = false;
        } else {
            console.log('✅ PASS: Complaint Chat trigger rule found');
            console.log(`   - Enabled: ${complaintChatRule.isEnabled}`);
            console.log(`   - Threshold: ${complaintChatRule.reactivationThreshold}`);
            console.log(`   - Reset Steps: ${complaintChatRule.resetStepsOnReactivate}`);
        }

        console.log('');

        // ============================================
        // CHECK 2: Bot Messages Configuration
        // ============================================
        console.log('📋 CHECK 2: Bot Messages\n');

        const liveChatMessages = await prisma.botMessageConfig.findMany({
            where: { chatType: 'LIVE_CHAT', isActive: true },
            orderBy: { stepNumber: 'asc' }
        });

        const complaintChatMessages = await prisma.botMessageConfig.findMany({
            where: { chatType: 'COMPLAINT_CHAT', isActive: true },
            orderBy: { stepNumber: 'asc' }
        });

        if (liveChatMessages.length === 0) {
            console.log('❌ FAIL: No Live Chat messages configured');
            allChecks = false;
        } else {
            console.log(`✅ PASS: ${liveChatMessages.length} Live Chat messages found`);
            liveChatMessages.forEach(msg => {
                console.log(`   - Step ${msg.stepNumber}: ${msg.content.substring(0, 50)}...`);
            });
        }

        if (complaintChatMessages.length === 0) {
            console.log('❌ FAIL: No Complaint Chat messages configured');
            allChecks = false;
        } else {
            console.log(`✅ PASS: ${complaintChatMessages.length} Complaint Chat messages found`);
            complaintChatMessages.forEach(msg => {
                console.log(`   - Step ${msg.stepNumber}: ${msg.content.substring(0, 50)}...`);
            });
        }

        console.log('');

        // ============================================
        // CHECK 3: Bot Conversation States
        // ============================================
        console.log('📋 CHECK 3: Bot Conversation States\n');

        const totalStates = await prisma.botConversationState.count();
        const activeStates = await prisma.botConversationState.count({
            where: { isActive: true }
        });
        const inactiveStates = await prisma.botConversationState.count({
            where: { isActive: false }
        });

        console.log(`Total Conversations: ${totalStates}`);
        console.log(`Active Bots: ${activeStates}`);
        console.log(`Inactive Bots: ${inactiveStates}`);

        if (totalStates > 0) {
            console.log('\nRecent Conversation States:');
            const recentStates = await prisma.botConversationState.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' }
            });

            recentStates.forEach(state => {
                console.log(`\n  ${state.conversationId}:`);
                console.log(`    - Type: ${state.chatType}`);
                console.log(`    - Active: ${state.isActive ? '✅ YES' : '❌ NO'}`);
                console.log(`    - Step: ${state.currentStep}`);
                console.log(`    - User Messages: ${state.userMessageCount}`);
                console.log(`    - Last Bot: ${state.lastBotMessageAt ? state.lastBotMessageAt.toLocaleString() : 'Never'}`);
                console.log(`    - Last Admin: ${state.lastAdminReplyAt ? state.lastAdminReplyAt.toLocaleString() : 'Never'}`);
            });
        } else {
            console.log('ℹ️  No conversation states yet (normal for new system)');
        }

        console.log('');

        // ============================================
        // CHECK 4: Bot Deactivation Verification
        // ============================================
        console.log('📋 CHECK 4: Bot Deactivation Verification\n');

        const deactivatedStates = await prisma.botConversationState.findMany({
            where: {
                isActive: false,
                lastAdminReplyAt: { not: null }
            },
            take: 3,
            orderBy: { lastAdminReplyAt: 'desc' }
        });

        if (deactivatedStates.length === 0) {
            console.log('ℹ️  No deactivated conversations found (no admin replies yet)');
        } else {
            console.log(`✅ Found ${deactivatedStates.length} deactivated conversations:`);
            deactivatedStates.forEach(state => {
                console.log(`\n  ${state.conversationId}:`);
                console.log(`    - Deactivated: ${state.lastAdminReplyAt.toLocaleString()}`);
                console.log(`    - User Message Count: ${state.userMessageCount}`);
                console.log(`    - Current Step: ${state.currentStep}`);

                // Verify that userMessageCount was reset to 0
                if (state.userMessageCount === 0) {
                    console.log('    - Counter Reset: ✅ YES');
                } else {
                    console.log('    - Counter Reset: ⚠️  NO (should be 0)');
                }
            });
        }

        console.log('');

        // ============================================
        // CHECK 5: Bot Analytics
        // ============================================
        console.log('📋 CHECK 5: Bot Analytics\n');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const analytics = await prisma.botMessageAnalytics.findMany({
            where: {
                date: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: { date: 'desc' }
        });

        if (analytics.length === 0) {
            console.log('ℹ️  No analytics data yet (bot hasn\'t been triggered)');
        } else {
            console.log(`✅ Found ${analytics.length} analytics records (last 7 days):`);

            const totalTriggers = analytics.reduce((sum, a) => sum + a.triggerCount, 0);
            const totalReplies = analytics.reduce((sum, a) => sum + a.adminReplyCount, 0);

            console.log(`\n  Total Bot Triggers: ${totalTriggers}`);
            console.log(`  Total Admin Replies: ${totalReplies}`);
            console.log(`  Admin Reply Rate: ${totalTriggers > 0 ? ((totalReplies / totalTriggers) * 100).toFixed(1) : 0}%`);
        }

        console.log('');

        // ============================================
        // CHECK 6: Implementation Code Verification
        // ============================================
        console.log('📋 CHECK 6: Implementation Code Verification\n');
        console.log('⚠️  Manual code review required:');
        console.log('');
        console.log('1. Check server/src/services/bot-message.service.ts:');
        console.log('   - handleAdminReply() is synchronous (uses await)');
        console.log('   - Sets isActive = false IMMEDIATELY');
        console.log('   - Resets userMessageCount = 0');
        console.log('');
        console.log('2. Check server/src/services/live-chat.service.ts:');
        console.log('   - sendAdminMessage() calls handleAdminReply() BEFORE creating message');
        console.log('   - Uses await botMessageService.handleAdminReply()');
        console.log('');
        console.log('3. Check server/src/services/chat.service.ts:');
        console.log('   - sendChatMessage() calls handleAdminReply() BEFORE creating message');
        console.log('   - Uses await botMessageService.handleAdminReply()');
        console.log('');

        // ============================================
        // SUMMARY
        // ============================================
        console.log('========================================');
        console.log('   VERIFICATION SUMMARY');
        console.log('========================================\n');

        if (allChecks) {
            console.log('✅ ALL CHECKS PASSED');
            console.log('');
            console.log('Bot system is properly configured!');
            console.log('');
            console.log('Next steps:');
            console.log('1. Perform manual testing (see BOT_SYSTEM_TEST_GUIDE_BANGLA.md)');
            console.log('2. Test bot looping behavior');
            console.log('3. Test bot deactivation on admin reply');
            console.log('4. Test bot reactivation after threshold');
            console.log('');
        } else {
            console.log('❌ SOME CHECKS FAILED');
            console.log('');
            console.log('Please fix the issues above and run this script again.');
            console.log('');
        }

        // ============================================
        // TESTING INSTRUCTIONS
        // ============================================
        console.log('========================================');
        console.log('   MANUAL TESTING REQUIRED');
        console.log('========================================\n');
        console.log('Database configuration looks good, but you need to test:');
        console.log('');
        console.log('TEST 1: Bot sends messages when admin hasn\'t replied');
        console.log('  - Open Live Chat as user');
        console.log('  - Send message → Bot should reply');
        console.log('  - Send another message → Bot should reply with next step');
        console.log('');
        console.log('TEST 2: Bot deactivates when admin replies');
        console.log('  - Admin sends message');
        console.log('  - User sends message → Bot should NOT reply');
        console.log('  - Check database: isActive should be false');
        console.log('');
        console.log('TEST 3: Bot reactivates after threshold');
        console.log('  - User sends 3 messages (threshold = 3)');
        console.log('  - On 3rd message → Bot should reactivate and reply');
        console.log('');
        console.log('See BOT_SYSTEM_TEST_GUIDE_BANGLA.md for detailed instructions.');
        console.log('');

    } catch (error) {
        console.error('\n❌ ERROR during verification:', error.message);
        console.error('\nStack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run verification
verifyBotImplementation();
