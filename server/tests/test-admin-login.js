const axios = require('axios');

async function testAdminLogin() {
    try {
        console.log('Testing admin login...');

        const response = await axios.post('http://localhost:4000/api/admin/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo123!@#'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        // Now test getting profile
        console.log('\nTesting profile endpoint...');
        const profileResponse = await axios.get('http://localhost:4000/api/admin/auth/me', {
            headers: {
                'Authorization': `Bearer ${response.data.accessToken}`
            }
        });

        console.log('✅ Profile fetch successful!');
        console.log('Profile data:', JSON.stringify(profileResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAdminLogin();
