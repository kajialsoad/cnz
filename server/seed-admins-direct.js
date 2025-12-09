/**
 * Direct Database Seeding for Admin Users
 * Creates admins directly in database without API authentication
 * Usage: node server/seed-admins-direct.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const PASSWORD = '123456';

function namePair(prefix, i, offset = 0) {
    const idx = String(i).padStart(2, '0');
    const phoneNum = 10000000 + offset + i;
    return {
        firstName: prefix.charAt(0).toUpperCase() + prefix.slice(1),
        lastName: idx,
        email: `${prefix}${idx}@cc.app`,
        phone: `017${String(phoneNum).padStart(8, '0')}`,
    };
}

function genUsers() {
    const masters = Array.from({ length: 4 }, (_, i) => ({
        ...namePair('master', i + 1, 0),
        role: 'MASTER_ADMIN'
    }));
    const supers = Array.from({ length: 10 }, (_, i) => ({
        ...namePair('super', i + 1, 100),
        role: 'SUPER_ADMIN'
    }));
    const admins = Array.from({ length: 20 }, (_, i) => ({
        ...namePair('admin', i + 1, 200),
        role: 'ADMIN'
    }));
    return { masters, supers, admins };
}

async function ensureUser(user) {
    try {
        // Check if user exists by email or phone
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: user.email },
                    { phone: user.phone }
                ]
            }
        });

        if (existing) {
            console.log(`↺ Skipped (exists): ${user.email}`);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(PASSWORD, 10);

        // Create user
        await prisma.user.create({
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                passwordHash: hashedPassword,
                role: user.role,
                status: 'ACTIVE',
                emailVerified: true,
                phoneVerified: true,
            }
        });

        console.log(`✅ Created: ${user.role} → ${user.email} (${user.phone})`);
    } catch (error) {
        console.error(`❌ Failed to create ${user.email}:`, error.message);
    }
}

async function main() {
    console.log('🔧 Direct Database Seeding Started');
    console.log('📦 Password for all users: 123456');

    const { masters, supers, admins } = genUsers();

    console.log('\n👑 Creating Master Admins...');
    for (const u of masters) {
        await ensureUser(u);
    }

    console.log('\n⭐ Creating Super Admins...');
    for (const u of supers) {
        await ensureUser(u);
    }

    console.log('\n👤 Creating Admins...');
    for (const u of admins) {
        await ensureUser(u);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Master Admins: 4 (master01@cc.app - master04@cc.app)');
    console.log('   - Super Admins: 10 (super01@cc.app - super10@cc.app)');
    console.log('   - Admins: 20 (admin01@cc.app - admin20@cc.app)');
    console.log('   - Default Password: 123456');
    console.log('\n🔑 Login with any of these accounts using email and password!');
}

main()
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
