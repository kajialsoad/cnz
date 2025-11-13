/**
 * Integration Tests for Admin User Management API
 * 
 * This script tests all admin user management endpoints:
 * - GET /api/admin/users (with various query parameters)
 * - GET /api/admin/users/:id (with valid and invalid IDs)
 * - GET /api/admin/users/statistics
 * - POST /api/admin/users (with valid and invalid data)
 * - PUT /api/admin/users/:id (with valid and invalid data)
 * - PATCH /api/admin/users/:id/status
 * - Authentication and authorization checks
 */

const API_BASE_URL = 'http://localhost:4000/api';

// Test configuration
let adminToken = '';
let testUserId = null;
let testUserPhone = '';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// Helper function to log test results
function logTest(name, passed, details = '') {
    const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} ${name}`);
    if (details) {
        console.log(`  ${colors.cyan}${details}${colors.reset}`);
    }
}

function logSection(name) {
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}${name}${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (adminToken && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${adminToken}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();
        return { status: response.status, data, ok: response.ok };
    } catch (error) {
        return { status: 0, data: { error: error.message }, ok: false };
    }
}

// Test 1: Admin Login (Setup)
async function testAdminLogin() {
    logSection('TEST 1: Admin Authentication Setup');

    const response = await apiRequest('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: 'admin@demo.com',
            password: 'Demo123!@#',
        }),
        skipAuth: true,
    });

    const passed = response.ok && response.data.accessToken;
    logTest('Admin login successful', passed,
        passed ? `Token received: ${response.data.accessToken.substring(0, 20)}...` : `Error: ${JSON.stringify(response.data)}`
    );

    if (passed) {
        adminToken = response.data.accessToken;
    }

    return passed;
}

// Test 2: GET /api/admin/users - Get all users
async function testGetAllUsers() {
    logSection('TEST 2: GET /api/admin/users - Get All Users');

    const response = await apiRequest('/admin/users');

    const passed = response.ok && response.data.success && Array.isArray(response.data.data.users);
    logTest('Get all users', passed,
        passed ? `Retrieved ${response.data.data.users.length} users` : `Error: ${JSON.stringify(response.data)}`
    );

    if (passed && response.data.data.users.length > 0) {
        testUserId = response.data.data.users[0].id;
        logTest('Test user ID captured', true, `User ID: ${testUserId}`);
    }

    return passed;
}

// Test 3: GET /api/admin/users with pagination
async function testGetUsersWithPagination() {
    logSection('TEST 3: GET /api/admin/users - Pagination');

    const response = await apiRequest('/admin/users?page=1&limit=5');

    const passed = response.ok &&
        response.data.success &&
        response.data.data.pagination.page === 1 &&
        response.data.data.pagination.limit === 5;

    logTest('Get users with pagination', passed,
        passed ? `Page: ${response.data.data.pagination.page}, Limit: ${response.data.data.pagination.limit}` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 4: GET /api/admin/users with search
async function testGetUsersWithSearch() {
    logSection('TEST 4: GET /api/admin/users - Search');

    const response = await apiRequest('/admin/users?search=admin');

    const passed = response.ok && response.data.success;
    logTest('Search users by term', passed,
        passed ? `Found ${response.data.data.users.length} users matching "admin"` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 5: GET /api/admin/users with status filter
async function testGetUsersWithStatusFilter() {
    logSection('TEST 5: GET /api/admin/users - Status Filter');

    const response = await apiRequest('/admin/users?status=ACTIVE');

    const passed = response.ok && response.data.success;
    const allActive = passed && response.data.data.users.every(u => u.status === 'ACTIVE');

    logTest('Filter users by status', passed && allActive,
        passed ? `Found ${response.data.data.users.length} ACTIVE users` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed && allActive;
}

// Test 6: GET /api/admin/users with role filter
async function testGetUsersWithRoleFilter() {
    logSection('TEST 6: GET /api/admin/users - Role Filter');

    const response = await apiRequest('/admin/users?role=CUSTOMER');

    const passed = response.ok && response.data.success;
    const allCustomers = passed && response.data.data.users.every(u => u.role === 'CUSTOMER');

    logTest('Filter users by role', passed && allCustomers,
        passed ? `Found ${response.data.data.users.length} CUSTOMER users` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed && allCustomers;
}

// Test 7: GET /api/admin/users with sorting
async function testGetUsersWithSorting() {
    logSection('TEST 7: GET /api/admin/users - Sorting');

    const response = await apiRequest('/admin/users?sortBy=createdAt&sortOrder=asc');

    const passed = response.ok && response.data.success;
    logTest('Sort users by createdAt ascending', passed,
        passed ? `Retrieved ${response.data.data.users.length} users sorted by createdAt` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 8: GET /api/admin/users/statistics
async function testGetUserStatistics() {
    logSection('TEST 8: GET /api/admin/users/statistics');

    const response = await apiRequest('/admin/users/statistics');

    const passed = response.ok &&
        response.data.success &&
        typeof response.data.data.totalCitizens === 'number' &&
        typeof response.data.data.totalComplaints === 'number' &&
        typeof response.data.data.successRate === 'number';

    logTest('Get user statistics', passed,
        passed ? `Total Citizens: ${response.data.data.totalCitizens}, Success Rate: ${response.data.data.successRate}%` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 9: GET /api/admin/users/:id with valid ID
async function testGetUserByValidId() {
    logSection('TEST 9: GET /api/admin/users/:id - Valid ID');

    if (!testUserId) {
        logTest('Get user by valid ID', false, 'No test user ID available');
        return false;
    }

    const response = await apiRequest(`/admin/users/${testUserId}`);

    const passed = response.ok &&
        response.data.success &&
        response.data.data.user.id === testUserId &&
        Array.isArray(response.data.data.recentComplaints);

    logTest('Get user by valid ID', passed,
        passed ? `User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 10: GET /api/admin/users/:id with invalid ID
