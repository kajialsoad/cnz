import { PrismaClient, users_role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Zones 5, 7, and 9...');

    const targetZones = [5, 7, 9];
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    for (const zoneNum of targetZones) {
        // Find zone by zoneNumber
        const zone = await prisma.zone.findFirst({
            where: { zoneNumber: zoneNum }
            // Removing status check to see if they exist at all, handled in logic
        });

        if (!zone) {
            console.log(`❌ Zone ${zoneNum} NOT FOUND in database.`);
            continue;
        }

        console.log(`\n📂 Processing Zone ${zoneNum} (ID: ${zone.id})`);
        console.log(`   Status: ${zone.status}`);
        console.log(`   Officer Name: "${zone.officerName}"`);
        console.log(`   Officer Phone: "${zone.officerPhone}"`);

        if (!zone.officerPhone || !zone.officerName) {
            console.log(`⚠️  SKIPPING: Phone or Name is missing/empty.`);
            continue;
        }

        const phone = zone.officerPhone.trim();
        const name = zone.officerName.trim();

        if (!phone) {
            console.log(`⚠️  SKIPPING: Phone is empty string.`);
            continue;
        }

        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Officer';

        try {
            const existingUser = await prisma.user.findUnique({
                where: { phone: phone },
            });

            if (existingUser) {
                console.log(`   User exists (ID: ${existingUser.id}, Role: ${existingUser.role}). Updating to SUPER_ADMIN...`);
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: users_role.SUPER_ADMIN,
                        zoneId: zone.id,
                    },
                });
                console.log(`   ✅ Updated existing user to SUPER_ADMIN.`);
            } else {
                console.log(`   Creating new SUPER_ADMIN user...`);
                let email = `zone${zone.zoneNumber}_officer@generated.com`.toLowerCase();

                // Simple check to ensure email uniqueness if repeated runs happened with diff phones
                const checkEmail = await prisma.user.findUnique({ where: { email } });
                if (checkEmail) {
                    email = `zone${zone.zoneNumber}_officer_${Date.now()}@generated.com`.toLowerCase();
                }

                await prisma.user.create({
                    data: {
                        phone: phone,
                        email: email,
                        passwordHash: hashedPassword,
                        firstName: firstName,
                        lastName: lastName,
                        role: users_role.SUPER_ADMIN,
                        status: UserStatus.ACTIVE,
                        zoneId: zone.id,
                        phoneVerified: true,
                        emailVerified: true,
                    },
                });
                console.log(`   ✅ Created new user (Phone: ${phone}).`);
            }

        } catch (error) {
            console.error(`   ❌ Error processing Zone ${zoneNum}:`, error);
        }
    }
    console.log('\n🏁 Verification completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
