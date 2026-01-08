const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkComplaints() {
    try {
        console.log('🔍 Checking complaints location data...\n');

        const complaints = await prisma.complaint.findMany({
            take: 20,
            select: {
                id: true,
                title: true,
                status: true,
                cityCorporationCode: true,
                zoneId: true,
                wardId: true,
                complaintCityCorporationCode: true,
                complaintZoneId: true,
                complaintWardId: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        cityCorporationCode: true,
                        zoneId: true,
                        wardId: true
                    }
                }
            }
        });

        console.log(`Total complaints found: ${complaints.length}\n`);

        complaints.forEach((c, index) => {
            console.log(`\n${index + 1}. Complaint #${c.id}: ${c.title}`);
            console.log(`   Status: ${c.status}`);
            console.log(`   User: ${c.user?.firstName} ${c.user?.lastName}`);
            console.log(`   User Location: City=${c.user?.cityCorporationCode}, Zone=${c.user?.zoneId}, Ward=${c.user?.wardId}`);
            console.log(`   Complaint Location (OLD): City=${c.cityCorporationCode}, Zone=${c.zoneId}, Ward=${c.wardId}`);
            console.log(`   Complaint Location (NEW): City=${c.complaintCityCorporationCode}, Zone=${c.complaintZoneId}, Ward=${c.complaintWardId}`);
        });

        // Count by location type
        const withOldLocation = complaints.filter(c => c.cityCorporationCode || c.zoneId || c.wardId).length;
        const withNewLocation = complaints.filter(c => c.complaintCityCorporationCode || c.complaintZoneId || c.complaintWardId).length;

        console.log(`\n📊 Summary:`);
        console.log(`   Complaints with OLD location fields: ${withOldLocation}`);
        console.log(`   Complaints with NEW location fields: ${withNewLocation}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkComplaints();
