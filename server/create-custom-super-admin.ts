import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { hashPassword } from './src/utils/hash';

const prisma = new PrismaClient();

async function main() {
    console.log('👑 Creating Super Admin user...');

    const phone = '01999999999';
    const email = 'superadmin@cleancare.com';
    const password = 'Admin123!@#';

    const hashedPassword = await hashPassword(password);

    const superAdmin = await prisma.user.upsert({
        where: { phone },
        update: {},
        create: {
            phone,
            email,
            passwordHash: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Phone:    ${superAdmin.phone}`);
    console.log(`Email:    ${superAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Error creating super admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
