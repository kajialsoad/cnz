import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('Demo123!@#', 10);

    // Create demo master admin
    const masterAdmin = await prisma.user.upsert({
        where: { phone: '01712345678' },
        update: {},
        create: {
            phone: '01712345678',
            email: 'masteradmin@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Master',
            lastName: 'Admin',
            role: UserRole.MASTER_ADMIN,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    // Create demo admin
    const admin = await prisma.user.upsert({
        where: { phone: '01612345678' },
        update: {},
        create: {
            phone: '01612345678',
            email: 'admin@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    // Create demo super admin
    const superAdmin = await prisma.user.upsert({
        where: { phone: '01512345678' },
        update: {},
        create: {
            phone: '01512345678',
            email: 'superadmin@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: UserRole.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    console.log('✅ Demo users created successfully!');
    console.log('\n📋 Demo User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('All users have the same password: Demo123!@#');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n👑 Master Admin:');
    console.log(`   Phone: ${masterAdmin.phone}`);
    console.log(`   Email: ${masterAdmin.email}`);
    console.log(`   Name: ${masterAdmin.firstName} ${masterAdmin.lastName}`);
    console.log('\n👨‍💼 Admin:');
    console.log(`   Phone: ${admin.phone}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log('\n👑 Super Admin:');
    console.log(`   Phone: ${superAdmin.phone}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 You can login with phone or email + password: Demo123!@#');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Admin users created!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
