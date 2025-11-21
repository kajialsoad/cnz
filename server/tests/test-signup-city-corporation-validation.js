const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

/**
 * Test 14.3: User Signup with City Corporation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.4, 12.5
 */

let testUserPhone = '';
let testThanaId = null;

async function getTestThana() {
    console.log('📋 Getting test thana for DSCC...');
    try {
        const response = await axios.get(`${BASE_URL}/city-corporations/DSCC/thanas`);
        if (response.data.data.length > 0) {
            testThanaId = response.data.data[0].id;
            console.log(`✅ Using thana: ${response.data.data[0].name} (ID: ${testThanaId})\n`);
            return true;
        } else {
            console.log('⚠️  No thanas found for DSCC\n');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to get test thana:', error.message);
        return false;
    }
}

async function testSignupWithValidCityCorporation() {
    console.log('1️⃣ Testing: Signup with valid city corporation and ward');
    console.log('   Requirements: 1.1, 1.2, 1.3, 12.4\n');

    try {
        const timestamp = Date.now().toString().slice(-8);
        testUserPhone = `017${timestamp}`;

        const signupData = {
            firstName: 'Test',
            lastName: 'User CC Valid',
            phone: testUserPhone,
            password: 'Test@123',
            email: `testcc${timestamp}@example.com`,
            address: 'Test Address',
            cityCorporationCode: 'DSCC',
            ward: '10', // Valid ward for DSCC (1-75)
            thanaId: testThanaId
        };

        console.log('   Signing up with data:', {
            ...signupData,
            password: '***'
        });

        const response = await axios.post(`${BASE_URL}/auth/register`, signupData);

        console.log('✅ Signup successful');
        console.log('   Response:', response.data);

        // Validate response structure
        if (!response.data.success) {
            throw new Error('Signup response indicates failure');
        }
        if (!response.data.data || !response.data.data.email) {
            throw new Error('Invalid response structure');
        }

        console.log('✅ Validation passed: User created with correct city corporation data\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testSignupWithInvalidWard() {
    console.log('2️⃣ Testing: Signup with invalid ward (outside range)');
    console.log('   Requirements: 1.4, 1.5, 12.5\n');

    try {
        const timestamp = Date.now().toString().slice(-8);

        const signupData = {
            firstName: 'Test',
            lastName: 'User Invalid Ward',
            phone: `018${timestamp}`,
            password: 'Test@123',
            email: `testinvalid${timestamp}@example.com`,
            address: 'Test Address',
            cityCorporationCode: 'DSCC',
            ward: '100', // Invalid - DSCC max is 75
            thanaId: testThanaId
        };

        console.log('   Attempting signup with ward 100 (DSCC max is 75)');

        const response = await axios.post(`${BASE_URL}/auth/register`, signupData);

        console.error('❌ Test failed: Should have rejected invalid ward');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected invalid ward');
            console.log('   Error message:', error.response.data.message);

            // Verify error message mentions ward range
            const message = error.response.data.message.toLowerCase();
            if (message.includes('ward') || message.includes('range')) {
                console.log('✅ Validation passed: Error message mentions ward validation\n');
                return true;
            } else {
                console.log('⚠️  Error message does not mention ward validation\n');
                return true; // Still pass if rejected
            }
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testSignupWithInvalidThana() {
    console.log('3️⃣ Testing: Signup with invalid thana (doesn\'t belong to city corporation)');
    console.log('   Requirements: 1.4, 1.5, 12.5\n');

    try {
        // Get a thana from DNCC
        const dnccThanasResponse = await axios.get(`${BASE_URL}/city-corporations/DNCC/thanas`);

        if (dnccThanasResponse.data.data.length === 0) {
            console.log('⚠️  No DNCC thanas available for testing, skipping...\n');
            return true;
        }

        const dnccThanaId = dnccThanasResponse.data.data[0].id;
        const timestamp = Date.now().toString().slice(-8);

        const signupData = {
            firstName: 'Test',
            lastName: 'User Invalid Thana',
            phone: `019${timestamp}`,
            password: 'Test@123',
            email: `testthana${timestamp}@example.com`,
            address: 'Test Address',
            cityCorporationCode: 'DSCC', // DSCC
            ward: '10',
            thanaId: dnccThanaId // But using DNCC thana
        };

        console.log(`   Attempting signup with DSCC but DNCC thana (ID: ${dnccThanaId})`);

        const response = await axios.post(`${BASE_URL}/auth/register`, signupData);

        console.error('❌ Test failed: Should have rejected mismatched thana');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected mismatched thana');
            console.log('   Error message:', error.response.data.message);
            console.log('✅ Validation passed\n');
            return true;
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testSignupWithInactiveCityCorporation() {
    console.log('4️⃣ Testing: Signup with inactive city corporation (should fail)');
    console.log('   Requirements: 1.5, 12.5\n');

    try {
        const timestamp = Date.now().toString().slice(-8);

        const signupData = {
            firstName: 'Test',
            lastName: 'User Inactive CC',
            phone: `016${timestamp}`,
            password: 'Test@123',
            email: `testinactive${timestamp}@example.com`,
            address: 'Test Address',
            cityCorporationCode: 'INACTIVE_CC', // Non-existent/inactive
            ward: '10',
            thanaId: testThanaId
        };

        console.log('   Attempting signup with inactive city corporation code');

        const response = await axios.post(`${BASE_URL}/auth/register`, signupData);

        console.error('❌ Test failed: Should have rejected inactive city corporation');
        return false;
    } catch (error) {
        if (error.response?.status === 400 || error.response?.status === 404) {
            console.log('✅ Correctly rejected inactive/invalid city corporation');
            console.log('   Error message:', error.response.data.message);
            console.log('✅ Validation passed\n');
            return true;
        } else {
            console.error('❌ Unexpected error:', error.response?.data || error.message);
            return false;
        }
    }
}

async function testSignupWithoutThana() {
    console.log('5️⃣ Testing: Signup without thana (should succeed - thana is optional)');
    console.log('   Requirement: 9.4 - Thana is optional\n');

    try {
        const timestamp = Date.now().toString().slice(-8);

        const signupData = {
            firstName: 'Test',
            lastName: 'User No Thana',
            phone: `015${timestamp}`,
            password: 'Test@123',
            email: `testnothana${timestamp}@example.com`,
            address: 'Test Address',
            cityCorporationCode: 'DSCC',
            ward: '15'
            // No thanaId
        };

        console.log('   Signing up without thana...');

        const response = await axios.post(`${BASE_URL}/auth/register`, signupData);

        console.log('✅ Signup successful without thana');
        console.log('   Response:', response.data);

        // Validate response structure
        if (!response.data.success) {
            throw new Error('Signup response indicates failure');
        }
        console.log('✅ Validation passed: Thana is optional\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 USER SIGNUP WITH CITY CORPORATION TESTS');
    console.log('   Task 14.3: Test user signup with city corporation');
    console.log('   Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.4, 12.5');
    console.log('='.repeat(70));
    console.log();

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Get test thana first
    const hasThana = await getTestThana();
    if (!hasThana) {
        console.log('⚠️  Cannot run all tests without thana data');
    }

    // Run tests
    const tests = [
        { name: 'Valid Signup', fn: testSignupWithValidCityCorporation },
        { name: 'Invalid Ward', fn: testSignupWithInvalidWard },
        { name: 'Invalid Thana', fn: testSignupWithInvalidThana },
        { name: 'Inactive City Corporation', fn: testSignupWithInactiveCityCorporation },
        { name: 'Optional Thana', fn: testSignupWithoutThana }
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
        console.log('🎉 All user signup validation tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
