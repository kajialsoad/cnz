const axios = require('axios');

async function testSearch() {
    try {
        console.log('Testing search functionality...\n');

        // Login first
        console.log('1. Logging in...');
        const loginResponse = await axios.post('http://localhost:4000/api/admin/auth/login', {
            email: 'admin@demo.com',
            password: 'Demo123!@#'
        });

        const token = loginResponse.data.accessToken;
        console.log('✅ Login successful\n');

        // Test search with "R"
        console.log('2. Testing search with "R"...');
        const searchR = await axios.get('http://localhost:4000/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { page: 1, limit: 20, search: 'R' }
        });
        console.log('✅ Search "R" successful! Found:', searchR.data.data.complaints.length, 'complaints\n');

        // Test search with "Rah"
        console.log('3. Testing search with "Rah"...');
        const searchRah = await axios.get('http://localhost:4000/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { page: 1, limit: 20, search: 'Rah' }
        });
        console.log('✅ Search "Rah" successful! Found:', searchRah.data.data.complaints.length, 'complaints\n');

        // Test search with "garbage"
        console.log('4. Testing search with "garbage"...');
        const searchGarbage = await axios.get('http://localhost:4000/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { page: 1, limit: 20, search: 'garbage' }
        });
        console.log('✅ Search "garbage" successful! Found:', searchGarbage.data.data.complaints.length, 'complaints\n');

        // Test search with status filter
        console.log('5. Testing search with status filter...');
        const searchWithStatus = await axios.get('http://localhost:4000/api/admin/complaints', {
            headers: { 'Authorization': `Bearer ${token}` },
            params: { page: 1, limit: 20, search: 'R', status: 'PENDING' }
        });
        console.log('✅ Search with status successful! Found:', searchWithStatus.data.data.complaints.length, 'complaints\n');

        console.log('🎉 All search tests passed!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testSearch();
