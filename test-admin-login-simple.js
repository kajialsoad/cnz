/**
 * Simple Admin Login Test
 * Tests if the admin login API is working properly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login API...\n');

    try {
        // Test 1: Login
        console.log('📝 Test 1: Admin Login');
        console.log('Endpoint: POST /api/admin/auth/login');
        console.log('Credentials: superadmin@demo.com / Demo123!@#\n');

        const loginResponse = await axios.post(
            `${BASE_URL}/api/admin/auth/login`,
            {
                email: 'superadmin@demo.com',
                password: 'Demo123!@#',
                rememberMe: false
            },
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Login Successful!');
        console.log('Status:', loginResponse.status);
        console.log('Access Token:', loginResponse.data.accessToken ? '✓ Present' : '✗ Missing');
        console.log('Token Length:', loginResponse.data.accessToken?.length || 0);
        console.log('Expires In:', loginResponse.data.accessExpiresIn);
        console.log('Refresh Token:', loginResponse.data.refreshToken ? '✓ Present' : '✗ Missing');
        console.log('');

        const accessToken = loginResponse.data.accessToken;
        const cookies = loginResponse.headers['set-cookie'];

        // Test 2: Get Profile
        console.log('📝 Test 2: Get Admin Profile');
        console.log('Endpoint: GET /api/admin/auth/profile');
        console.log('Authorization: Bearer token\n');

        const profileResponse = await axios.get(
            `${BASE_URL}/api/admin/auth/profile`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Cookie': cookies ? cookies.join('; ') : ''
                },
                withCredentials: true
            }
        );

        console.log('✅ Profile Fetched Successfully!');
        console.log('Status:', profileResponse.status);

        const user = profileResponse.data.user || profileResponse.data.data;
        if (user) {
            console.log('\n👤 User Details:');
            console.log('  ID:', user.id);
            console.log('  Name:', user.name);
            console.log('  Email:', user.email);
            console.log('  Role:', user.role);
            console.log('  Status:', user.status);
            console.log('  City Corporation:', user.cityCorporation?.name || 'N/A');
            console.log('  Thana:', user.thana?.name || 'N/A');
        } else {
            console.log('⚠️  User data not found in response');
            console.log('Response:', JSON.stringify(profileResponse.data, null, 2));
        }

        console.log('\n✅ All Tests Passed!');
        console.log('\n📋 Summary:');
        console.log('  ✓ Login API working');
        console.log('  ✓ Token generation working');
        console.log('  ✓ Profile API working');
        console.log('  ✓ Authentication flow complete');
        console.log('\n💡 Frontend should be able to login successfully.');

    } catch (error) {
        console.error('\n❌ Test Failed!');

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);

            if (error.response.status === 401) {
                console.error('\n💡 Possible Issues:');
                console.error('  - Wrong credentials');
                console.error('  - Admin account not active');
                console.error('  - Password mismatch');
            } else if (error.response.status === 500) {
                console.error('\n💡 Possible Issues:');
                console.error('  - Database connection error');
                console.error('  - Server configuration error');
            }
        } else if (error.request) {
            console.error('No response received from server');
            console.error('\n💡 Possible Issues:');
            console.error('  - Server not running (run: cd server && npm run dev)');
            console.error('  - Wrong BASE_URL:', BASE_URL);
            console.error('  - Network/firewall issue');
        } else {
            console.error('Error:', error.message);
        }

        process.exit(1);
    }
}

// Run the test
console.log('🚀 Starting Admin Login Test...');
console.log('Base URL:', BASE_URL);
console.log('─────────────────────────────────────\n');

testAdminLogin();
