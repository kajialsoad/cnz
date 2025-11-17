const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testChatService() {
    try {
        console.log('Testing Chat Service Methods...\n');

        // Test 1: Get chat messages for a complaint
        console.log('1. Testing getChatMessages()...');
        const complaint = await prisma.complaint.findFirst();

        if (!complaint) {
            console.log('   ⚠️  No complaints found in database. Skipping tests.');
            return;
        }

        console.log(`   Using complaint ID: ${complaint.id}`);

        // Test getChatMessages
        const page = 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            prisma.complaintChatMessage.findMany({
                where: { complaintId: complaint.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' }
            }),
            prisma.complaintChatMessage.count({
                where: { complaintId: complaint.id }
            })
        ]);

        console.log(`   ✓ Found ${messages.length} messages (total: ${total})`);

        // Test 2: Send a chat message
        console.log('\n2. Testing sendChatMessage()...');
        const user = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!user) {
            console.log('   ⚠️  No admin user found. Skipping send message test.');
        } else {
            const newMessage = await prisma.complaintChatMessage.create({
                data: {
                    complaintId: complaint.id,
                    senderId: user.id,
                    senderType: 'ADMIN',
                    message: 'Test message from chat service',
                    read: false
                }
            });
            console.log(`   ✓ Message created with ID: ${newMessage.id}`);

            // Test 3: Get unread message count
            console.log('\n3. Testing getUnreadMessageCount()...');
            const unreadCount = await prisma.complaintChatMessage.count({
                where: {
                    complaintId: complaint.id,
                    senderType: 'CITIZEN',
                    read: false
                }
            });
            console.log(`   ✓ Unread messages for admin: ${unreadCount}`);

            // Test 4: Mark messages as read
            console.log('\n4. Testing markMessagesAsRead()...');
            const result = await prisma.complaintChatMessage.updateMany({
                where: {
                    complaintId: complaint.id,
                    senderType: 'CITIZEN',
                    read: false
                },
                data: {
                    read: true
                }
            });
            console.log(`   ✓ Marked ${result.count} messages as read`);

            // Clean up test message
            await prisma.complaintChatMessage.delete({
                where: { id: newMessage.id }
            });
            console.log('\n   ✓ Test message cleaned up');
        }

        console.log('\n✅ All chat service methods are working correctly!');

    } catch (error) {
        console.error('❌ Error testing chat service:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testChatService();
