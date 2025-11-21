/**
 * Test script for admin user management with city corporation filters
 * Tests Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.1, 13.2, 13.3, 13.4, 13.5
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test configuration
let adminToken = '';
let testUserId = null;

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null, params = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) config.data = data;
        if (params) config.params = params;

        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ Error: ${error.response.data.message || error.message}`);
            return error.response.data;
        }
        throw error;
    }
}

// Test 1: Admin login
async function testAdminLogin() {
    console.log('\n📝 Test 1: Admin Login');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01512345678',
            password: 'Demo123!@#'
        });

        if (response.data.success) {
            adminToken = response.data.data.accessToken;
            console.log('✅ Admin login successful');
            return true;
        } else {
            console.log('❌ Admin login failed');
            return false;
        }
    } catch (error) {
        console.error('❌ Admin login error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test 2: Get users without filters (baseline)
async function testGetUsersWithoutFilters() {
    console.log('\n📝 Test 2: Get Users Without Filters');
    const result = await makeRequest('GET', '/admin/users', null, { page: 1, limit: 10 });

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.users.length} users`);
        console.log(`   Total users: ${result.data.pagination.total}`);

        // Display first user's city corporation info
        if (result.data.users.length > 0) {
            const user = result.data.users[0];
            testUserId = user.id;
            console.log(`   Sample user: ${user.firstName} ${user.lastName}`);
            console.log(`   City Corporation: ${user.cityCorporation?.name || 'N/A'}`);
            console.log(`   Ward: ${user.ward || 'N/A'}`);
            console.log(`   Thana: ${user.thana?.name || 'N/A'}`);
        }
        return true;
    } else {
        console.log('❌ Failed to get users');
        return false;
    }
}

// Test 3: Get users filtered by city corporation (DSCC)
async function testGetUsersByCityCorporation() {
    console.log('\n📝 Test 3: Get Users Filtered by City Corporation (DSCC)');
    const result = await makeRequest('GET', '/admin/users', null, {
        cityCorporationCode: 'DSCC',
        page: 1,
        limit: 10
    });

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.users.length} DSCC users`);
        console.log(`   Total DSCC users: ${result.data.pagination.total}`);

        // Verify all users are from DSCC
        const allDSCC = result.data.users.every(u => u.cityCorporationCode === 'DSCC');
        if (allDSCC) {
            console.log('✅ All users are from DSCC');
        } else {
            console.log('❌ Some users are not from DSCC');
        }
        return allDSCC;
    } else {
        console.log('❌ Failed to filter by city corporation');
        return false;
    }
}

// Test 4: Get users filtered by ward
async function testGetUsersByWard() {
    console.log('\n📝 Test 4: Get Users Filtered by Ward');
    const result = await makeRequest('GET', '/admin/users', null, {
        cityCorporationCode: 'DSCC',
        ward: '10',
        page: 1,
        limit: 10
    });

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.users.length} users from DSCC Ward 10`);
        console.log(`   Total users in Ward 10: ${result.data.pagination.total}`);

        // Verify all users are from Ward 10
        const allWard10 = result.data.users.every(u => u.ward === '10');
        if (allWard10) {
            console.log('✅ All users are from Ward 10');
        } else {
            console.log('❌ Some users are not from Ward 10');
        }
        return allWard10;
    } else {
        console.log('❌ Failed to filter by ward');
        return false;
    }
}

// Test 5: Get users filtered by thana
async function testGetUsersByThana() {
    console.log('\n📝 Test 5: Get Users Filtered by Thana');

    // First, get a thana ID
    const thanasResult = await makeRequest('GET', '/admin/thanas', null, {
        cityCorporationCode: 'DSCC'
    });

    if (!thanasResult.success || !thanasResult.data || !thanasResult.data.thanas || thanasResult.data.thanas.length === 0) {
        console.log('⚠️  No thanas found, skipping test');
        return true;
    }

    const thanaId = thanasResult.data.thanas[0].id;
    const thanaName = thanasResult.data.thanas[0].name;

    const result = await makeRequest('GET', '/admin/users', null, {
        thanaId: thanaId,
        page: 1,
        limit: 10
    });

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.users.length} users from ${thanaName}`);
        console.log(`   Total users in ${thanaName}: ${result.data.pagination.total}`);

        // Verify all users are from the selected thana
        const allFromThana = result.data.users.every(u => u.thanaId === thanaId);
        if (allFromThana) {
            console.log(`✅ All users are from ${thanaName}`);
        } else {
            console.log(`❌ Some users are not from ${thanaName}`);
        }
        return allFromThana;
    } else {
        console.log('❌ Failed to filter by thana');
        return false;
    }
}

// Test 6: Get user by ID with city corporation data
async function testGetUserById() {
    console.log('\n📝 Test 6: Get User By ID with City Corporation Data');

    if (!testUserId) {
        console.log('⚠️  No test user ID available, skipping test');
        return true;
    }

    const result = await makeRequest('GET', `/admin/users/${testUserId}`);

    if (result.success) {
        const user = result.data.user;
        console.log(`✅ Retrieved user: ${user.firstName} ${user.lastName}`);
        console.log(`   City Corporation: ${user.cityCorporation?.name || 'N/A'}`);
        console.log(`   Ward: ${user.ward || 'N/A'}`);
        console.log(`   Thana: ${user.thana?.name || 'N/A'}`);

        // Verify city corporation data is included
        const hasCityCorpData = user.cityCorporation !== undefined;
        const hasThanaData = user.thana !== undefined;

        if (hasCityCorpData && hasThanaData) {
            console.log('✅ City corporation and thana data included');
        } else {
            console.log('❌ Missing city corporation or thana data');
        }
        return hasCityCorpData && hasThanaData;
    } else {
        console.log('❌ Failed to get user by ID');
        return false;
    }
}

// Test 7: Get user statistics without filter
async function testGetUserStatisticsWithoutFilter() {
    console.log('\n📝 Test 7: Get User Statistics Without Filter');
    const result = await makeRequest('GET', '/admin/users/statistics');

    if (result.success) {
        const stats = result.data;
        console.log('✅ Retrieved overall statistics:');
        console.log(`   Total Citizens: ${stats.totalCitizens}`);
        console.log(`   Total Complaints: ${stats.totalComplaints}`);
        console.log(`   Resolved Complaints: ${stats.resolvedComplaints}`);
        console.log(`   Success Rate: ${stats.successRate}%`);
        return true;
    } else {
        console.log('❌ Failed to get statistics');
        return false;
    }
}

// Test 8: Get user statistics filtered by city corporation
async function testGetUserStatisticsByCityCorporation() {
    console.log('\n📝 Test 8: Get User Statistics Filtered by City Corporation (DSCC)');
    const result = await makeRequest('GET', '/admin/users/statistics', null, {
        cityCorporationCode: 'DSCC'
    });

    if (result.success) {
        const stats = result.data;
        console.log('✅ Retrieved DSCC statistics:');
        console.log(`   Total Citizens: ${stats.totalCitizens}`);
        console.log(`   Total Complaints: ${stats.totalComplaints}`);
        console.log(`   Resolved Complaints: ${stats.resolvedComplaints}`);
        console.log(`   Success Rate: ${stats.successRate}%`);
        return true;
    } else {
        console.log('❌ Failed to get filtered statistics');
        return false;
    }
}

// Test 9: Combined filters (city corporation + ward)
async function testCombinedFilters() {
    console.log('\n📝 Test 9: Combined Filters (City Corporation + Ward)');
    const result = await makeRequest('GET', '/admin/users', null, {
        cityCorporationCode: 'DNCC',
        ward: '5',
        page: 1,
        limit: 10
    });

    if (result.success) {
        console.log(`✅ Retrieved ${result.data.users.length} users from DNCC Ward 5`);
        console.log(`   Total users: ${result.data.pagination.total}`);

        // Verify all users match both filters
        const allMatch = result.data.users.every(u =>
            u.cityCorporationCode === 'DNCC' && u.ward === '5'
        );
        if (allMatch) {
            console.log('✅ All users match both filters');
        } else {
            console.log('❌ Some users do not match filters');
        }
        return allMatch;
    } else {
        console.log('❌ Failed to apply combined filters');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Admin User Management Filter Tests\n');
    console.log('Testing Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 13.1, 13.2, 13.3, 13.4, 13.5');
    console.log('='.repeat(80));

    const results = [];

    // Run tests sequentially
    results.push(await testAdminLogin());
    if (!results[0]) {
        console.log('\n❌ Admin login failed. Cannot proceed with tests.');
        return;
    }

    results.push(await testGetUsersWithoutFilters());
    results.push(await testGetUsersByCityCorporation());
    results.push(await testGetUsersByWard());
    results.push(await testGetUsersByThana());
    results.push(await testGetUserById());
    results.push(await testGetUserStatisticsWithoutFilter());
    results.push(await testGetUserStatisticsByCityCorporation());
    results.push(await testCombinedFilters());

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 Test Summary');
    console.log('='.repeat(80));

    const passed = results.filter(r => r === true).length;
    const total = results.length;

    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});
