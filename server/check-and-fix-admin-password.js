/**
 * Check and Fix Admin Password
 * This script checks if the admin user exists and resets the password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndFixAdminPassword() {
    try {
        console.log('🔍 Checking admin users...\n');

        // Check for superadmin@demo.com
        const superAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@demo.com' }
        });

        if (superAdmin) {
            console.log('✅ Found MASTER_ADMIN user:');
            console.log('   Email:', superAdmin.email);
            console.log('   Name:', superAdmin.firstName, superAdmin.lastName);
            console.log('   Role:', superAdmin.role);
            console.log('   Status:', superAdmin.status);
            console.log('   Email Verified:', superAdmin.emailVerified);

            // Reset password to Demo123@#
            const newPassword = 'Demo123@#';
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id: superAdmin.id },
                data: {
                    passwordHash: hashedPassword,
                    status: 'ACTIVE',
                    emailVerified: true
                }
            });

            console.log('\n✅ Password reset successfully!');
            console.log('   New Password:', newPassword);
            console.log('   Status set to: ACTIVE');
            console.log('   Email verified: true');
        } else {
            console.log('❌ No user found with email: superadmin@demo.com');
            console.log('\n📝 Creating MASTER_ADMIN user...');

            const hashedPassword = await bcrypt.hash('Demo123@#', 10);

            const newAdmin = await prisma.user.create({
                data: {
                    email: 'superadmin@demo.com',
                    phone: '+8801700000001',
                    firstName: 'Master',
                    lastName: 'Admin',
                    passwordHash: hashedPassword,
                    role: 'MASTER_ADMIN',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: true
                }
            });

            console.log('✅ MASTER_ADMIN created successfully!');
            console.log('   Email: superadmin@demo.com');
            console.log('   Password: Demo123@#');
            console.log('   Role:', newAdmin.role);
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 Login Credentials:');
        console.log('='.repeat(60));
        console.log('Email: superadmin@demo.com');
        console.log('Password: Demo123@#');
        console.log('='.repeat(60));
        console.log('\n✅ You can now login at: http://localhost:5173/admin/login');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixAdminPassword();
