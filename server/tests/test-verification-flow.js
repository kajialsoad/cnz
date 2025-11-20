const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcrypt');

const API_BASE_URL = 'http://localhost:4000/api';
const prisma = new PrismaClient();

// Test email (Gmail)
const TEST_EMAIL = 'alsoadmunna12@gmail.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PHONE = '01700000002';

async function testVerificationFlow() {
    try {
        console.log('🚀 Starting Complete Email Verification Flow Test\n');

        // Step 1: Register user
        console.log('📝 Step 1: Registering user with Gmail...');
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
            firstName: 'Test',
            lastName: 'User',
            email: TEST_EMAIL,
            phone: TEST_PHONE,
            password: TEST_PASSWORD,
            ward: 'Ward 1',
            zone: 'Zone A'
        });

        console.log('✅ Registration successful');
        console.log('Email:', registerResponse.data.data.email);
        console.log('Requires Verification:', registerResponse.data.data.requiresVerification);
        console.log('Expiry Time:', registerResponse.data.data.expiryTime);

        // Step 2: Get verification code from database
        console.log('\n🔍 Step 2: Retrieving verification code from database...');
        const user = await prisma.user.findUnique({
            where: { email: TEST_EMAIL }
        });

        if (!user) {
            throw new Error('User not found in database');
        }

        console.log('✅ User found in database');
        console.log('User ID:', user.id);
        console.log('Email Verified:', user.emailVerified);
        console.log('Status:', user.status);
        console.log('Verification Code Expiry:', user.verificationCodeExpiry);

        // Step 3: Find the actual verification code
        // Since the code is hashed, we need to test with common codes or check the email
        console.log('\n📧 Step 3: Checking email service...');
        console.log('⚠️  Verification code has been sent to:', TEST_EMAIL);
        console.log('📌 Check your Gmail inbox for the verification code');
        console.log('⏱️  Code expires in 15 minutes');

        // For automated testing, we'll simulate the code verification
        // In real scenario, user would get code from email
        console.log('\n💡 To complete the test:');
        console.log('1. Check your Gmail inbox at:', TEST_EMAIL);
        console.log('2. Look for email from: noreply@cleancare.bd');
        console.log('3. Copy the 6-digit verification code');
        console.log('4. Run: node test-verify-code.js <code>');

        // Step 4: Test with a sample code (this will fail but shows the flow)
        console.log('\n🔐 Step 4: Testing verification endpoint...');
        try {
            const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email-code`, {
                email: TEST_EMAIL,
                code: '000000' // This will fail, but shows the endpoint works
            });
            console.log('Response:', verifyResponse.data);
        } catch (error) {
            console.log('Expected error (invalid code):', error.response?.data?.message);
        }

        // Step 5: Try to login before verification (should fail)
        console.log('\n🔑 Step 5: Testing login before verification...');
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });
            console.log('❌ Login succeeded (should have failed)');
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data?.message);
        }

        console.log('\n✨ Test setup complete! Waiting for manual verification...\n');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run test
testVerificationFlow();
