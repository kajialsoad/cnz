/**
 * Test script for Others API endpoints
 * 
 * Tests:
 * 1. Mark complaint as Others (CORPORATION_INTERNAL)
 * 2. Mark complaint as Others (CORPORATION_EXTERNAL)
 * 3. Invalid category validation
 * 4. Invalid subcategory validation
 * 5. Get Others analytics (no filters)
 * 6. Get Others analytics (with filters)
 * 7. Invalid zone ID validation
 * 8. Invalid date validation
 */

const BASE_URL = 'http://localhost:4000';

// Test configuration
const TEST_CONFIG = {
    // Replace with valid admin JWT token
    adminToken: 'YOUR_ADMIN_JWT_TOKEN_HERE',

    // Replace with valid complaint ID
    testComplaintId: 1,

    // Test filters
    cityCorporationCode: 'DSCC',
    zoneId: 1,
    startDate: '2024-01-01',
    endDate: '2024-12-31'
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testNumber, testName) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Test ${testNumber}: ${testName}`, 'cyan');
    log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
    log(`✓ ${message}`, 'green');
}

function logError(message) {
    log(`✗ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ ${message}`, 'blue');
}

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_CONFIG.adminToken}`
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        return { response, data };
    } catch (error) {
        logError(`Request failed: ${error.message}`);
        throw error;
    }
}

// Test 1: Mark complaint as Others (CORPORATION_INTERNAL)
async function testMarkAsOthersInternal() {
    logTest(1, 'Mark Complaint as Others (CORPORATION_INTERNAL)');

    const { response, data } = await makeRequest(
        `/api/admin/complaints/${TEST_CONFIG.testComplaintId}/mark-others`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: 'Engineering'
            })
        }
    );

    if (response.status === 200 && data.success) {
        logSuccess('Complaint marked as CORPORATION_INTERNAL successfully');
        logInfo(`Status: ${data.data.complaint.status}`);
        logInfo(`Category: ${data.data.complaint.othersCategory}`);
        logInfo(`Subcategory: ${data.data.complaint.othersSubcategory}`);
        return true;
    } else {
        logError(`Failed: ${data.message}`);
        return false;
    }
}

// Test 2: Mark complaint as Others (CORPORATION_EXTERNAL)
async function testMarkAsOthersExternal() {
    logTest(2, 'Mark Complaint as Others (CORPORATION_EXTERNAL)');

    const { response, data } = await makeRequest(
        `/api/admin/complaints/${TEST_CONFIG.testComplaintId}/mark-others`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                othersCategory: 'CORPORATION_EXTERNAL',
                othersSubcategory: 'WASA'
            })
        }
    );

    if (response.status === 200 && data.success) {
        logSuccess('Complaint marked as CORPORATION_EXTERNAL successfully');
        logInfo(`Status: ${data.data.complaint.status}`);
        logInfo(`Category: ${data.data.complaint.othersCategory}`);
        logInfo(`Subcategory: ${data.data.complaint.othersSubcategory}`);
        return true;
    } else {
        logError(`Failed: ${data.message}`);
        return false;
    }
}

// Test 3: Invalid category validation
async function testInvalidCategory() {
    logTest(3, 'Invalid Category Validation');

    const { response, data } = await makeRequest(
        `/api/admin/complaints/${TEST_CONFIG.testComplaintId}/mark-others`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                othersCategory: 'INVALID_CATEGORY',
                othersSubcategory: 'Engineering'
            })
        }
    );

    if (response.status === 400 && !data.success) {
        logSuccess('Invalid category rejected correctly');
        logInfo(`Error message: ${data.message}`);
        return true;
    } else {
        logError('Invalid category was not rejected');
        return false;
    }
}

// Test 4: Invalid subcategory validation
async function testInvalidSubcategory() {
    logTest(4, 'Invalid Subcategory Validation');

    const { response, data } = await makeRequest(
        `/api/admin/complaints/${TEST_CONFIG.testComplaintId}/mark-others`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                othersCategory: 'CORPORATION_INTERNAL',
                othersSubcategory: 'WASA' // WASA is for EXTERNAL, not INTERNAL
            })
        }
    );

    if (response.status === 400 && !data.success) {
        logSuccess('Invalid subcategory rejected correctly');
        logInfo(`Error message: ${data.message}`);
        return true;
    } else {
        logError('Invalid subcategory was not rejected');
        return false;
    }
}

