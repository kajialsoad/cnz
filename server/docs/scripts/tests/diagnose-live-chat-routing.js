/**
 * Quick Diagnostic Script for Live Chat Message Routing
 * 
 * This script checks the database to diagnose why messages aren't reaching admins
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('='.repeat(80));
        console.log('LIVE CHAT MESSAGE ROUTING DIAGNOSTIC');
        console.log('='.repeat(80));

        // 1. Find user "Pallab Ray"
        console.log('\n📱 Step 1: Finding user "Pallab Ray"...');
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'Pallab' } },
                    { firstName: { contains: 'pallab' } },
                    { lastName: { contains: 'Ray' } },
                    { lastName: { contains: 'ray' } },
                    { firstName: { contains: 'Ray' } },
                    { firstName: { contains: 'ray' } },
                ]
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true,
                status: true,
                ward: {
                    select: { id: true, number: true, wardNumber: true }
                },
                zone: {
                    select: { id: true, number: true, name: true }
                }
            }
        });

        if (users.length === 0) {
            console.log('❌ No user found with name containing "Pallab" or "Ray"');
            console.log('   Please check the exact name in the database');
            return;
        }

        console.log(`✅ Found ${users.length} user(s):`);
        users.forEach((user, index) => {
            console.log(`\n   User ${index + 1}:`);
            console.log('   ID:', user.id);
            console.log('   Name:', user.firstName, user.lastName);
            console.log('   Phone:', user.phone);
            console.log('   Email:', user.email);
            console.log('   Role:', user.role);
            console.log('   Ward ID:', user.wardId);
            console.log('   Ward:', user.ward);
            console.log('   Zone ID:', user.zoneId);
            console.log('   Zone:', user.zone);
            console.log('   City Corp:', user.cityCorporationCode);
            console.log('   Status:', user.status);
        });

        // For each user, check their messages and assigned admin
        for (const user of users) {
            if (user.role !== 'CUSTOMER') {
                console.log(`\n⚠️  Skipping user ${user.id} - not a CUSTOMER (role: ${user.role})`);
                continue;
            }

            console.log('\n' + '-'.repeat(80));
            console.log(`Analyzing user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
            console.log('-'.repeat(80));

            // 2. Find assigned admin for this user
            console.log('\n🔍 Step 2: Finding assigned admin...');

            let assignedAdmin = null;

            // Try to find ward admin first
            if (user.wardId) {
                assignedAdmin = await prisma.user.findFirst({
                    where: {
                        role: 'ADMIN',
                        wardId: user.wardId,
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        wardId: true,
                        zoneId: true
                    }
                });

                if (assignedAdmin) {
                    console.log('✅ Found Ward Admin:');
                    console.log('   ID:', assignedAdmin.id);
                    console.log('   Name:', assignedAdmin.firstName, assignedAdmin.lastName);
                    console.log('   Email:', assignedAdmin.email);
                    console.log('   Ward ID:', assignedAdmin.wardId);
                }
            }

            // If no ward admin, try zone super admin
            if (!assignedAdmin && user.zoneId) {
                assignedAdmin = await prisma.user.findFirst({
                    where: {
                        role: 'SUPER_ADMIN',
                        zoneId: user.zoneId,
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        wardId: true,
                        zoneId: true
                    }
                });

                if (assignedAdmin) {
                    console.log('✅ Found Zone Super Admin:');
                    console.log('   ID:', assignedAdmin.id);
                    console.log('   Name:', assignedAdmin.firstName, assignedAdmin.lastName);
                    console.log('   Email:', assignedAdmin.email);
                    console.log('   Zone ID:', assignedAdmin.zoneId);
                }
            }

            if (!assignedAdmin) {
                console.log('❌ No admin assigned to this user!');
                console.log('   User Ward ID:', user.wardId);
                console.log('   User Zone ID:', user.zoneId);
                console.log('\n   SOLUTION: Assign an admin to this ward/zone');
                continue;
            }

            // 3. Check messages sent by this user
            console.log('\n📤 Step 3: Checking messages sent by user...');
            const sentMessages = await prisma.chatMessage.findMany({
                where: {
                    senderId: user.id
                },
                select: {
                    id: true,
                    content: true,
                    type: true,
                    senderId: true,
                    receiverId: true,
                    senderType: true,
                    isRead: true,
                    createdAt: true,
                    receiver: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            });

            if (sentMessages.length === 0) {
                console.log('⚠️  No messages sent by this user yet');
            } else {
                console.log(`✅ Found ${sentMessages.length} messages sent by user:`);
                sentMessages.forEach((msg, index) => {
                    console.log(`\n   Message ${index + 1}:`);
                    console.log('   ID:', msg.id);
                    console.log('   Content:', msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''));
                    console.log('   Type:', msg.type);
                    console.log('   Receiver ID:', msg.receiverId);
                    console.log('   Receiver Name:', msg.receiver?.firstName, msg.receiver?.lastName);
                    console.log('   Receiver Role:', msg.receiver?.role);
                    console.log('   Is Read:', msg.isRead);
                    console.log('   Created:', msg.createdAt);

                    // Check if message went to correct admin
                    if (msg.receiverId !== assignedAdmin.id) {
                        console.log('   ⚠️  WARNING: Message sent to different admin!');
                        console.log('   Expected admin ID:', assignedAdmin.id);
                        console.log('   Actual receiver ID:', msg.receiverId);
                    }
                });
            }

            // 4. Check if admin can see this user in their conversation list
            console.log('\n👤 Step 4: Checking if admin can see this user...');

            // Simulate the getAllUserConversations query
            const userWhere = {
                role: 'CUSTOMER',
                status: 'ACTIVE',
                id: user.id
            };

            const visibleToAdmin = await prisma.user.findFirst({
                where: userWhere,
                select: { id: true, firstName: true, lastName: true }
            });

            if (visibleToAdmin) {
                console.log('✅ User is visible to admin (passes filters)');
            } else {
                console.log('❌ User is NOT visible to admin (filtered out)');
                console.log('   This should not happen - check getAllUserConversations logic');
            }

            // 5. Check last message in conversation
            console.log('\n💬 Step 5: Checking last message in conversation...');
            const lastMessage = await prisma.chatMessage.findFirst({
                where: {
                    OR: [
                        { senderId: user.id, receiverId: assignedAdmin.id },
                        { senderId: assignedAdmin.id, receiverId: user.id }
                    ]
                },
                orderBy: { createdAt: 'desc' }
            });

            if (lastMessage) {
                console.log('✅ Last message found:');
                console.log('   ID:', lastMessage.id);
                console.log('   Content:', lastMessage.content.substring(0, 50));
                console.log('   Sender ID:', lastMessage.senderId);
                console.log('   Receiver ID:', lastMessage.receiverId);
                console.log('   Created:', lastMessage.createdAt);
            } else {
                console.log('⚠️  No messages in conversation yet');
            }

            // 6. Count unread messages
            console.log('\n📬 Step 6: Counting unread messages for admin...');
            const unreadCount = await prisma.chatMessage.count({
                where: {
                    senderId: user.id,
                    receiverId: assignedAdmin.id,
                    isRead: false
                }
            });

            console.log(`   Unread messages: ${unreadCount}`);

            // Summary for this user
            console.log('\n📊 SUMMARY FOR THIS USER:');
            console.log('   User ID:', user.id);
            console.log('   User Name:', user.firstName, user.lastName);
            console.log('   Assigned Admin ID:', assignedAdmin?.id);
            console.log('   Assigned Admin Name:', assignedAdmin?.firstName, assignedAdmin?.lastName);
            console.log('   Messages sent:', sentMessages.length);
            console.log('   Unread messages:', unreadCount);
            console.log('   Visible to admin:', !!visibleToAdmin);

            if (sentMessages.length > 0 && unreadCount > 0 && visibleToAdmin) {
                console.log('\n✅ Everything looks good! Admin should be able to see messages.');
                console.log('   If admin still cannot see messages:');
                console.log('   1. Clear browser cache and reload admin panel');
                console.log('   2. Check admin panel console for errors');
                console.log('   3. Verify admin is logged in with correct account');
            } else if (sentMessages.length === 0) {
                console.log('\n⚠️  No messages sent yet. User needs to send a message first.');
            } else if (!assignedAdmin) {
                console.log('\n❌ PROBLEM: No admin assigned to user\'s ward/zone');
            } else if (!visibleToAdmin) {
                console.log('\n❌ PROBLEM: User is filtered out from admin\'s view');
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('DIAGNOSTIC COMPLETE');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n❌ Diagnostic failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run diagnostic
diagnose();
