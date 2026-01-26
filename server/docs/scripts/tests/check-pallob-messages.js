const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessages() {
    try {
        const userId = 445; // Pallob Roy

        console.log('='.repeat(80));
        console.log('CHECKING MESSAGES FOR PALLOB ROY (ID: 445)');
        console.log('='.repeat(80));

        // 1. Get user info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                wardId: true,
                zoneId: true,
                ward: { select: { id: true, wardNumber: true } },
                zone: { select: { id: true, name: true } }
            }
        });

        console.log('\n📱 User Info:');
        console.log('  Name:', user.firstName, user.lastName);
        console.log('  Ward ID:', user.wardId);
        console.log('  Ward Number:', user.ward?.wardNumber);
        console.log('  Zone ID:', user.zoneId);
        console.log('  Zone Name:', user.zone?.name);

        // 2. Find assigned admin
        console.log('\n🔍 Finding assigned admin...');

        // Try ward admin first - get all admins and check permissions manually
        const allAdmins = await prisma.user.findMany({
            where: {
                role: 'ADMIN',
                status: 'ACTIVE'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                permissions: true
            }
        });

        let assignedAdmin = null;
        for (const admin of allAdmins) {
            if (admin.permissions) {
                const perms = typeof admin.permissions === 'string'
                    ? JSON.parse(admin.permissions)
                    : admin.permissions;

                if (perms.wards && Array.isArray(perms.wards) && perms.wards.includes(user.wardId)) {
                    assignedAdmin = admin;
                    break;
                }
            }
        }

        if (!assignedAdmin) {
            // Try zone super admin
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
                    zoneId: true
                }
            });
        }

        if (assignedAdmin) {
            console.log('✅ Found assigned admin:');
            console.log('  ID:', assignedAdmin.id);
            console.log('  Name:', assignedAdmin.firstName, assignedAdmin.lastName);
            console.log('  Email:', assignedAdmin.email);
            console.log('  Role:', assignedAdmin.role);
        } else {
            console.log('❌ No admin assigned to this ward/zone!');
            return;
        }

        // 3. Check messages sent by user
        console.log('\n📤 Messages sent by user:');
        const sentMessages = await prisma.chatMessage.findMany({
            where: { senderId: userId },
            select: {
                id: true,
                content: true,
                type: true,
                senderId: true,
                receiverId: true,
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
            console.log('  ⚠️  No messages sent yet');
        } else {
            console.log(`  ✅ Found ${sentMessages.length} messages:`);
            sentMessages.forEach((msg, i) => {
                console.log(`\n  Message ${i + 1}:`);
                console.log('    Content:', msg.content.substring(0, 50));
                console.log('    Type:', msg.type);
                console.log('    Receiver ID:', msg.receiverId);
                console.log('    Receiver:', msg.receiver?.firstName, msg.receiver?.lastName, `(${msg.receiver?.role})`);
                console.log('    Is Read:', msg.isRead);
                console.log('    Created:', msg.createdAt);

                if (msg.receiverId !== assignedAdmin.id) {
                    console.log('    ⚠️  WARNING: Message sent to different admin!');
                    console.log('    Expected:', assignedAdmin.id);
                    console.log('    Actual:', msg.receiverId);
                }
            });
        }

        // 4. Check unread messages
        console.log('\n📬 Unread messages for admin:');
        const unreadCount = await prisma.chatMessage.count({
            where: {
                senderId: userId,
                receiverId: assignedAdmin.id,
                isRead: false
            }
        });
        console.log('  Count:', unreadCount);

        // 5. Check if admin can see this user
        console.log('\n👥 Checking admin visibility...');

        // Get admin's full info
        const adminFull = await prisma.user.findUnique({
            where: { id: assignedAdmin.id },
            select: {
                id: true,
                role: true,
                wardId: true,
                zoneId: true,
                permissions: true
            }
        });

        console.log('  Admin Role:', adminFull.role);
        console.log('  Admin Ward ID:', adminFull.wardId);
        console.log('  Admin Zone ID:', adminFull.zoneId);
        console.log('  Admin Permissions:', adminFull.permissions);

        // Check if user matches admin's filter
        let canSee = false;
        if (adminFull.role === 'ADMIN') {
            // Check permissions
            if (adminFull.permissions) {
                const perms = typeof adminFull.permissions === 'string'
                    ? JSON.parse(adminFull.permissions)
                    : adminFull.permissions;

                if (perms.wards && Array.isArray(perms.wards)) {
                    canSee = perms.wards.includes(user.wardId);
                    console.log('  Admin assigned wards:', perms.wards);
                    console.log('  User ward ID:', user.wardId);
                    console.log('  Can see user:', canSee);
                }
            }
        } else if (adminFull.role === 'SUPER_ADMIN') {
            canSee = adminFull.zoneId === user.zoneId;
            console.log('  Can see user:', canSee);
        } else if (adminFull.role === 'MASTER_ADMIN') {
            canSee = true;
            console.log('  Can see user: true (MASTER_ADMIN sees all)');
        }

        // 6. Summary
        console.log('\n' + '='.repeat(80));
        console.log('SUMMARY');
        console.log('='.repeat(80));
        console.log('User ID:', userId);
        console.log('User Name:', user.firstName, user.lastName);
        console.log('Assigned Admin ID:', assignedAdmin.id);
        console.log('Assigned Admin Name:', assignedAdmin.firstName, assignedAdmin.lastName);
        console.log('Messages sent:', sentMessages.length);
        console.log('Unread messages:', unreadCount);
        console.log('Admin can see user:', canSee);

        if (!canSee) {
            console.log('\n❌ PROBLEM: Admin cannot see this user due to filtering!');
            console.log('   User ward ID:', user.wardId);
            console.log('   Admin role:', adminFull.role);
            if (adminFull.role === 'ADMIN') {
                const perms = typeof adminFull.permissions === 'string'
                    ? JSON.parse(adminFull.permissions)
                    : adminFull.permissions;
                console.log('   Admin assigned wards:', perms.wards || 'none');
                console.log('\n   SOLUTION: Add ward', user.wardId, 'to admin permissions');
            }
        } else if (sentMessages.length > 0 && unreadCount > 0) {
            console.log('\n✅ Everything looks good!');
            console.log('   If admin still cannot see messages:');
            console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
            console.log('   2. Hard refresh (Ctrl+Shift+R)');
            console.log('   3. Logout and login again');
            console.log('   4. Wait 5 seconds for polling to update');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMessages();
