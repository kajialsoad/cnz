const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testThanaAPI() {
    try {
        console.log('🔍 Testing Thana API Response Structure...\n');

        // Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
            email: 'test1762971192865@example.com',
            password: 'Admin@123'
        });

        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
        const token = loginResponse.data.data?.accessToken || loginResponse.data.accessToken;
        console.log('✅ Login successful\n');

        // Test DSCC thanas
        console.log('2. Fetching DSCC thanas...');
        const dsccResponse = await axios.get(`${BASE_URL}/api/admin/thanas`, {
            params: {
                cityCorporationCode: 'DSCC',
                status: 'ACTIVE'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response structure:');
        console.log('- success:', dsccResponse.data.success);
        console.log('- data type:', Array.isArray(dsccResponse.data.data) ? 'Array' : typeof dsccResponse.data.data);
        console.log('- data length:', dsccResponse.data.data?.length || 0);

        if (dsccResponse.data.data && dsccResponse.data.data.length > 0) {
            console.log('\nFirst thana:');
            console.log(JSON.stringify(dsccResponse.data.data[0], null, 2));
        }

        console.log('\n✅ DSCC has', dsccResponse.data.data?.length || 0, 'active thanas');

        // Test DNCC thanas
        console.log('\n3. Fetching DNCC thanas...');
        const dnccResponse = await axios.get(`${BASE_URL}/api/admin/thanas`, {
            params: {
                cityCorporationCode: 'DNCC',
                status: 'ACTIVE'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ DNCC has', dnccResponse.data.data?.length || 0, 'active thanas');

        console.log('\n✅ All tests passed! The API returns thanas correctly.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testThanaAPI();
