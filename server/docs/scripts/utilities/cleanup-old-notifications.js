/**
 * Clean Up Old Notifications Script
 * 
 * এই script পুরনো notification গুলো clean করবে যেগুলো Super Admin-দের জন্য
 * ভুল zone থেকে এসেছে।
 * 
 * কী করবে:
 * 1. সব Super Admin-দের assigned zones খুঁজে বের করবে
 * 2. তাদের notification গুলো check করবে
 * 3. যেসব notification তাদের zone-এর না, সেগুলো delete করবে
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOldNotifications() {
    console.log('🧹 Starting notification cleanup...\n');

    try {
        // Step 1: Find all Super Admins
        const superAdmins = await prisma.user.findMany({
            where: {
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                assignedZones: {
                    select: {
                        zoneId: true
                    }
                }
            }
        });

        console.log(`📊 Found ${superAdmins.length} Super Admins\n`);

        let totalDeleted = 0;
        let totalKept = 0;

        // Step 2: Process each Super Admin
        for (const admin of superAdmins) {
            const assignedZoneIds = admin.assignedZones.map(z => z.zoneId);

            console.log(`\n👤 Processing: ${admin.firstName} ${admin.lastName} (${admin.email})`);
            console.log(`   Assigned Zones: [${assignedZoneIds.join(', ')}]`);

            // Get all notifications for this admin
            const notifications = await prisma.notification.findMany({
                where: {
                    userId: admin.id
                },
                include: {
                    complaint: {
                        select: {
                            id: true,
                            title: true,
                            complaintZoneId: true,
                            zoneId: true
                        }
                    }
                }
            });

            console.log(`   Total Notifications: ${notifications.length}`);

            // Filter notifications to delete
            const notificationsToDelete = [];
            const notificationsToKeep = [];

            for (const notification of notifications) {
                // If no complaint, keep it (might be system notification)
                if (!notification.complaint) {
                    notificationsToKeep.push(notification.id);
                    continue;
                }

                // Get complaint zone (with fallback)
                const complaintZoneId = notification.complaint.complaintZoneId ?? notification.complaint.zoneId;

                // If complaint has no zone, delete it (safe default)
                if (!complaintZoneId) {
                    notificationsToDelete.push(notification.id);
                    continue;
                }

                // Check if complaint zone is in admin's assigned zones
                if (assignedZoneIds.includes(complaintZoneId)) {
                    notificationsToKeep.push(notification.id);
                } else {
                    notificationsToDelete.push(notification.id);
                }
            }

            console.log(`   ✅ Keeping: ${notificationsToKeep.length} notifications`);
            console.log(`   ❌ Deleting: ${notificationsToDelete.length} notifications`);

            // Delete invalid notifications
            if (notificationsToDelete.length > 0) {
                const result = await prisma.notification.deleteMany({
                    where: {
                        id: { in: notificationsToDelete }
                    }
                });

                console.log(`   🗑️  Deleted: ${result.count} notifications`);
                totalDeleted += result.count;
            }

            totalKept += notificationsToKeep.length;
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Cleanup Complete!');
        console.log('='.repeat(60));
        console.log(`📊 Summary:`);
        console.log(`   - Total Super Admins Processed: ${superAdmins.length}`);
        console.log(`   - Total Notifications Kept: ${totalKept}`);
        console.log(`   - Total Notifications Deleted: ${totalDeleted}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run cleanup
cleanupOldNotifications()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
