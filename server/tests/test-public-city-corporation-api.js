/**
 * Test suite for public city corporation API endpoints
 * Tests response format consistency and data structure
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testActiveCityCorporationsEndpoint() {
    log('\n📋 Test 1: GET /api/city-corporations/active', 'blue');
    log('Testing that response contains cityCorporations field...', 'yellow');

    try {
        const response = await axios.get(`${BASE_URL}/api/city-corporations/active`);

        // Test 1: Response should have success: true
        if (response.data.success !== true) {
            throw new Error('Response missing success: true field');
        }
        log('✓ Response contains success: true', 'green');

        // Test 2: Response should have cityCorporations field (not data)
        if (!response.data.cityCorporations) {
            throw new Error('Response missing cityCorporations field');
        }
        log('✓ Response contains cityCorporations field', 'green');

        // Test 3: cityCorporations should be an array
        if (!Array.isArray(response.data.cityCorporations)) {
            throw new Error('cityCorporations is not an array');
        }
        log('✓ cityCorporations is an array', 'green');

        // Test 4: Array items should have correct structure
        if (response.data.cityCorporations.length > 0) {
            const firstItem = response.data.cityCorporations[0];
            const requiredFields = ['code', 'name', 'minWard', 'maxWard'];

            for (const field of requiredFields) {
                if (!(field in firstItem)) {
                    throw new Error(`City corporation missing required field: ${field}`);
                }
            }
            log('✓ City corporation objects have correct structure', 'green');
            log(`  Found ${response.data.cityCorporations.length} city corporations`, 'blue');
        }

        log('✅ Test 1 PASSED', 'green');
        return true;
    } catch (error) {
        log('❌ Test 1 FAILED', 'red');
        if (error.response) {
            log(`  Status: ${error.response.status}`, 'red');
            log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        } else {
            log(`  Error: ${error.message}`, 'red');
        }
        return false;
    }
}

async function testThanasEndpoint() {
    log('\n📋 Test 2: GET /api/city-corporations/:code/thanas', 'blue');
    log('Testing that response contains thanas field...', 'yellow');

    try {
        // First get a city corporation code
        const ccResponse = await axios.get(`${BASE_URL}/api/city-corporations/active`);
        if (!ccResponse.data.cityCorporations || ccResponse.data.cityCorporations.length === 0) {
            log('⚠️  No city corporations available to test thanas endpoint', 'yellow');
            return true;
        }

        const testCode = ccResponse.data.cityCorporations[0].code;
        log(`  Testing with city corporation code: ${testCode}`, 'blue');

        const response = await axios.get(`${BASE_URL}/api/city-corporations/${testCode}/thanas`);

        // Test 1: Response should have success: true
        if (response.data.success !== true) {
            throw new Error('Response missing success: true field');
        }
        log('✓ Response contains success: true', 'green');

        // Test 2: Response should have thanas field (not data)
        if (!response.data.thanas) {
            throw new Error('Response missing thanas field');
        }
        log('✓ Response contains thanas field', 'green');

        // Test 3: thanas should be an array
        if (!Array.isArray(response.data.thanas)) {
            throw new Error('thanas is not an array');
        }
        log('✓ thanas is an array', 'green');

        // Test 4: Array items should have correct structure
        if (response.data.thanas.length > 0) {
            const firstItem = response.data.thanas[0];
            const requiredFields = ['id', 'name'];

            for (const field of requiredFields) {
                if (!(field in firstItem)) {
                    throw new Error(`Thana missing required field: ${field}`);
                }
            }
            log('✓ Thana objects have correct structure', 'green');
            log(`  Found ${response.data.thanas.length} thanas`, 'blue');
        } else {
            log('  No thanas found for this city corporation', 'yellow');
        }

        log('✅ Test 2 PASSED', 'green');
        return true;
    } catch (error) {
        log('❌ Test 2 FAILED', 'red');
        if (error.response) {
            log(`  Status: ${error.response.status}`, 'red');
            log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        } else {
            log(`  Error: ${error.message}`, 'red');
        }
        return false;
    }
}

async function testErrorResponses() {
    log('\n📋 Test 3: Error Response Format', 'blue');
    log('Testing that error responses have correct format...', 'yellow');

    try {
        // Test with invalid city corporation code
        try {
            await axios.get(`${BASE_URL}/api/city-corporations/INVALID_CODE/thanas`);
            throw new Error('Expected 404 error but request succeeded');
        } catch (error) {
            if (!error.response) {
                throw error;
            }

            // Test 1: Should return 404 status
            if (error.response.status !== 404) {
                throw new Error(`Expected 404 status, got ${error.response.status}`);
            }
            log('✓ Returns 404 status for not found', 'green');

            // Test 2: Response should have success: false
            if (error.response.data.success !== false) {
                throw new Error('Error response missing success: false field');
            }
            log('✓ Error response contains success: false', 'green');

            // Test 3: Response should have message field
            if (!error.response.data.message) {
                throw new Error('Error response missing message field');
            }
            log('✓ Error response contains message field', 'green');

            // Test 4: Should not expose internal error details
            if (error.response.data.error) {
                log('⚠️  Warning: Error response exposes internal error details', 'yellow');
            } else {
                log('✓ Error response does not expose internal details', 'green');
            }
        }

        log('✅ Test 3 PASSED', 'green');
        return true;
    } catch (error) {
        log('❌ Test 3 FAILED', 'red');
        log(`  Error: ${error.message}`, 'red');
        return false;
    }
}

async function runAllTests() {
    log('='.repeat(60), 'blue');
    log('🧪 Public City Corporation API Response Format Tests', 'blue');
    log('='.repeat(60), 'blue');

    const results = [];

    results.push(await testActiveCityCorporationsEndpoint());
    results.push(await testThanasEndpoint());
    results.push(await testErrorResponses());

    log('\n' + '='.repeat(60), 'blue');
    log('📊 Test Summary', 'blue');
    log('='.repeat(60), 'blue');

    const passed = results.filter((r) => r).length;
    const failed = results.filter((r) => !r).length;

    log(`Total Tests: ${results.length}`, 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

    if (failed === 0) {
        log('\n✅ All tests passed!', 'green');
        process.exit(0);
    } else {
        log('\n❌ Some tests failed', 'red');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch((error) => {
    log('\n💥 Test suite crashed', 'red');
    log(error.message, 'red');
    console.error(error);
    process.exit(1);
});
