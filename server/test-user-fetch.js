const axios = require('axios');

async function testUserFetch() {
    try {
        console.log('🧪 Testing user fetch API...\n');

        // First, login to get token
        console.log('1️⃣ Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
            email: 'admin@cleancare.com',
            password: 'Admin@123'
        });

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Login successful, token received\n');

        // Test fetching users
        console.log('2️⃣ Fetching users...');
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                page: 1,
                limit: 20
            }
        });

        console.log('✅ Users fetched successfully!');
        console.log('Response structure:', {
            success: usersResponse.data.success,
            hasData: !!usersResponse.data.data,
            hasUsers: !!usersResponse.data.data?.users,
            hasPagination: !!usersResponse.data.data?.pagination,
            userCount: usersResponse.data.data?.users?.length || 0,
            pagination: usersResponse.data.data?.pagination
        });

        if (usersResponse.data.data?.users?.length > 0) {
            console.log('\n📋 First user sample:');
            const firstUser = usersResponse.data.data.users[0];
            console.log({
                id: firstUser.id,
                name: `${firstUser.firstName} ${firstUser.lastName}`,
                email: firstUser.email,
                phone: firstUser.phone,
                ward: firstUser.ward,
                cityCorporation: firstUser.cityCorporation?.name,
                statistics: firstUser.statistics
            });
        }

        console.log('\n✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testUserFetch();
