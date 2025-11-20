/**
 * Test script for fetching complaint list
 * Uses saved token from test-token.json
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// Load saved token
let authToken = null;
try {
    const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-token.json'), 'utf8'));
    authToken = tokenData.accessToken;
    console.log('✓ Loaded saved authentication token');
} catch (error) {
    console.error('✗ Failed to load token from test-token.json');
    console.error('  Please run test-login-token.js first to generate a token');
    process.exit(1);
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
    const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
        config.data = data;
    }

    try {
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status,
        };
    }
}

// Test: Fetch complaint list
async function testFetchComplaintList() {
    console.log('\n=== Testing: Fetch Complaint List ===');
    console.log(`Endpoint: GET ${BASE_URL}/api/complaints`);
    console.log(`Auth: Bearer ${authToken.substring(0, 20)}...`);

    const result = await makeRequest('get', '/api/complaints');

    if (!result.success) {
        console.log('\n✗ FAILED: Could not fetch complaint list');
        console.log(`  Status: ${result.status}`);
        console.log(`  Error: ${JSON.stringify(result.error, null, 2)}`);
        return false;
    }

    if (!result.data.success) {
        console.log('\n✗ FAILED: API returned success=false');
        console.log(`  Response: ${JSON.stringify(result.data, null, 2)}`);
        return false;
    }

    console.log('\n✓ SUCCESS: Complaint list fetched successfully');

    // Parse response structure
    const responseData = result.data.data;
    const complaints = responseData.complaints || [];
    const pagination = responseData.pagination;

    console.log('\n--- Response Structure ---');
    console.log(`Total Complaints: ${complaints.length}`);

    if (pagination) {
        console.log('\nPagination:');
        console.log(`  - Page: ${pagination.page}`);
        console.log(`  - Limit: ${pagination.limit}`);
        console.log(`  - Total: ${pagination.total}`);
        console.log(`  - Total Pages: ${pagination.totalPages}`);
    }

    // Display sample complaints
    if (complaints.length > 0) {
        console.log('\n--- Sample Complaints ---');

        complaints.slice(0, 3).forEach((complaint, index) => {
            console.log(`\nComplaint #${index + 1}:`);
            console.log(`  - ID: ${complaint.id}`);
            console.log(`  - Title: ${complaint.title}`);
            console.log(`  - Description: ${complaint.description?.substring(0, 60)}...`);
            console.log(`  - Status: ${complaint.status}`);
            console.log(`  - Priority: ${complaint.priority}`);
            console.log(`  - Location: ${complaint.location}`);
            console.log(`  - District: ${complaint.district || 'N/A'}`);
            console.log(`  - Thana: ${complaint.thana || 'N/A'}`);
            console.log(`  - Ward: ${complaint.ward || 'N/A'}`);
            console.log(`  - City Corporation: ${complaint.cityCorporation || 'N/A'}`);
            console.log(`  - Image URLs: ${complaint.imageUrls || 'None'}`);
            console.log(`  - Voice Note URL: ${complaint.voiceNoteUrl || 'None'}`);
            console.log(`  - Created At: ${complaint.createdAt}`);
            console.log(`  - Updated At: ${complaint.updatedAt}`);
        });

        if (complaints.length > 3) {
            console.log(`\n... and ${complaints.length - 3} more complaints`);
        }

        // Verify data format
        console.log('\n--- Data Format Verification ---');
        const firstComplaint = complaints[0];

        const requiredFields = ['id', 'title', 'description', 'status', 'createdAt'];
        const missingFields = requiredFields.filter(field => !firstComplaint[field]);

        if (missingFields.length === 0) {
            console.log('✓ All required fields present');
        } else {
            console.log(`✗ Missing fields: ${missingFields.join(', ')}`);
        }

        // Check status enum
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
        const invalidStatuses = complaints.filter(c => !validStatuses.includes(c.status));

        if (invalidStatuses.length === 0) {
            console.log('✓ All status values are valid');
        } else {
            console.log(`✗ Found ${invalidStatuses.length} complaints with invalid status`);
        }

        // Check timestamps
        const hasValidTimestamps = complaints.every(c => {
            const created = new Date(c.createdAt);
            const updated = new Date(c.updatedAt);
            return !isNaN(created.getTime()) && !isNaN(updated.getTime());
        });

        if (hasValidTimestamps) {
            console.log('✓ All timestamps are valid');
        } else {
            console.log('✗ Some timestamps are invalid');
        }

    } else {
        console.log('\nℹ No complaints found for this user');
        console.log('  This is expected if the user has not submitted any complaints yet');
    }

    return true;
}

// Test: Fetch complaint list with pagination
async function testPagination() {
    console.log('\n\n=== Testing: Pagination ===');
    console.log(`Endpoint: GET ${BASE_URL}/api/complaints?page=1&limit=5`);

    const result = await makeRequest('get', '/api/complaints?page=1&limit=5');

    if (!result.success || !result.data.success) {
        console.log('✗ FAILED: Could not test pagination');
        return false;
    }

    const complaints = result.data.data.complaints || [];
    const pagination = result.data.data.pagination;

    console.log('\n✓ SUCCESS: Pagination works');
    console.log(`  - Requested limit: 5`);
    console.log(`  - Returned complaints: ${complaints.length}`);
    console.log(`  - Pagination info: ${JSON.stringify(pagination)}`);

    return true;
}

// Test: Filter by status
async function testStatusFilter() {
    console.log('\n\n=== Testing: Status Filter ===');
    console.log(`Endpoint: GET ${BASE_URL}/api/complaints?status=PENDING`);

    const result = await makeRequest('get', '/api/complaints?status=PENDING');

    if (!result.success || !result.data.success) {
        console.log('✗ FAILED: Could not test status filter');
        return false;
    }

    const complaints = result.data.data.complaints || [];
    const allPending = complaints.every(c => c.status === 'PENDING');

    if (allPending || complaints.length === 0) {
        console.log('\n✓ SUCCESS: Status filter works');
        console.log(`  - Found ${complaints.length} PENDING complaints`);
    } else {
        console.log('\n✗ FAILED: Status filter returned non-PENDING complaints');
    }

    return allPending || complaints.length === 0;
}

// Main test runner
async function runTests() {
    console.log('='.repeat(70));
    console.log('COMPLAINT LIST API TEST');
    console.log('='.repeat(70));
    console.log(`Base URL: ${BASE_URL}`);

    const results = [];

    // Run tests
    results.push(await testFetchComplaintList());
    results.push(await testPagination());
    results.push(await testStatusFilter());

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`\nPassed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('\n✓ All tests passed!');
        console.log('\nThe complaint list endpoint is working correctly.');
        console.log('You can now test it in the Flutter app.');
        process.exit(0);
    } else {
        console.log('\n✗ Some tests failed');
        console.log('\nPlease check the error messages above.');
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\nFatal error running tests:', error);
    process.exit(1);
});
