/**
 * Profile Error Handling and Validation Test
 * Tests comprehensive error handling for profile operations
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000';

// Test credentials
const TEST_ADMIN = {
    email: 'superadmin@demo.com',
    password: 'Demo123@#'
};

let authToken = null;

/**
 * Login to get auth token
 */
async function login() {
    try {
        console.log('\n🔐 Logging in as admin...');
        const response = await axios.post(`${API_BASE_URL}/api/admin/auth/login`, TEST_ADMIN);

        if (response.data.accessToken) {
            authToken = response.data.accessToken;
            console.log('✅ Login successful');
            return true;
        }

        console.log('❌ Login failed: No access token received');
        return false;
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

/**
 * Test 1: Validation - Empty first name
 */
async function testEmptyFirstName() {
    console.log('\n📝 Test 1: Empty first name validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: '' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected empty first name');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected empty first name');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 2: Validation - First name too short
 */
async function testShortFirstName() {
    console.log('\n📝 Test 2: First name too short validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: 'A' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected short first name');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected short first name');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 3: Validation - First name too long
 */
async function testLongFirstName() {
    console.log('\n📝 Test 3: First name too long validation');
    try {
        const longName = 'A'.repeat(51);
        const response = await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: longName },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected long first name');
        console.log('   Response:', response.data);
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected long first name');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected status:', error.response?.status);
        console.log('   Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test 4: Validation - Invalid characters in name
 */
async function testInvalidCharactersInName() {
    console.log('\n📝 Test 4: Invalid characters in name validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: 'John123' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected name with numbers');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected name with invalid characters');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 5: Validation - Invalid avatar URL
 */
async function testInvalidAvatarUrl() {
    console.log('\n📝 Test 5: Invalid avatar URL validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { avatar: 'not-a-valid-url' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected invalid avatar URL');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected invalid avatar URL');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 6: Validation - Address too short
 */
async function testShortAddress() {
    console.log('\n📝 Test 6: Address too short validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { address: 'Short' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected short address');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected short address');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 7: Validation - No data provided
 */
async function testNoDataProvided() {
    console.log('\n📝 Test 7: No data provided validation');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('❌ FAILED: Should have rejected empty update');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ PASSED: Correctly rejected empty update');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 8: Authentication - Missing token
 */
async function testMissingToken() {
    console.log('\n📝 Test 8: Missing authentication token');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: 'John' }
        );
        console.log('❌ FAILED: Should have rejected request without token');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ PASSED: Correctly rejected request without token');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 9: Authentication - Invalid token
 */
async function testInvalidToken() {
    console.log('\n📝 Test 9: Invalid authentication token');
    try {
        await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            { firstName: 'John' },
            { headers: { Authorization: 'Bearer invalid-token' } }
        );
        console.log('❌ FAILED: Should have rejected invalid token');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ PASSED: Correctly rejected invalid token');
            console.log('   Error:', error.response.data.message);
            return true;
        }
        console.log('❌ FAILED: Unexpected error:', error.message);
        return false;
    }
}

/**
 * Test 10: Success - Valid profile update
 */
async function testValidProfileUpdate() {
    console.log('\n📝 Test 10: Valid profile update');
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            {
                firstName: 'John',
                lastName: 'Doe',
                ward: '10',
                zone: 'A'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && response.data.data) {
            console.log('✅ PASSED: Profile updated successfully');
            console.log('   Updated data:', {
                firstName: response.data.data.firstName,
                lastName: response.data.data.lastName,
                ward: response.data.data.ward,
                zone: response.data.data.zone
            });
            return true;
        }

        console.log('❌ FAILED: Invalid response format');
        return false;
    } catch (error) {
        console.log('❌ FAILED:', error.response?.data?.message || error.message);
        return false;
    }
}

/**
 * Test 11: Sanitization - Whitespace trimming
 */
async function testWhitespaceTrimming() {
    console.log('\n📝 Test 11: Whitespace trimming');
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/api/admin/auth/profile`,
            {
                firstName: '  John  ',
                lastName: '  Doe  '
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success &&
            response.data.data.firstName === 'John' &&
            response.data.data.lastName === 'Doe') {
            console.log('✅ PASSED: Whitespace correctly trimmed');
            return true;
        }

        console.log('❌ FAILED: Whitespace not trimmed correctly');
        return false;
    } catch (error) {
        console.log('❌ FAILED:', error.response?.data?.message || error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🧪 Profile Error Handling and Validation Tests');
    console.log('='.repeat(60));

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without authentication');
        return;
    }

    // Run tests
    const results = [];

    results.push(await testEmptyFirstName());
    results.push(await testShortFirstName());
    results.push(await testLongFirstName());
    results.push(await testInvalidCharactersInName());
    results.push(await testInvalidAvatarUrl());
    results.push(await testShortAddress());
    results.push(await testNoDataProvided());
    results.push(await testMissingToken());
    results.push(await testInvalidToken());
    results.push(await testValidProfileUpdate());
    results.push(await testWhitespaceTrimming());

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.');
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
