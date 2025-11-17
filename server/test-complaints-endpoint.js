const axios = require('axios');

async function testComplaintsEndpoint() {
    try {
        console.log('Testing complaints endpoint...\n');

        // First login to get token
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:4000/api/admin/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo123!@#'
        });

        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful\n');

        // Test complaints endpoint
        console.log('2. Fetching complaints...');
        const complaintsResponse = await axios.get('http://localhost:4000/api/admin/complaints', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 20
            }
        });

        console.log('✅ Complaints fetched successfully!');
        console.log('Response:', JSON.stringify(complaintsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Full error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testComplaintsEndpoint();
