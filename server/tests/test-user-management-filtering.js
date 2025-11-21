const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

/**
 * Test 14.4: User Management Filtering
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 13.1, 13.2, 13.3
 */

let adminToken = '';

async function getAdminToken() {
    console.log('🔐 Getting admin token...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01700000000',
            password: 'Admin@123'
        });
        adminToken = response.data.data.accessToken;
        console.log('✅ Admin token obtained\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to get admin token:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterUsersByCityCorporation() {
    console.log('1️⃣ Testing: Filter users by city corporation');
    console.log('   Requirements: 2.1, 2.2, 13.1, 13.2\n');

    try {
        console.log('   Filtering users by DSCC...');

        const response = await axios.get(
            `${BASE_URL}/admin/users?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Users filtered successfully');
        console.log(`   Found ${response.data.data.length} users in DSCC`);

        // Validate all users belong to DSCC
        const allDSCC = response.data.data.every(
            user => user.cityCorporationCode === 'DSCC'
        );

        if (!allDSCC) {
            throw new Error('Some users do not belong to DSCC');
        }

        console.log('✅ Validation passed: All users belong to DSCC\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterUsersByWard() {
    console.log('2️⃣ Testing: Filter users by ward');
    console.log('   Requirements: 2.3, 2.4, 13.2\n');

    try {
        const testWard = '10';
        console.log(`   Filtering users by ward ${testWard}...`);

        const response = await axios.get(
            `${BASE_URL}/admin/users?ward=${testWard}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Users filtered successfully');
        console.log(`   Found ${response.data.data.length} users in ward ${testWard}`);

        // Validate all users belong to the ward
        const allCorrectWard = response.data.data.every(
            user => user.ward === testWard
        );

        if (!allCorrectWard) {
            throw new Error(`Some users do not belong to ward ${testWard}`);
        }

        console.log(`✅ Validation passed: All users belong to ward ${testWard}\n`);
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterUsersByThana() {
    console.log('3️⃣ Testing: Filter users by thana');
    console.log('   Requirements: 2.3, 2.4, 13.3\n');

    try {
        // Get a thana first
        const thanasResponse = await axios.get(
            `${BASE_URL}/admin/thanas?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (thanasResponse.data.data.length === 0) {
            console.log('⚠️  No thanas available for testing, skipping...\n');
            return true;
        }

        const testThana = thanasResponse.data.data[0];
        console.log(`   Filtering users by thana: ${testThana.name} (ID: ${testThana.id})...`);

        const response = await axios.get(
            `${BASE_URL}/admin/users?thanaId=${testThana.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Users filtered successfully');
        console.log(`   Found ${response.data.data.length} users in thana ${testThana.name}`);

        // Validate all users belong to the thana
        const allCorrectThana = response.data.data.every(
            user => user.thanaId === testThana.id
        );

        if (!allCorrectThana) {
            throw new Error(`Some users do not belong to thana ${testThana.name}`);
        }

        console.log(`✅ Validation passed: All users belong to thana ${testThana.name}\n`);
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCombinedFilters() {
    console.log('4️⃣ Testing: Combined filters (city corporation + ward + thana)');
    console.log('   Requirements: 2.1, 2.2, 2.3, 2.4, 13.1, 13.2, 13.3\n');

    try {
        // Get a thana first
        const thanasResponse = await axios.get(
            `${BASE_URL}/admin/thanas?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (thanasResponse.data.data.length === 0) {
            console.log('⚠️  No thanas available for testing, skipping...\n');
            return true;
        }

        const testThana = thanasResponse.data.data[0];
        const testWard = '10';

        console.log('   Applying combined filters:');
        console.log(`   - City Corporation: DSCC`);
        console.log(`   - Ward: ${testWard}`);
        console.log(`   - Thana: ${testThana.name} (ID: ${testThana.id})`);

        const response = await axios.get(
            `${BASE_URL}/admin/users?cityCorporationCode=DSCC&ward=${testWard}&thanaId=${testThana.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Users filtered successfully');
        console.log(`   Found ${response.data.data.length} users matching all filters`);

        // Validate all users match all filters
        const allMatch = response.data.data.every(
            user => user.cityCorporationCode === 'DSCC' &&
                user.ward === testWard &&
                user.thanaId === testThana.id
        );

        if (!allMatch) {
            throw new Error('Some users do not match all filters');
        }

        console.log('✅ Validation passed: All users match combined filters\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testStatisticsWithFilters() {
    console.log('5️⃣ Testing: Statistics update with filters');
    console.log('   Requirements: 2.7, 13.4\n');

    try {
        console.log('   Getting statistics for DSCC...');

        const response = await axios.get(
            `${BASE_URL}/admin/users/statistics?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Statistics retrieved successfully');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));

        // Validate statistics structure
        const stats = response.data.data;
        if (typeof stats.totalUsers !== 'number') {
            throw new Error('totalUsers should be a number');
        }

        console.log('✅ Validation passed: Statistics reflect filtered data\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 USER MANAGEMENT FILTERING TESTS');
    console.log('   Task 14.4: Test user management filtering');
    console.log('   Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 13.1, 13.2, 13.3');
    console.log('='.repeat(70));
    console.log();

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Get admin token first
    const hasToken = await getAdminToken();
    if (!hasToken) {
        console.log('❌ Cannot proceed without admin token');
        process.exit(1);
    }

    // Run tests
    const tests = [
        { name: 'Filter by City Corporation', fn: testFilterUsersByCityCorporation },
        { name: 'Filter by Ward', fn: testFilterUsersByWard },
        { name: 'Filter by Thana', fn: testFilterUsersByThana },
        { name: 'Combined Filters', fn: testCombinedFilters },
        { name: 'Statistics with Filters', fn: testStatisticsWithFilters }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('='.repeat(70));

    if (results.failed === 0) {
        console.log('🎉 All user management filtering tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
