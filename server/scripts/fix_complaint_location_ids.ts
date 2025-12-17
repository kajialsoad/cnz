import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixComplaintLocationIds() {
    try {
        console.log('🔍 Finding complaints with missing location IDs...');

        // Find all complaints with missing location data that have a userId
        const complaints = await prisma.complaint.findMany({
            where: {
                OR: [
                    { wardId: null },
                    { zoneId: null },
                    { cityCorporationCode: null }
                ],
                userId: { not: null }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        cityCorporationCode: true,
                        zoneId: true,
                        wardId: true
                    }
                }
            }
        });

        console.log(`📊 Found ${complaints.length} complaints with missing location IDs`);

        // Update each complaint with user's location data
        for (const complaint of complaints) {
            if (complaint.user) {
                await prisma.complaint.update({
                    where: { id: complaint.id },
                    data: {
                        cityCorporationCode: complaint.user.cityCorporationCode,
                        zoneId: complaint.user.zoneId,
                        wardId: complaint.user.wardId
                    }
                });
                console.log(`✅ Fixed complaint #${complaint.id} - Ward: ${complaint.user.wardId}, Zone: ${complaint.user.zoneId}`);
            }
        }

        console.log('🎉 Done! All complaints updated.');

        // Verify complaint #224
        const complaint224 = await prisma.complaint.findUnique({
            where: { id: 224 },
            select: {
                id: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true
            }
        });

        console.log('\n📋 Complaint #224 status:');
        console.log(JSON.stringify(complaint224, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixComplaintLocationIds();
