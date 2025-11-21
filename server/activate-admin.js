const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAdmin() {
    try {
        console.log('🔍 Checking admin user...');

        // First check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { phone: '01700000000' }
        });

        if (!existingAdmin) {
            console.log('❌ Admin user not found. Creating new admin...');

            // Create new admin user
            const newAdmin = await prisma.user.create({
                data: {
                    firstName: 'Super',
                    lastName: 'Admin',
                    phone: '01700000000',
                    email: 'admin@cleancare.gov.bd',
                    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // Admin@123
                    role: 'SUPER_ADMIN',
                    status: 'ACTIVE',
                    address: 'Admin Office',
                    ward: '1',
                    cityCorporationCode: 'DSCC'
                }
            });

            console.log('✅ New admin created:', newAdmin.firstName, newAdmin.lastName);
            console.log('   Phone:', newAdmin.phone);
            console.log('   Role:', newAdmin.role);
            console.log('   Status:', newAdmin.status);
        } else {
            console.log('✅ Admin user found:', existingAdmin.firstName, existingAdmin.lastName);
            console.log('   Current status:', existingAdmin.status);

            if (existingAdmin.status !== 'ACTIVE') {
                // Activate the admin
                const updatedAdmin = await prisma.user.update({
                    where: { phone: '01700000000' },
                    data: {
                        status: 'ACTIVE',
                        role: 'SUPER_ADMIN' // Ensure role is correct
                    }
                });

                console.log('✅ Admin activated successfully!');
                console.log('   New status:', updatedAdmin.status);
                console.log('   Role:', updatedAdmin.role);
            } else {
                console.log('✅ Admin is already active');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

activateAdmin();
