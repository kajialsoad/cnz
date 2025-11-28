/**
 * Create Test User Script
 * 
 * This script creates a test user for manual testing purposes.
 * 
 * Usage: node create-test-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createTestUser() {
    console.log('\n' + '='.repeat(60));
    log('Creating Test User for Manual Testing', 'cyan');
    console.log('='.repeat(60) + '\n');

    try {
        // Check if user already exists
        log('Checking if test user already exists...', 'blue');
        const existing = await prisma.user.findUnique({
            where: { email: 'test@example.com' }
        });

        if (existing) {
            log('✓ Test user already exists!', 'green');
            console.log('');
            log('Credentials:', 'cyan');
            console.log('  Email: test@example.com');
            console.log('  Password: Test123!');
            console.log('  Name: ' + existing.firstName + ' ' + existing.lastName);
            console.log('  Role: ' + existing.role);
            console.log('  Email Verified: ' + existing.emailVerified);
            console.log('  Status: ' + existing.status);
            console.log('');

            if (!existing.emailVerified || existing.status !== 'ACTIVE') {
                log('⚠ User needs verification/activation. Updating...', 'yellow');
                await prisma.user.update({
                    where: { email: 'test@example.com' },
                    data: {
                        emailVerified: true,
                        phoneVerified: true,
                        status: 'ACTIVE'
                    }
                });
                log('✓ User verified and activated successfully', 'green');
            }

            await prisma.$disconnect();
            return;
        }

        // Create new test user
        log('Creating new test user...', 'blue');
        const hashedPassword = await bcrypt.hash('Test123!', 10);

        const user = await prisma.user.create({
            data: {
                email: 'test@example.com',
                passwordHash: hashedPassword,
                firstName: 'Test',
                lastName: 'User',
                phone: '1234567890',
                emailVerified: true,
                phoneVerified: true,
                status: 'ACTIVE',
                role: 'CUSTOMER'
            }
        });

        log('✓ Test user created successfully!', 'green');
        console.log('');
        log('Credentials:', 'cyan');
        console.log('  Email: test@example.com');
        console.log('  Password: Test123!');
        console.log('  User ID: ' + user.id);
        console.log('  Name: ' + user.firstName + ' ' + user.lastName);
        console.log('  Role: ' + user.role);
        console.log('  Status: ' + user.status);
        console.log('');
        log('You can now run the manual test helper:', 'blue');
        console.log('  node tests/manual-test-helper.js test-upload');
        console.log('');

        await prisma.$disconnect();

    } catch (error) {
        log('✗ Error creating test user', 'red');
        console.error(error);

        if (error.code === 'P1001') {
            console.log('');
            log('⚠ Cannot connect to database', 'yellow');
            log('Make sure your database is running and .env is configured', 'blue');
        }

        await prisma.$disconnect();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createTestUser();
}

module.exports = { createTestUser };