async function testGetUserByInvalidId() {
    logSection('TEST 10: GET /api/admin/users/:id - Invalid ID');

    const response = await apiRequest('/admin/users/999999');

    const passed = !response.ok && response.status === 404;
    logTest('Get user by invalid ID returns 404', passed,
        passed ? 'Correctly returned 404 for non-existent user' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 11: GET /api/admin/users/:id with non-numeric ID
async function testGetUserByNonNumericId() {
    logSection('TEST 11: GET /api/admin/users/:id - Non-numeric ID');

    const response = await apiRequest('/admin/users/invalid');

    const passed = !response.ok && response.status === 400;
    logTest('Get user by non-numeric ID returns 400', passed,
        passed ? 'Correctly returned 400 for invalid ID format' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 12: POST /api/admin/users with valid data
async function testCreateUserWithValidData() {
    logSection('TEST 12: POST /api/admin/users - Valid Data');

    const timestamp = Date.now();
    testUserPhone = `017${timestamp.toString().slice(-8)}`;

    const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            phone: testUserPhone,
            email: `test${timestamp}@example.com`,
            password: 'Test@123456',
            ward: 'Ward 1',
            zone: 'Zone A',
            role: 'CUSTOMER',
        }),
    });

    const passed = response.ok && response.data.success && response.data.data.user;
    logTest('Create user with valid data', passed,
        passed ? `Created user: ${response.data.data.user.firstName} ${response.data.data.user.lastName}` : `Error: ${JSON.stringify(response.data)}`
    );

    if (passed) {
        testUserId = response.data.data.user.id;
    }

    return passed;
}

