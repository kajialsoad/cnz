const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';

// Test email (Gmail)
const TEST_EMAIL = 'alsoadmunna12@gmail.com';
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PHONE = '01700000001';

async function testVerificationFlow() {
  try {
    console.log('🚀 Starting Email Verification Flow Test\n');

    // Step 1: Register user
    console.log('📝 Step 1: Registering user...');
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
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
    console.log('\n📧 Check your Gmail inbox for verification code\n');

    // Step 2: Wait for user input (verification code)
    console.log('⏳ Waiting for verification code...');
    console.log('Please check your Gmail inbox and enter the 6-digit code below\n');

    // For testing, we'll use a hardcoded delay and then ask for the code
    const verificationCode = await getUserInput('Enter the 6-digit verification code: ');

    // Step 3: Verify email with code
    console.log('\n🔐 Step 2: Verifying email with code...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-email-code`, {
      email: TEST_EMAIL,
      code: verificationCode
    });

    console.log('✅ Email verified successfully');
    console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));

    // Step 4: Login with verified account
    console.log('\n🔑 Step 3: Logging in with verified account...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    console.log('✅ Login successful');
    console.log('Access Token:', loginResponse.data.accessToken.substring(0, 20) + '...');
    console.log('\n✨ Verification flow completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

function getUserInput(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Run test
testVerificationFlow();
