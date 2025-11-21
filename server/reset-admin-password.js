const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetAdminPassword() {
    try {
        console.log('🔍 Finding admin user...');

        const admin = await prisma.user.findUnique({
            where: { phone: '01700000000' }
        });

        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }

        console.log('✅ Admin found:', admin.firstName, admin.lastName);
        console.log('   Current role:', admin.role);

        // Hash the password Admin@123
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        // Update admin with correct password and ensure SUPER_ADMIN role
        const updated = await prisma.user.update({
            where: { phone: '01700000000' },
            data: {
                passwordHash: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE'
            }
        });

        console.log('✅ Admin password reset successfully!');
        console.log('   Phone: 01700000000');
        console.log('   Password: Admin@123');
        console.log('   Role:', updated.role);
        console.log('   Status:', updated.status);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdminPassword();
