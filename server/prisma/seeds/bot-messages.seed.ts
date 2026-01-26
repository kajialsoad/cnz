import { PrismaClient, ChatType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBotMessages() {
    console.log('🤖 Starting bot message system seed...');

    // Seed Live Chat Bot Messages
    console.log('\n📱 Seeding Live Chat bot messages...');

    const liveChatMessages = [
        {
            chatType: ChatType.LIVE_CHAT,
            messageKey: 'live_chat_welcome',
            content: 'Welcome to Clean Care Live Chat! How can we help you today?',
            contentBn: 'ক্লিন কেয়ার লাইভ চ্যাটে স্বাগতম! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি?',
            stepNumber: 1,
            displayOrder: 1,
            isActive: true,
        },
        {
            chatType: ChatType.LIVE_CHAT,
            messageKey: 'live_chat_team_response',
            content: 'Our team will respond shortly. You can send text, images, or voice messages.',
            contentBn: 'আমাদের টিম শীঘ্রই উত্তর দেবে। আপনি টেক্সট, ছবি বা ভয়েস মেসেজ পাঠাতে পারেন।',
            stepNumber: 2,
            displayOrder: 2,
            isActive: true,
        },
        {
            chatType: ChatType.LIVE_CHAT,
            messageKey: 'live_chat_office_hours',
            content: 'Office hours: Saturday to Thursday, 9 AM - 5 PM',
            contentBn: 'অফিস সময়: শনিবার থেকে বৃহস্পতিবার, সকাল ৯টা - বিকাল ৫টা',
            stepNumber: 3,
            displayOrder: 3,
            isActive: true,
        },
    ];

    for (const message of liveChatMessages) {
        await prisma.botMessageConfig.upsert({
            where: { messageKey: message.messageKey },
            update: {
                content: message.content,
                contentBn: message.contentBn,
                stepNumber: message.stepNumber,
                displayOrder: message.displayOrder,
                isActive: message.isActive,
            },
            create: message,
        });
        console.log(`   ✅ Created/Updated: ${message.messageKey} (Step ${message.stepNumber})`);
    }

    // Seed Complaint Chat Bot Messages
    console.log('\n📋 Seeding Complaint Chat bot messages...');

    const complaintChatMessages = [
        {
            chatType: ChatType.COMPLAINT_CHAT,
            messageKey: 'complaint_chat_received',
            content: 'Your complaint has been received and is being reviewed.',
            contentBn: 'আপনার অভিযোগ গ্রহণ করা হয়েছে এবং পর্যালোচনা করা হচ্ছে।',
            stepNumber: 1,
            displayOrder: 1,
            isActive: true,
        },
        {
            chatType: ChatType.COMPLAINT_CHAT,
            messageKey: 'complaint_chat_working',
            content: 'Our team is working on your complaint. We will update you soon.',
            contentBn: 'আমাদের টিম আপনার অভিযোগে কাজ করছে। আমরা শীঘ্রই আপডেট দেব।',
            stepNumber: 2,
            displayOrder: 2,
            isActive: true,
        },
        {
            chatType: ChatType.COMPLAINT_CHAT,
            messageKey: 'complaint_chat_patience',
            content: 'Please wait while we process your complaint. Thank you for your patience.',
            contentBn: 'আপনার অভিযোগ প্রক্রিয়া করার সময় অনুগ্রহ করে অপেক্ষা করুন। আপনার ধৈর্যের জন্য ধন্যবাদ।',
            stepNumber: 3,
            displayOrder: 3,
            isActive: true,
        },
    ];

    for (const message of complaintChatMessages) {
        await prisma.botMessageConfig.upsert({
            where: { messageKey: message.messageKey },
            update: {
                content: message.content,
                contentBn: message.contentBn,
                stepNumber: message.stepNumber,
                displayOrder: message.displayOrder,
                isActive: message.isActive,
            },
            create: message,
        });
        console.log(`   ✅ Created/Updated: ${message.messageKey} (Step ${message.stepNumber})`);
    }

    // Seed Bot Trigger Rules
    console.log('\n⚙️  Seeding bot trigger rules...');

    const triggerRules = [
        {
            chatType: ChatType.LIVE_CHAT,
            isEnabled: true,
            reactivationThreshold: 5,
            resetStepsOnReactivate: false,
        },
        {
            chatType: ChatType.COMPLAINT_CHAT,
            isEnabled: true,
            reactivationThreshold: 5,
            resetStepsOnReactivate: false,
        },
    ];

    for (const rule of triggerRules) {
        await prisma.botTriggerRule.upsert({
            where: { chatType: rule.chatType },
            update: {
                isEnabled: rule.isEnabled,
                reactivationThreshold: rule.reactivationThreshold,
                resetStepsOnReactivate: rule.resetStepsOnReactivate,
            },
            create: rule,
        });
        console.log(`   ✅ Created/Updated trigger rule for: ${rule.chatType}`);
        console.log(`      - Enabled: ${rule.isEnabled}`);
        console.log(`      - Reactivation Threshold: ${rule.reactivationThreshold} messages`);
        console.log(`      - Reset Steps on Reactivate: ${rule.resetStepsOnReactivate}`);
    }

    console.log('\n✅ Bot message system seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Live Chat Messages: ${liveChatMessages.length} steps`);
    console.log(`   Complaint Chat Messages: ${complaintChatMessages.length} steps`);
    console.log(`   Trigger Rules: ${triggerRules.length} chat types`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🎯 Bot messages are now ready to use!');
    console.log('   - Live Chat: 3-step automated response system');
    console.log('   - Complaint Chat: 3-step automated response system');
    console.log('   - Bot will trigger on user messages until admin replies');
    console.log('   - Bot reactivates after 5 user messages without admin reply');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
    try {
        await seedBotMessages();
    } catch (error) {
        console.error('❌ Error seeding bot messages:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
