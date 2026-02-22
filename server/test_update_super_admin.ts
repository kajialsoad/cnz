
import prisma from './src/utils/prisma';
import { multiZoneService } from './src/services/multi-zone.service';

async function main() {
    console.log('🔄 Starting Super Admin Update Test...');

    // 1. Find a user to test with (e.g. ID 295 from the error log, or fallback to email)
    // The error log showed ID 295 was being used.
    const userId = 295;
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!existingUser) {
        console.error(`❌ User with ID ${userId} not found!`);
        return;
    }

    console.log(`✅ Found user: ${existingUser.firstName} ${existingUser.lastName} (ID: ${existingUser.id})`);

    // 2. Test Single Zone Assignment (Validation Check)
    console.log('🧪 Testing Single Zone Assignment Logic...');
    try {
        // Try to assign just Zone 33 (from error log)
        // We need existingUser.id, zoneIds=[33], updatedBy=existingUser.id (mock)
        const targetZoneId = 33; 

        await multiZoneService.updateZoneAssignments(
            existingUser.id,
            [targetZoneId],
            existingUser.id
        );

        console.log('✅ Validation Passed: Successfully assigned single zone to Super Admin!');

    } catch (error: any) {
        console.error('❌ Validation Failed!');
        console.error('Error Message:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
