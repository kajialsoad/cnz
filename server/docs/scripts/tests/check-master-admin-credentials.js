/**
 * Check Master Admin Credentials from Database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMasterAdminCredentials() {
    console.log('🔍 Checking Master Admin credentials from database...\n');

    try {
        // Find Master Admin user
        const masterAdmin = await prisma.user.findFirst({
            where: {
                role: 'MASTER_ADMIN'
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                visiblePassword: true,
                status: true,
                createdAt: true
            }
        });

        if (!masterAdmin) {
            console.log('❌ No Master Admin found in database');
            return;
        }

        console.log('✅ Master Admin found:');
        console.log(`   ID: ${masterAdmin.id}`);
        console.log(`   Name: ${masterAdmin.firstName} ${masterAdmin.lastName}`);
        console.log(`   Email: ${masterAdmin.email}`);
        console.log(`   Role: ${masterAdmin.role}`);
        console.log(`   Status: ${masterAdmin.status}`);
        console.log(`   Visible Password: ${masterAdmin.visiblePassword || 'NOT SET'}`);
        console.log(`   Created: ${masterAdmin.createdAt}`);

        if (!masterAdmin.visiblePassword) {
            console.log('\n⚠️  WARNING: visiblePassword is NULL in database!');
            console.log('   This is why password is not showing in Profile View');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkMasterAdminCredentials();
