const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        const admin = await prisma.user.findUnique({
            where: { phone: '01700000000' }
        });

        if (admin) {
            console.log('✅ Admin found:');
            console.log('   Email:', admin.email || 'NOT SET');
            console.log('   Phone:', admin.phone);
            console.log('   Name:', admin.firstName, admin.lastName);
            console.log('   Role:', admin.role);
            console.log('   Status:', admin.status);
            console.log('\n📝 Login credentials:');
            if (admin.email) {
                console.log('   Email:', admin.email);
            } else {
                console.log('   Phone:', admin.phone);
            }
            console.log('   Password: Admin@123');
        } else {
            console.log('❌ Admin not found');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