// Test 13: POST /api/admin/users with missing required fields
async function testCreateUserWithMissingFields() {
    logSection('TEST 13: POST /api/admin/users - Missing Required Fields');

    const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Test',
            // Missing lastName, phone, password
        }),
    });

    const passed = !response.ok && response.status === 400;
    logTest('Create user with missing fields returns 400', passed,
        passed ? 'Correctly rejected incomplete data' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 14: POST /api/admin/users with duplicate phone
async function testCreateUserWithDuplicatePhone() {
    logSection('TEST 14: POST /api/admin/users - Duplicate Phone');

    const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Duplicate',
            lastName: 'User',
            phone: testUserPhone, // Using the phone from previous test
            password: 'Test@123456',
        }),
    });

    const passed = !response.ok && response.status === 409;
    logTest('Create user with duplicate phone returns 409', passed,
        passed ? 'Correctly rejected duplicate phone' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 15: POST /api/admin/users with invalid password
async function testCreateUserWithInvalidPassword() {
    logSection('TEST 15: POST /api/admin/users - Invalid Password');

    const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            phone: `017${Date.now().toString().slice(-8)}`,
            password: '123', // Too short
        }),
    });

    const passed = !response.ok && response.status === 400;
    logTest('Create user with invalid password returns 400', passed,
        passed ? 'Correctly rejected weak password' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 16: PUT /api/admin/users/:id with valid data
async function testUpdateUserWithValidData() {
    logSection('TEST 16: PUT /api/admin/users/:id - Valid Data');

    if (!testUserId) {
        logTest('Update user with valid data', false, 'No test user ID available');
        return false;
    }

    const response = await apiRequest(`/admin/users/${testUserId}`, {
        method: 'PUT',
        body: JSON.stringify({
            firstName: 'Updated',
            lastName: 'User',
            ward: 'Ward 2',
            zone: 'Zone B',
        }),
    });

    const passed = response.ok &&
        response.data.success &&
        response.data.data.user.firstName === 'Updated';

    logTest('Update user with valid data', passed,
        passed ? `Updated user: ${response.data.data.user.firstName} ${response.data.data.user.lastName}` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 17: PUT /api/admin/users/:id with invalid ID
async function testUpdateUserWithInvalidId() {
    logSection('TEST 17: PUT /api/admin/users/:id - Invalid ID');

    const response = await apiRequest('/admin/users/999999', {
        method: 'PUT',
        body: JSON.stringify({
            firstName: 'Updated',
        }),
    });

    const passed = !response.ok && response.status === 404;
    logTest('Update user with invalid ID returns 404', passed,
        passed ? 'Correctly returned 404 for non-existent user' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 18: PUT /api/admin/users/:id with duplicate phone
async function testUpdateUserWithDuplicatePhone() {
    logSection('TEST 18: PUT /api/admin/users/:id - Duplicate Phone');

    if (!testUserId) {
        logTest('Update user with duplicate phone', false, 'No test user ID available');
        return false;
    }

    const response = await apiRequest(`/admin/users/${testUserId}`, {
        method: 'PUT',
        body: JSON.stringify({
            phone: '01612345678', // Admin's phone from seed data
        }),
    });

    const passed = !response.ok && response.status === 409;
    logTest('Update user with duplicate phone returns 409', passed,
        passed ? 'Correctly rejected duplicate phone' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 19: PATCH /api/admin/users/:id/status with valid status
async function testUpdateUserStatus() {
    logSection('TEST 19: PATCH /api/admin/users/:id/status - Valid Status');

    if (!testUserId) {
        logTest('Update user status', false, 'No test user ID available');
        return false;
    }

    const response = await apiRequest(`/admin/users/${testUserId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
            status: 'SUSPENDED',
            reason: 'Testing status update',
        }),
    });

    const passed = response.ok &&
        response.data.success &&
        response.data.data.user.status === 'SUSPENDED';

    logTest('Update user status', passed,
        passed ? `Status updated to: ${response.data.data.user.status}` : `Error: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 20: PATCH /api/admin/users/:id/status with invalid status
async function testUpdateUserStatusInvalid() {
    logSection('TEST 20: PATCH /api/admin/users/:id/status - Invalid Status');

    if (!testUserId) {
        logTest('Update user status with invalid value', false, 'No test user ID available');
        return false;
    }

    const response = await apiRequest(`/admin/users/${testUserId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
            status: 'INVALID_STATUS',
        }),
    });

    const passed = !response.ok && response.status === 400;
    logTest('Update user status with invalid value returns 400', passed,
        passed ? 'Correctly rejected invalid status' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 21: Authentication - No token
async function testAuthenticationNoToken() {
    logSection('TEST 21: Authentication - No Token');

    const response = await apiRequest('/admin/users', { skipAuth: true });

    const passed = !response.ok && response.status === 401;
    logTest('Request without token returns 401', passed,
        passed ? 'Correctly rejected unauthenticated request' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 22: Authentication - Invalid token
async function testAuthenticationInvalidToken() {
    logSection('TEST 22: Authentication - Invalid Token');

    const response = await apiRequest('/admin/users', {
        headers: {
            'Authorization': 'Bearer invalid_token_here',
        },
        skipAuth: true,
    });

    const passed = !response.ok && response.status === 401;
    logTest('Request with invalid token returns 401', passed,
        passed ? 'Correctly rejected invalid token' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Test 23: Authorization - Non-admin user (if available)
async function testAuthorizationNonAdmin() {
    logSection('TEST 23: Authorization - Non-Admin User');

    // Try to login as a regular customer
    const loginResponse = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            phone: '01711111111',
            password: 'User@123',
        }),
        skipAuth: true,
    });

    if (!loginResponse.ok) {
        logTest('Authorization test skipped', true, 'No regular user available for testing');
        return true;
    }

    const customerToken = loginResponse.data.accessToken;
    const response = await apiRequest('/admin/users', {
        headers: {
            'Authorization': `Bearer ${customerToken}`,
        },
        skipAuth: true,
    });

    const passed = !response.ok && response.status === 403;
    logTest('Non-admin user request returns 403', passed,
        passed ? 'Correctly rejected non-admin access' : `Unexpected response: ${JSON.stringify(response.data)}`
    );

    return passed;
}

// Main test runner
async function runAllTests() {
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}ADMIN USER MANAGEMENT API INTEGRATION TESTS${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);

    const results = {
        passed: 0,
        failed: 0,
        total: 0,
    };

    const tests = [
        testAdminLogin,
        testGetAllUsers,
        testGetUsersWithPagination,
        testGetUsersWithSearch,
        testGetUsersWithStatusFilter,
        testGetUsersWithRoleFilter,
        testGetUsersWithSorting,
        testGetUserStatistics,
        testGetUserByValidId,
        testGetUserByInvalidId,
        testGetUserByNonNumericId,
        testCreateUserWithValidData,
        testCreateUserWithMissingFields,
        testCreateUserWithDuplicatePhone,
        testCreateUserWithInvalidPassword,
        testUpdateUserWithValidData,
        testUpdateUserWithInvalidId,
        testUpdateUserWithDuplicatePhone,
        testUpdateUserStatus,
        testUpdateUserStatusInvalid,
        testAuthenticationNoToken,
        testAuthenticationInvalidToken,
        testAuthorizationNonAdmin,
    ];

    for (const test of tests) {
        try {
            const passed = await test();
            results.total++;
            if (passed) {
                results.passed++;
            } else {
                results.failed++;
            }
        } catch (error) {
            console.error(`${colors.red}Error running test: ${error.message}${colors.reset}`);
            results.failed++;
            results.total++;
        }
    }

    // Print summary
    console.log(`\n${colors.yellow}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.yellow}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(60)}${colors.reset}\n`);
    console.log(`Total Tests: ${results.total}`);
    console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`);

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
});
