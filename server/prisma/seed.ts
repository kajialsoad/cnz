import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Hash password for demo users
    const hashedPassword = await bcrypt.hash('Demo123!@#', 10);

    // Create demo customers
    const customer1 = await prisma.user.upsert({
        where: { phone: '01712345678' },
        update: {},
        create: {
            phone: '01712345678',
            email: 'customer1@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Rahim',
            lastName: 'Ahmed',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    const customer2 = await prisma.user.upsert({
        where: { phone: '01812345678' },
        update: {},
        create: {
            phone: '01812345678',
            email: 'customer2@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Karim',
            lastName: 'Hossain',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            phoneVerified: true,
            emailVerified: true,
        },
    });

    // Create demo service provider
    const serviceProvider = await prisma.user.upsert({
        where: { phone: '01912345678' },
        update: {},
        create: {
            phone: '01912345678',
            email: 'provider@demo.com',
            passwordHash: hashedPassword,
            firstName: 'Jamal',
            lastName: 'Khan',
            role: UserRole.SERVICE_PROVIDER,
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
    console.log('\n👤 Customer 1:');
    console.log(`   Phone: ${customer1.phone}`);
    console.log(`   Email: ${customer1.email}`);
    console.log(`   Name: ${customer1.firstName} ${customer1.lastName}`);
    console.log('\n👤 Customer 2:');
    console.log(`   Phone: ${customer2.phone}`);
    console.log(`   Email: ${customer2.email}`);
    console.log(`   Name: ${customer2.firstName} ${customer2.lastName}`);
    console.log('\n🔧 Service Provider:');
    console.log(`   Phone: ${serviceProvider.phone}`);
    console.log(`   Email: ${serviceProvider.email}`);
    console.log(`   Name: ${serviceProvider.firstName} ${serviceProvider.lastName}`);
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

    // Create some demo complaints
    await prisma.complaint.createMany({
        data: [
            {
                title: 'Garbage not collected',
                description: 'Garbage has not been collected for 3 days in our area.',
                location: 'Dhanmondi, Dhaka',
                userId: customer1.id,
                priority: 2,
            },
            {
                title: 'Street cleaning needed',
                description: 'The street is very dirty and needs immediate cleaning.',
                location: 'Gulshan, Dhaka',
                userId: customer2.id,
                priority: 1,
            },
        ],
    });

    console.log('✅ Demo complaints created!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
