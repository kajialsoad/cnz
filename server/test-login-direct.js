/**
 * Direct Login Test
 * Tests login directly against the database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testLogin() {
    try {
        console.log('🔍 Testing login for: superadmin@demo.com\n');

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@demo.com' }
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('✅ User found:');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Name:', user.firstName, user.lastName);
        console.log('   Role:', user.role);
        console.log('   Status:', user.status);
        console.log('   Email Verified:', user.emailVerified);
        console.log('   Password Hash:', user.passwordHash.substring(0, 20) + '...');

        // Test passwords
        const passwords = ['Demo123@#', 'Demo123!@#', 'demo123'];

        console.log('\n🔐 Testing passwords:');
        for (const password of passwords) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            console.log(`   "${password}": ${isValid ? '✅ MATCH' : '❌ NO MATCH'}`);
        }

        // Show what the hash should be for Demo123@#
        console.log('\n🔧 Creating new hash for "Demo123@#":');
        const newHash = await bcrypt.hash('Demo123@#', 10);
        console.log('   New hash:', newHash.substring(0, 20) + '...');

        const testMatch = await bcrypt.compare('Demo123@#', newHash);
        console.log('   Test match:', testMatch ? '✅ YES' : '❌ NO');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
