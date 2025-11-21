const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test data
let adminToken = '';
let testThanaId = null;
const TEST_CITY_CORP = 'DSCC'; // Use existing city corporation

/**
 * Test 14.2: Thana Management
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8
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

async function testCreateThana() {
    console.log('1️⃣ Testing: Create thana for city corporation');
    console.log('   Requirement: 11.2 - Create thana with validation\n');

    try {
        const timestamp = Date.now().toString().slice(-6);
        const newThanaData = {
            name: `Test Thana ${timestamp}`,
            cityCorporationCode: TEST_CITY_CORP
        };

        console.log('   Creating thana:', newThanaData);

        const response = await axios.post(
            `${BASE_URL}/admin/thanas`,
            newThanaData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Thana created successfully');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));

        // Store thana ID for later tests
        testThanaId = response.data.data.id;

        // Validate response
        const created = response.data.data;
        if (created.name !== newThanaData.name) {
            throw new Error('Name mismatch');
        }
        if (created.status !== 'ACTIVE') {
            throw new Error('Status should be ACTIVE by default');
        }
        if (!created.cityCorporation || created.cityCorporation.code !== TEST_CITY_CORP) {
            throw new Error('City corporation relationship not correct');
        }

        console.log('✅ Validation passed: All fields match expected values\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCreateDuplicateThana() {
    console.log('2️⃣ Testing: Create duplicate thana (should fail)');
    console.log('   Requirement: 11.3 - Validate unique name within city corporation\n');

    try {
        // Get the name of the thana we just created
        const getResponse = await axios.get(
            `${BASE_URL}/admin/thanas/${testThanaId}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        const existingThanaName = getResponse.data.data.name;

        const duplicateData = {
            name: existingThanaName, // Same name
            cityCorporationCode: TEST_CITY_CORP // Same city corporation
        };

        console.log('   Attempting to create duplicate thana:', duplicateData);

        const response = await axios.post(
            `${BASE_URL}/admin/thanas`,
            duplicateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.error('❌ Test failed: Should have rejected duplicate thana name');
        return false;
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 409) {
            console.log('✅ Correctly rejected duplicate thana name within city corporation');
            console.log('   Error message:', error.response.data.message);
            console.log('✅ Validation passed\n');
            return true;
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testUpdateThana() {
    console.log('3️⃣ Testing: Update thana');
    console.log('   Requirement: 11.4 - Update thana\n');

    try {
        const updateData = {
            name: `Updated Test Thana ${Date.now().toString().slice(-4)}`
        };

        console.log('   Updating thana name to:', updateData.name);

        const response = await axios.put(
            `${BASE_URL}/admin/thanas/${testThanaId}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Thana updated successfully');
        console.log('   Response:', JSON.stringify(response.data.data, null, 2));

        // Validate update
        const updated = response.data.data;
        if (updated.name !== updateData.name) {
            throw new Error('Name not updated correctly');
        }

        console.log('✅ Validation passed: Thana name updated correctly\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testDeactivateThana() {
    console.log('4️⃣ Testing: Deactivate thana');
    console.log('   Requirement: 11.5 - Deactivate thana\n');

    try {
        const updateData = {
            status: 'INACTIVE'
        };

        console.log('   Deactivating thana ID:', testThanaId);

        const response = await axios.put(
            `${BASE_URL}/admin/thanas/${testThanaId}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Thana deactivated successfully');
        console.log('   Status:', response.data.data.status);

        // Verify it's not in active list
        const activeResponse = await axios.get(
            `${BASE_URL}/city-corporations/${TEST_CITY_CORP}/thanas`
        );
        const isInActiveList = activeResponse.data.data.some(t => t.id === testThanaId);

        if (isInActiveList) {
            throw new Error('Deactivated thana still appears in active list');
        }

        console.log('✅ Validation passed: Deactivated thana hidden from active list\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testActivateThana() {
    console.log('5️⃣ Testing: Activate thana');
    console.log('   Requirement: 11.4 - Activate thana\n');

    try {
        const updateData = {
            status: 'ACTIVE'
        };

        console.log('   Activating thana ID:', testThanaId);

        const response = await axios.put(
            `${BASE_URL}/admin/thanas/${testThanaId}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Thana activated successfully');
        console.log('   Status:', response.data.data.status);

        // Verify it appears in active list
        const activeResponse = await axios.get(
            `${BASE_URL}/city-corporations/${TEST_CITY_CORP}/thanas`
        );
        const isInActiveList = activeResponse.data.data.some(t => t.id === testThanaId);

        if (!isInActiveList) {
            throw new Error('Activated thana does not appear in active list');
        }

        console.log('✅ Validation passed: Activated thana appears in active list\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetThanaStatistics() {
    console.log('6️⃣ Testing: Get thana statistics');
    console.log('   Requirement: 11.8 - Display statistics for thana\n');

    try {
        // Get a thana with data (use existing one from DSCC)
        const thanasResponse = await axios.get(
            `${BASE_URL}/admin/thanas?cityCorporationCode=${TEST_CITY_CORP}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        const existingThana = thanasResponse.data.data.find(t => t.id !== testThanaId);

        if (!existingThana) {
            console.log('⚠️  No existing thana found to test statistics');
            return true;
        }

        console.log(`   Getting statistics for thana: ${existingThana.name} (ID: ${existingThana.id})`);

        const response = await axios.get(
            `${BASE_URL}/admin/thanas/${existingThana.id}/statistics`,
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

        console.log('✅ Validation passed: Statistics structure is correct\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testGetThanasByCityCorporation() {
    console.log('7️⃣ Testing: Get thanas by city corporation');
    console.log('   Requirement: 11.1 - Display thanas for city corporation\n');

    try {
        console.log(`   Getting thanas for ${TEST_CITY_CORP}...`);

        const response = await axios.get(
            `${BASE_URL}/admin/thanas?cityCorporationCode=${TEST_CITY_CORP}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Thanas retrieved successfully');
        console.log(`   Found ${response.data.data.length} thanas for ${TEST_CITY_CORP}`);

        // Validate our test thana is in the list
        const testThana = response.data.data.find(t => t.id === testThanaId);
        if (!testThana) {
            throw new Error('Test thana not found in list');
        }

        console.log('   Test thana found:', testThana.name);

        // Validate all thanas belong to the correct city corporation
        const allBelongToCC = response.data.data.every(
            t => t.cityCorporation.code === TEST_CITY_CORP
        );

        if (!allBelongToCC) {
            throw new Error('Some thanas do not belong to the requested city corporation');
        }

        console.log('✅ Validation passed: All thanas belong to correct city corporation\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...');

    try {
        if (testThanaId) {
            // Deactivate the test thana
            await axios.put(
                `${BASE_URL}/admin/thanas/${testThanaId}`,
                { status: 'INACTIVE' },
                {
                    headers: { Authorization: `Bearer ${adminToken}` }
                }
            );

            console.log('✅ Test data cleaned up\n');
        }
    } catch (error) {
        console.log('⚠️  Cleanup warning:', error.response?.data?.message || error.message);
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 THANA MANAGEMENT TESTS');
    console.log('   Task 14.2: Test thana management');
    console.log('   Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.8');
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
        { name: 'Create Thana', fn: testCreateThana },
        { name: 'Reject Duplicate Name', fn: testCreateDuplicateThana },
        { name: 'Update Thana', fn: testUpdateThana },
        { name: 'Deactivate Thana', fn: testDeactivateThana },
        { name: 'Activate Thana', fn: testActivateThana },
        { name: 'Get Statistics', fn: testGetThanaStatistics },
        { name: 'Get Thanas by City Corporation', fn: testGetThanasByCityCorporation }
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
        console.log('🎉 All thana management tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
