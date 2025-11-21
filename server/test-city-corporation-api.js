const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testCityCorporationAPI() {
    console.log('🧪 Testing City Corporation API Endpoints...\n');

    try {
        // Test 1: Get active city corporations (public endpoint)
        console.log('1️⃣ Testing GET /api/city-corporations/active');
        const activeCCResponse = await axios.get(`${BASE_URL}/city-corporations/active`);
        console.log('✅ Success:', activeCCResponse.data);
        console.log(`   Found ${activeCCResponse.data.data.length} active city corporations\n`);

        // Test 2: Get thanas for DSCC (public endpoint)
        console.log('2️⃣ Testing GET /api/city-corporations/DSCC/thanas');
        const dsccThanasResponse = await axios.get(`${BASE_URL}/city-corporations/DSCC/thanas`);
        console.log('✅ Success:', dsccThanasResponse.data);
        console.log(`   Found ${dsccThanasResponse.data.data.length} thanas for DSCC\n`);

        // Test 3: Get thanas for DNCC (public endpoint)
        console.log('3️⃣ Testing GET /api/city-corporations/DNCC/thanas');
        const dnccThanasResponse = await axios.get(`${BASE_URL}/city-corporations/DNCC/thanas`);
        console.log('✅ Success:', dnccThanasResponse.data);
        console.log(`   Found ${dnccThanasResponse.data.data.length} thanas for DNCC\n`);

        console.log('✅ All public endpoint tests passed!');
        console.log('\n📝 Note: Admin endpoints require authentication and SUPER_ADMIN role');
        console.log('   - GET /api/admin/city-corporations');
        console.log('   - GET /api/admin/city-corporations/:code');
        console.log('   - POST /api/admin/city-corporations');
        console.log('   - PUT /api/admin/city-corporations/:code');
        console.log('   - GET /api/admin/city-corporations/:code/statistics');
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testCityCorporationAPI();
