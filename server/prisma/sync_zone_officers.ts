import { PrismaClient, users_role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Starting Zone Officer to Super Admin Sync...');

    // Fetch all zones with officer details
    const zones = await prisma.zone.findMany({
        where: {
            status: 'ACTIVE',
        },
    });

    console.log(`📊 Found ${zones.length} active zones.`);

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    for (const zone of zones) {
        if (!zone.officerPhone || !zone.officerName) {
            console.log(`⚠️  Skipping Zone ${zone.zoneNumber}: Missing officer name or phone.`);
            continue;
        }

        const phone = zone.officerPhone.trim();
        const name = zone.officerName.trim();

        // Split name for first/last
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Officer'; // Default last name if single name

        console.log(`Processing Zone ${zone.zoneNumber}: ${name} (${phone})`);

        try {
            // Check if user exists by phone
            const existingUser = await prisma.user.findUnique({
                where: { phone: phone },
            });

            if (existingUser) {
                console.log(`   User exists (ID: ${existingUser.id}). Updating to SUPER_ADMIN...`);
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        role: users_role.SUPER_ADMIN,
                        zoneId: zone.id,
                        // Optionally update name if you want to force sync, but usually safer to keep user's existing profile if they already exist
                        // name is split into firstName/lastName, so we might skip overwriting unless desired. 
                        // For this task, ensuring they are SUPER_ADMIN and linked to Zone is key.
                    },
                });
            } else {
                console.log(`   Creating new SUPER_ADMIN user...`);
                const email = `zone${zone.zoneNumber}_officer@generated.com`.toLowerCase(); // Generate a placeholder email

                await prisma.user.create({
                    data: {
                        phone: phone,
                        email: email, // Email must be unique, so using a generated one
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
            }
            console.log(`   ✅ Success for Zone ${zone.zoneNumber}`);

        } catch (error) {
            console.error(`   ❌ Failed for Zone ${zone.zoneNumber}:`, error);
        }
    }

    console.log('\n🏁 Sync completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
