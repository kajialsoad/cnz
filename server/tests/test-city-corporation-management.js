const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test data
let adminToken = '';
let testCityCorpCode = '';

/**
 * Test 14.1: City Corporation Management
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8
 */

async function getAdminToken() {
    console.log('🔐 Getting admin token...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01700000000', // Super admin phone
            password: 'Admin@123'
        });
        adminToken = response.data.data.accessToken;
        console.log('✅ Admin token obtained\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to get admin token:', error.response?.data || error.message);
        console.log('⚠️  Make sure a SUPER_ADMIN user exists with phone: 01700000000, password: Admin@123\n');
        return false;
    }
}

async function testCreateCityCorporation() {
    console.log('1️⃣ Testing: Create new city corporation');
    console.log('   Requirement: 10.2 - Create city corporation with validation\n');

    try {
        // Generate unique code for testing
        const timestamp = Date.now().toString().slice(-6);
        testCityCorpCode = `TEST${timestamp}`;

        const newCityCorpData = {
            code: testCityCorpCode,
            name: `Test City Corporation ${timestamp}`,
            minWard: 1,
            maxWard: 50
        };

        console.log('   Creating city corporation:', newCityCorpData);

        const response = await axios.post(
            `${BASE_URL}/admin/city-corporations`,
            newCityCorpData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ City corporation created successfully');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));

        // Validate response
        const created = response.data.data;
        if (created.code !== testCityCorpCode) {
            throw new Error('Code mismatch');
        }
        if (created.minWard !== 1 || created.maxWard !== 50) {
            throw new Error('Ward range mismatch');
        }
        if (created.status !== 'ACTIVE') {
            throw new Error('Status should be ACTIVE by default');
        }

        console.log('✅ Validation passed: All fields match expected values\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCreateDuplicateCityCorporation() {
    console.log('2️⃣ Testing: Create duplicate city corporation (should fail)');
    console.log('   Requirement: 10.2 - Validate unique code\n');

    try {
        const duplicateData = {
            code: testCityCorpCode, // Same code as before
            name: 'Duplicate Test',
            minWard: 1,
            maxWard: 30
        };

        console.log('   Attempting to create duplicate with code:', testCityCorpCode);

        const response = await axios.post(
            `${BASE_URL}/admin/city-corporations`,
            duplicateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.error('❌ Test failed: Should have rejected duplicate code');
        return false;
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 409) {
            console.log('✅ Correctly rejected duplicate city corporation code');
            console.log('   Error message:', error.response.data.message);
            console.log('✅ Validation passed\n');
            return true;
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testUpdateCityCorporationWardRange() {
    console.log('3️⃣ Testing: Update city corporation ward range');
    console.log('   Requirement: 10.3 - Update city corporation\n');

    try {
        const updateData = {
            minWard: 1,
            maxWard: 75 // Increase ward range
        };

        console.log('   Updating ward range to:', updateData);

        const response = await axios.put(
            `${BASE_URL}/admin/city-corporations/${testCityCorpCode}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Ward range updated successfully');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));

        // Validate update
        const updated = response.data.data;
        if (updated.maxWard !== 75) {
            throw new Error('Ward range not updated correctly');
        }

        console.log('✅ Validation passed: Ward range updated correctly\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeactivateCityCorporation() {
    console.log('4️⃣ Testing: Deactivate city corporation');
    console.log('   Requirement: 10.5 - Deactivate city corporation\n');

    try {
        const updateData = {
            status: 'INACTIVE'
        };

        console.log('   Deactivating city corporation:', testCityCorpCode);

        const response = await axios.put(
            `${BASE_URL}/admin/city-corporations/${testCityCorpCode}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ City corporation deactivated successfully');
        console.log('   Status:', response.data.data.status);

        // Verify it's not in active list
        const activeResponse = await axios.get(`${BASE_URL}/city-corporations/active`);
        const isInActiveList = activeResponse.data.data.some(cc => cc.code === testCityCorpCode);

        if (isInActiveList) {
            throw new Error('Deactivated city corporation still appears in active list');
        }

        console.log('✅ Validation passed: Deactivated city corporation hidden from active list\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testActivateCityCorporation() {
    console.log('5️⃣ Testing: Activate city corporation');
    console.log('   Requirement: 10.4 - Activate city corporation\n');

    try {
        const updateData = {
            status: 'ACTIVE'
        };

        console.log('   Activating city corporation:', testCityCorpCode);

        const response = await axios.put(
            `${BASE_URL}/admin/city-corporations/${testCityCorpCode}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ City corporation activated successfully');
        console.log('   Status:', response.data.data.status);

        // Verify it appears in active list
        const activeResponse = await axios.get(`${BASE_URL}/city-corporations/active`);
        const isInActiveList = activeResponse.data.data.some(cc => cc.code === testCityCorpCode);

        if (!isInActiveList) {
            throw new Error('Activated city corporation does not appear in active list');
        }

        console.log('✅ Validation passed: Activated city corporation appears in active list\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetCityCorporationStatistics() {
    console.log('6️⃣ Testing: Get city corporation statistics');
    console.log('   Requirement: 10.8 - Display statistics for city corporation\n');

    try {
        // Test with DSCC (should have data)
        console.log('   Getting statistics for DSCC...');

        const response = await axios.get(
            `${BASE_URL}/admin/city-corporations/DSCC/statistics`,
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
        if (typeof stats.totalComplaints !== 'number') {
            throw new Error('totalComplaints should be a number');
        }
        if (typeof stats.activeThanas !== 'number') {
            throw new Error('activeThanas should be a number');
        }

        console.log('✅ Validation passed: Statistics structure is correct\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetAllCityCorporations() {
    console.log('7️⃣ Testing: Get all city corporations');
    console.log('   Requirement: 10.1 - Display list of all city corporations\n');

    try {
        console.log('   Getting all city corporations...');

        const response = await axios.get(
            `${BASE_URL}/admin/city-corporations`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ City corporations retrieved successfully');
        console.log(`   Found ${response.data.data.length} city corporations`);

        // Validate our test city corporation is in the list
        const testCC = response.data.data.find(cc => cc.code === testCityCorpCode);
        if (!testCC) {
            throw new Error('Test city corporation not found in list');
        }

        console.log('   Test city corporation found:', testCC.name);
        console.log('✅ Validation passed\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...');

    try {
        // Deactivate the test city corporation
        await axios.put(
            `${BASE_URL}/admin/city-corporations/${testCityCorpCode}`,
            { status: 'INACTIVE' },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Test data cleaned up\n');
    } catch (error) {
        console.log('⚠️  Cleanup warning:', error.response?.data?.message || error.message);
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 CITY CORPORATION MANAGEMENT TESTS');
    console.log('   Task 14.1: Test city corporation management');
    console.log('   Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.8');
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
        { name: 'Create City Corporation', fn: testCreateCityCorporation },
        { name: 'Reject Duplicate Code', fn: testCreateDuplicateCityCorporation },
        { name: 'Update Ward Range', fn: testUpdateCityCorporationWardRange },
        { name: 'Deactivate City Corporation', fn: testDeactivateCityCorporation },
        { name: 'Activate City Corporation', fn: testActivateCityCorporation },
        { name: 'Get Statistics', fn: testGetCityCorporationStatistics },
        { name: 'Get All City Corporations', fn: testGetAllCityCorporations }
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

    // Cleanup
    await cleanupTestData();

    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('='.repeat(70));

    if (results.failed === 0) {
        console.log('🎉 All city corporation management tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
