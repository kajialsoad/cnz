/**
 * Test script for Complaint API endpoints
 * Tests the /api/complaints endpoints with authentication
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// Test user credentials (from demo data)
const TEST_USER = {
    phone: '01712345678',
    password: 'password123'
};

let authToken = null;
let testComplaintId = null;

// Helper function to log test results
function logTest(name, passed, details = '') {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`\n${status}: ${name}`);
    if (details) console.log(`  ${details}`);
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

// Test 1: Login to get auth token
async function testLogin() {
    console.log('\n=== Test 1: User Login ===');

    const result = await makeRequest('post', '/api/auth/login', TEST_USER);

    if (result.success && result.data.success && result.data.data.accessToken) {
        authToken = result.data.data.accessToken;
        logTest('Login', true, `Token received: ${authToken.substring(0, 20)}...`);
        return true;
    } else {
        logTest('Login', false, JSON.stringify(result.error));
        return false;
    }
}

// Test 2: Get user's complaints (should work with auth)
async function testGetMyComplaints() {
    console.log('\n=== Test 2: Get My Complaints ===');

    const result = await makeRequest('get', '/api/complaints');

    if (result.success && result.data.success) {
        const complaints = result.data.data.complaints || [];
        const pagination = result.data.data.pagination;

        logTest(
            'Get My Complaints',
            true,
            `Found ${complaints.length} complaints. Pagination: ${JSON.stringify(pagination)}`
        );

        // Verify data format
        if (complaints.length > 0) {
            const complaint = complaints[0];
            console.log('\n  Sample complaint structure:');
            console.log(`    - id: ${complaint.id}`);
            console.log(`    - title: ${complaint.title}`);
            console.log(`    - status: ${complaint.status}`);
            console.log(`    - location: ${complaint.location}`);
            console.log(`    - imageUrls: ${JSON.stringify(complaint.imageUrls)}`);
            console.log(`    - voiceNoteUrl: ${complaint.voiceNoteUrl}`);
            console.log(`    - createdAt: ${complaint.createdAt}`);

            testComplaintId = complaint.id;
        }

        return true;
    } else {
        logTest('Get My Complaints', false, JSON.stringify(result.error));
        return false;
    }
}

// Test 3: Verify authentication is required
async function testAuthRequired() {
    console.log('\n=== Test 3: Authentication Required ===');

    const tempToken = authToken;
    authToken = null; // Remove token temporarily

    const result = await makeRequest('get', '/api/complaints');

    authToken = tempToken; // Restore token

    if (!result.success && result.status === 401) {
        logTest('Auth Required', true, 'Correctly rejected unauthenticated request');
        return true;
    } else {
        logTest('Auth Required', false, 'Should have rejected unauthenticated request');
        return false;
    }
}

// Test 4: Get complaint by ID
async function testGetComplaintById() {
    console.log('\n=== Test 4: Get Complaint by ID ===');

    if (!testComplaintId) {
        logTest('Get Complaint by ID', false, 'No complaint ID available for testing');
        return false;
    }

    const result = await makeRequest('get', `/api/complaints/${testComplaintId}`);

    if (result.success && result.data.success) {
        const complaint = result.data.data.complaint;

        logTest(
            'Get Complaint by ID',
            true,
            `Retrieved complaint #${complaint.id}: ${complaint.title}`
        );

        // Verify complete data structure
        console.log('\n  Complete complaint data:');
        console.log(`    - id: ${complaint.id}`);
        console.log(`    - title: ${complaint.title}`);
        console.log(`    - description: ${complaint.description.substring(0, 50)}...`);
        console.log(`    - status: ${complaint.status}`);
        console.log(`    - priority: ${complaint.priority}`);
        console.log(`    - location: ${complaint.location}`);
        console.log(`    - imageUrls: ${JSON.stringify(complaint.imageUrls)}`);
        console.log(`    - voiceNoteUrl: ${complaint.voiceNoteUrl}`);
        console.log(`    - userId: ${complaint.userId}`);
        console.log(`    - createdAt: ${complaint.createdAt}`);
        console.log(`    - updatedAt: ${complaint.updatedAt}`);

        return true;
    } else {
        logTest('Get Complaint by ID', false, JSON.stringify(result.error));
        return false;
    }
}

// Test 5: Verify status enum values
async function testStatusEnum() {
    console.log('\n=== Test 5: Status Enum Values ===');

    const result = await makeRequest('get', '/api/complaints');

    if (result.success && result.data.success) {
        const complaints = result.data.data.complaints || [];
        const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

        let allValid = true;
        const foundStatuses = new Set();

        complaints.forEach(complaint => {
            foundStatuses.add(complaint.status);
            if (!validStatuses.includes(complaint.status)) {
                allValid = false;
                console.log(`  Invalid status found: ${complaint.status}`);
            }
        });

        logTest(
            'Status Enum Values',
            allValid,
            `Found statuses: ${Array.from(foundStatuses).join(', ')}`
        );

        return allValid;
    } else {
        logTest('Status Enum Values', false, 'Could not fetch complaints');
        return false;
    }
}

// Test 6: Test pagination
async function testPagination() {
    console.log('\n=== Test 6: Pagination Support ===');

    const result = await makeRequest('get', '/api/complaints?page=1&limit=5');

    if (result.success && result.data.success) {
        const pagination = result.data.data.pagination;

        const hasRequiredFields =
            pagination.page !== undefined &&
            pagination.limit !== undefined &&
            pagination.total !== undefined &&
            pagination.totalPages !== undefined;

        logTest(
            'Pagination Support',
            hasRequiredFields,
            `Pagination: page=${pagination.page}, limit=${pagination.limit}, total=${pagination.total}, totalPages=${pagination.totalPages}`
        );

        return hasRequiredFields;
    } else {
        logTest('Pagination Support', false, JSON.stringify(result.error));
        return false;
    }
}

// Test 7: Test filtering by status
async function testStatusFilter() {
    console.log('\n=== Test 7: Filter by Status ===');

    const result = await makeRequest('get', '/api/complaints?status=PENDING');

    if (result.success && result.data.success) {
        const complaints = result.data.data.complaints || [];
        const allPending = complaints.every(c => c.status === 'PENDING');

        logTest(
            'Filter by Status',
            allPending,
            `Found ${complaints.length} PENDING complaints`
        );

        return allPending;
    } else {
        logTest('Filter by Status', false, JSON.stringify(result.error));
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('='.repeat(60));
    console.log('COMPLAINT API INTEGRATION TESTS');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);

    const results = [];

    // Run tests in sequence
    results.push(await testLogin());

    if (results[0]) {
        // Only run other tests if login succeeded
        results.push(await testGetMyComplaints());
        results.push(await testAuthRequired());
        results.push(await testGetComplaintById());
        results.push(await testStatusEnum());
        results.push(await testPagination());
        results.push(await testStatusFilter());
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log(`\nPassed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('\n✓ All tests passed!');
        process.exit(0);
    } else {
        console.log('\n✗ Some tests failed');
        process.exit(1);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('\nFatal error running tests:', error);
    process.exit(1);
});
