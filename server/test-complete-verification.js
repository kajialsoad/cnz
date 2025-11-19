const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcrypt');

const API_BASE_URL = 'http://localhost:4000/api';
const prisma = new PrismaClient();

// Test email (Gmail)
const TEST_EMAIL = 'alsoadmunna12@gmail.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PHONE = `01700${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
    try {
        console.log('🚀 Starting Complete Email Verification Flow Test\n');
        console.log('Test Email:', TEST_EMAIL);
        console.log('Test Phone:', TEST_PHONE);
        console.log('-------------------------------------------\n');

        // Step 1: Register user
        console.log('📝 Step 1: Registering user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'User',
            email: TEST_EMAIL,
            phone: TEST_PHONE,
            password: TEST_PASSWORD,
            ward: 'Ward 1',
            zone: 'DSCC'
        });

        console.log('✅ Registration successful');
        console.log('   Email:', registerResponse.data.data.email);
        console.log('   Requires Verification:', registerResponse.data.data.requiresVerification);

        // Step 2: Get user from database
        console.log('\n📊 Step 2: Checking database...');
        await sleep(1000); // Wait for database to sync

        const user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL }
        });

        if (!user) {
            throw new Error('User not found in database');
        }

        console.log('✅ User found in database');
        console.log('   User ID:', user.id);
        console.log('   Status:', user.status);
        console.log('   Email Verified:', user.emailVerified);
        console.log('   Has Verification Code:', !!user.verificationCode);
        console.log('   Code Expiry:', user.verificationCodeExpiry);

        // Step 3: Try to login before verification (should fail)
        console.log('\n🔑 Step 3: Testing login before verification...');
        try {
            await axios.post(`${API_BASE_URL}/auth/login`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            console.log('❌ ERROR: Login succeeded (should have failed)');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Login correctly rejected');
                console.log('   Error:', error.response.data.message);
            } else {
                throw error;
            }
        }

        // Step 4: Test resend verification code
        console.log('\n📧 Step 4: Testing resend verification code...');
        const resendResponse = await axios.post(`${API_BASE_URL}/auth/resend-verification-code`, {
            email: TEST_EMAIL
        });

        console.log('✅ Resend successful');
        console.log('   Message:', resendResponse.data.message);

        // Step 5: Get updated user with new code
        console.log('\n📊 Step 5: Checking updated verification code...');
        const updatedUser = await prisma.user.findUnique({
            where: { email: TEST_EMAIL }
        });

        console.log('✅ User updated');
        console.log('   New Code Expiry:', updatedUser.verificationCodeExpiry);

        // Step 6: Test with invalid code
        console.log('\n❌ Step 6: Testing with invalid code...');
        try {
            await axios.post(`${API_BASE_URL}/auth/verify-email-code`, {
                email: TEST_EMAIL,
                code: '000000'
            });
            console.log('❌ ERROR: Verification succeeded with invalid code');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Invalid code correctly rejected');
                console.log('   Error:', error.response.data.message);
            } else {
                throw error;
            }
        }

        // Step 7: Test with expired code
        console.log('\n⏰ Step 7: Testing with expired code...');
        // Set expiry to past
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationCodeExpiry: new Date(Date.now() - 1000) // 1 second ago
            }
        });

        try {
            await axios.post(`${API_BASE_URL}/auth/verify-email-code`, {
                email: TEST_EMAIL,
                code: '123456'
            });
            console.log('❌ ERROR: Verification succeeded with expired code');
            process.exit(1);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Expired code correctly rejected');
                console.log('   Error:', error.response.data.message);
            } else {
                throw error;
            }
        }

        // Step 8: Resend code again
        console.log('\n📧 Step 8: Resending verification code...');
        const resendResponse2 = await axios.post(`${API_BASE_URL}/auth/resend-verification-code`, {
            email: TEST_EMAIL
        });
        console.log('✅ Code resent');

        // Step 9: Get the actual verification code from database
        console.log('\n🔍 Step 9: Extracting verification code from database...');
        const userWithCode = await prisma.user.findUnique({
            where: { email: TEST_EMAIL }
        });

        // We can't directly get the code since it's hashed, but we can test the flow
        console.log('✅ Code is stored (hashed)');
        console.log('   Expiry:', userWithCode.verificationCodeExpiry);

        console.log('\n📌 IMPORTANT: To complete the test:');
        console.log('   1. Check your Gmail inbox at:', TEST_EMAIL);
        console.log('   2. Look for email from: noreply@cleancare.bd');
        console.log('   3. Copy the 6-digit verification code');
        console.log('   4. Run: node test-verify-code.js <code>');
        console.log('\n   Or manually test the endpoint:');
        console.log('   POST /api/auth/verify-email-code');
        console.log('   Body: { "email": "' + TEST_EMAIL + '", "code": "XXXXXX" }');

        console.log('\n✨ Test setup complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run test
testCompleteFlow();
