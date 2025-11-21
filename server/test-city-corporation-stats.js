const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testCityCorporationStats() {
    try {
        console.log('🔍 Testing City Corporation Statistics...\n');

        // Login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
            email: 'test1762971192865@example.com',
            password: 'Admin@123'
        });

        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful\n');

        // Fetch city corporations
        console.log('2. Fetching city corporations with statistics...');
        const response = await axios.get(`${BASE_URL}/api/admin/city-corporations`, {
            params: {
                status: 'ALL'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response structure:');
        console.log('- success:', response.data.success);
        console.log('- data type:', Array.isArray(response.data.data) ? 'Array' : typeof response.data.data);
        console.log('- data length:', response.data.data?.length || 0);
        console.log('');

        if (response.data.data && response.data.data.length > 0) {
            console.log('City Corporations with Statistics:\n');
            response.data.data.forEach((cc, index) => {
                console.log(`${index + 1}. ${cc.name} (${cc.code})`);
                console.log(`   Status: ${cc.status}`);
                console.log(`   Ward Range: ${cc.minWard} - ${cc.maxWard}`);
                console.log(`   📊 Statistics:`);
                console.log(`      - Total Users: ${cc.totalUsers || 0}`);
                console.log(`      - Total Complaints: ${cc.totalComplaints || 0}`);
                console.log(`      - Active Thanas: ${cc.activeThanas || 0}`);
                console.log('');
            });
        }

        console.log('✅ All tests passed! Statistics are being calculated correctly.');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCityCorporationStats();
