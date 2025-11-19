const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';

async function testSignupWithoutVerification() {
    console.log('Testing signup without email verification...\n');

    // Generate random phone number for testing
    const randomPhone = '0163903' + Math.floor(1000 + Math.random() * 9000);

    const signupData = {
        firstName: 'Test',
        lastName: 'User',
        phone: randomPhone,
        email: `test${Date.now()}@example.com`,
        password: 'testpass123',
        ward: '10',
        zone: 'DNCC'
    };

    try {
        console.log('1. Attempting signup with data:', signupData);
        const signupResponse = await axios.post(`${API_URL}/register`, signupData);

        console.log('\n✅ Signup Response:', JSON.stringify(signupResponse.data, null, 2));

        if (signupResponse.data.data.requiresVerification === false) {
            console.log('\n✅ SUCCESS: Email verification is DISABLED');
            console.log('User can now login directly without verification\n');

            // Try to login immediately
            console.log('2. Attempting immediate login...');
            const loginResponse = await axios.post(`${API_URL}/login`, {
                phone: signupData.phone,
                password: signupData.password
            });

            console.log('\n✅ Login Response:', JSON.stringify(loginResponse.data, null, 2));
            console.log('\n✅ SUCCESS: User can login immediately after signup!');

        } else {
            console.log('\n⚠️ WARNING: Email verification is still ENABLED');
            console.log('Please restart the server to load new .env settings');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
    }
}

testSignupWithoutVerification();
