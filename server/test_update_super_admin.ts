
import prisma from './src/utils/prisma';
import { adminUserService } from './src/services/admin.user.service';
import { multiZoneService } from './src/services/multi-zone.service';
import { users_role, UserStatus } from '@prisma/client';

async function main() {
    console.log('🔄 Starting Super Admin Update Test...');

    // 1. Find a Super Admin user (e.g., from Zone 5)
    const email = 'zone5_officer@generated.com';
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        console.error(`❌ User with email ${email} not found!`);
        return;
    }

    console.log(`✅ Found user: ${existingUser.firstName} ${existingUser.lastName} (ID: ${existingUser.id})`);

    // 2. Test Single Zone Assignment (Validation Check)
    console.log('🧪 Testing Single Zone Assignment Logic...');
    try {
        // Try to assign just Zone 5
        // We need existingUser.id, zoneIds=[5], updatedBy=existingUser.id (mock)
        const targetZoneId = existingUser.zoneId || 5;

        await multiZoneService.updateZoneAssignments(
            existingUser.id,
            [targetZoneId],
            existingUser.id
        );

        console.log('✅ Validation Passed: Successfully assigned single zone to Super Admin!');

    } catch (error: any) {
        console.error('❌ Validation Failed!');
        console.error('Error Message:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
