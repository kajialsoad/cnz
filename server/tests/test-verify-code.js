const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE_URL = 'http://localhost:4000/api';
const prisma = new PrismaClient();

const TEST_EMAIL = 'alsoadmunna12@gmail.com';
const TEST_PASSWORD = 'TestPassword123!';

async function verifyWithCode(code) {
    try {
        console.log('🔐 Verifying email with code:', code);

        const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email-code`, {
            email: TEST_EMAIL,
            code: code
        });

        console.log('✅ Email verified successfully!');
        console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

        // Step 2: Try to login now
        console.log('\n🔑 Attempting login with verified account...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });

        console.log('✅ Login successful!');
        console.log('Access Token:', loginResponse.data.accessToken.substring(0, 30) + '...');
        console.log('Refresh Token:', loginResponse.data.refreshToken.substring(0, 30) + '...');

        console.log('\n✨ Complete verification flow successful!\n');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Get code from command line argument
const code = process.argv[2];
if (!code) {
    console.log('Usage: node test-verify-code.js <6-digit-code>');
    console.log('Example: node test-verify-code.js 123456');
    process.exit(1);
}

verifyWithCode(code);
