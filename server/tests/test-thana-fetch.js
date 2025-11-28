const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testThanaFetch() {
    try {
        console.log('🔍 Testing Thana API...\n');

        // First, login as admin
        console.log('1. Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
            email: 'admin@cleancare.com',
            password: 'Admin@123'
        });

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful\n');

        // Test fetching thanas for DSCC
        console.log('2. Fetching thanas for DSCC...');
        const dsccResponse = await axios.get(`${BASE_URL}/api/admin/thanas`, {
            params: {
                cityCorporationCode: 'DSCC',
                status: 'ACTIVE'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('DSCC Response:', JSON.stringify(dsccResponse.data, null, 2));
        console.log(`✅ Found ${dsccResponse.data.data?.thanas?.length || 0} thanas for DSCC\n`);

        // Test fetching thanas for DNCC
        console.log('3. Fetching thanas for DNCC...');
        const dnccResponse = await axios.get(`${BASE_URL}/api/admin/thanas`, {
            params: {
                cityCorporationCode: 'DNCC',
                status: 'ACTIVE'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('DNCC Response:', JSON.stringify(dnccResponse.data, null, 2));
        console.log(`✅ Found ${dnccResponse.data.data?.thanas?.length || 0} thanas for DNCC\n`);

        // Test without status filter
        console.log('4. Fetching all thanas for DSCC (no status filter)...');
        const allDsccResponse = await axios.get(`${BASE_URL}/api/admin/thanas`, {
            params: {
                cityCorporationCode: 'DSCC'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('All DSCC Response:', JSON.stringify(allDsccResponse.data, null, 2));
        console.log(`✅ Found ${allDsccResponse.data.data?.thanas?.length || 0} thanas for DSCC (all statuses)\n`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testThanaFetch();