// Test 5: Get Others analytics (no filters)
async function testGetAnalyticsNoFilters() {
    logTest(5, 'Get Others Analytics (No Filters)');

    const { response, data } = await makeRequest(
        '/api/admin/complaints/analytics/others',
        { method: 'GET' }
    );

    if (response.status === 200 && data.success) {
        logSuccess('Analytics retrieved successfully');
        logInfo(`Total Others: ${data.data.totalOthers}`);
        logInfo(`Internal: ${data.data.byCategory.CORPORATION_INTERNAL?.count || 0}`);
        logInfo(`External: ${data.data.byCategory.CORPORATION_EXTERNAL?.count || 0}`);

        if (data.data.topSubcategories && data.data.topSubcategories.length > 0) {
            logInfo('Top Subcategories:');
            data.data.topSubcategories.slice(0, 3).forEach((item, index) => {
                logInfo(`  ${index + 1}. ${item.subcategory}: ${item.count}`);
            });
        }

        if (data.data.averageResolutionTime) {
            logInfo(`Avg Resolution Time: ${data.data.averageResolutionTime.overall?.toFixed(2) || 'N/A'} days`);
        }

        return true;
    } else {
        logError(`Failed: ${data.message}`);
        return false;
    }
}

// Test 6: Get Others analytics (with filters)
async function testGetAnalyticsWithFilters() {
    logTest(6, 'Get Others Analytics (With Filters)');

    const queryParams = new URLSearchParams({
        cityCorporationCode: TEST_CONFIG.cityCorporationCode,
        zoneId: TEST_CONFIG.zoneId.toString(),
        startDate: TEST_CONFIG.startDate,
        endDate: TEST_CONFIG.endDate
    });

    const { response, data } = await makeRequest(
        `/api/admin/complaints/analytics/others?${queryParams}`,
        { method: 'GET' }
    );

    if (response.status === 200 && data.success) {
        logSuccess('Filtered analytics retrieved successfully');
        logInfo(`Filters applied:`);
        logInfo(`  City Corporation: ${TEST_CONFIG.cityCorporationCode}`);
        logInfo(`  Zone ID: ${TEST_CONFIG.zoneId}`);
        logInfo(`  Date Range: ${TEST_CONFIG.startDate} to ${TEST_CONFIG.endDate}`);
        logInfo(`Total Others: ${data.data.totalOthers}`);

        if (data.data.trend && data.data.trend.length > 0) {
            logInfo(`Trend data points: ${data.data.trend.length}`);
        }

        return true;
    } else {
        logError(`Failed: ${data.message}`);
        return false;
    }
}

// Test 7: Invalid zone ID validation
async function testInvalidZoneId() {
    logTest(7, 'Invalid Zone ID Validation');

    const { response, data } = await makeRequest(
        '/api/admin/complaints/analytics/others?zoneId=invalid',
        { method: 'GET' }
    );

    if (response.status === 400 && !data.success) {
        logSuccess('Invalid zone ID rejected correctly');
        logInfo(`Error message: ${data.message}`);
        return true;
    } else {
        logError('Invalid zone ID was not rejected');
        return false;
    }
}

// Test 8: Invalid date validation
async function testInvalidDate() {
    logTest(8, 'Invalid Date Validation');

    const { response, data } = await makeRequest(
        '/api/admin/complaints/analytics/others?startDate=invalid-date',
        { method: 'GET' }
    );

    if (response.status === 400 && !data.success) {
        logSuccess('Invalid date rejected correctly');
        logInfo(`Error message: ${data.message}`);
        return true;
    } else {
        logError('Invalid date was not rejected');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    log('\n' + '='.repeat(60), 'yellow');
    log('OTHERS API TEST SUITE', 'yellow');
    log('='.repeat(60), 'yellow');

    // Check configuration
    if (TEST_CONFIG.adminToken === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
        logError('\nPlease configure TEST_CONFIG.adminToken with a valid admin JWT token');
        logInfo('You can get a token by logging in as an admin user');
        return;
    }

    const results = [];

    try {
        // Run tests
        results.push(await testMarkAsOthersInternal());
        results.push(await testMarkAsOthersExternal());
        results.push(await testInvalidCategory());
        results.push(await testInvalidSubcategory());
        results.push(await testGetAnalyticsNoFilters());
        results.push(await testGetAnalyticsWithFilters());
        results.push(await testInvalidZoneId());
        results.push(await testInvalidDate());

        // Summary
        log('\n' + '='.repeat(60), 'yellow');
        log('TEST SUMMARY', 'yellow');
        log('='.repeat(60), 'yellow');

        const passed = results.filter(r => r).length;
        const failed = results.filter(r => !r).length;
        const total = results.length;

        log(`\nTotal Tests: ${total}`, 'blue');
        logSuccess(`Passed: ${passed}`);
        if (failed > 0) {
            logError(`Failed: ${failed}`);
        }

        const percentage = ((passed / total) * 100).toFixed(2);
        log(`\nSuccess Rate: ${percentage}%`, percentage === '100.00' ? 'green' : 'yellow');

        if (passed === total) {
            log('\n🎉 All tests passed!', 'green');
        } else {
            log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
        }

    } catch (error) {
        logError(`\nTest suite failed: ${error.message}`);
        console.error(error);
    }
}

// Run tests
runAllTests();
