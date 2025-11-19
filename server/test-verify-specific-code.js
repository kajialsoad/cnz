const axios = require('axios');

const API_URL = 'http://localhost:4000/api/auth';

async function testVerifyCode() {
    const email = 'alsoadmunna12@gmail.com';
    const code = '825591';

    console.log('Testing verification with:');
    console.log('Email:', email);
    console.log('Code:', code);
    console.log('');

    try {
        const response = await axios.post(`${API_URL}/verify-email-code`, {
            email: email,
            code: code
        });

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ FAILED!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testVerifyCode();
