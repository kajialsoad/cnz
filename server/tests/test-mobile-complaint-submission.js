/**
 * Test Mobile App Complaint Submission
 * 
 * This script tests the complete flow of submitting complaints from the mobile app
 * with all 8 categories and 22 subcategories, and verifies they appear correctly
 * in the admin panel.
 * 
 * Tests:
 * 1. Submit complaints with all 8 categories
 * 2. Submit complaints with all 22 subcategories
 * 3. Test error handling for invalid categories
 * 4. Verify complaints appear correctly in admin panel
 */

const axios = require('axios');
const FormData = require('form-data');

// Configuration - Using existing demo user
const BASE_URL = 'http://localhost:4000';
const TEST_USER_EMAIL = 'customer1@demo.com';
const TEST_USER_PASSWORD = 'Demo123!@#';
const ADMIN_EMAIL = 'admin@cleancare.com';
const ADMIN_PASSWORD = 'Admin123!@#';

// Category structure from mobile app
const CATEGORIES = [
    {
        id: 'home',
        name: 'Home',
        subcategories: ['not_collecting_waste', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'road_environment',
        name: 'Road & Environment',
        subcategories: ['road_waste', 'water_logging', 'manhole_issue']
    },
    {
        id: 'business',
        name: 'Business',
        subcategories: ['not_collecting', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'office',
        name: 'Office',
        subcategories: ['not_collecting', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'education',
        name: 'Education',
        subcategories: ['not_collecting', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'hospital',
        name: 'Hospital',
        subcategories: ['not_collecting', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'religious',
        name: 'Religious Place',
        subcategories: ['not_collecting', 'worker_behavior', 'billing_issue']
    },
    {
        id: 'events',
        name: 'Events',
        subcategories: ['event_description']
    }
];

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

let userToken = null;
let adminToken = null;
const createdComplaintIds = [];

// Helper function to log test results
function logTest(testName, passed, message = '') {
    if (passed) {
        console.log(`✅ PASS: ${testName}`);
        testResults.passed++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        console.log(`   Error: ${message}`);
        testResults.failed++;
        testResults.errors.push({ test: testName, error: message });
    }
}

// Helper function to login with demo user
async function setupTestUser() {
    try {
        console.log('\n📝 Logging in with demo user...');

        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: TEST_USER_EMAIL,
            password: TEST_USER_PASSWORD
        });

        if (loginResponse.data.success) {
            userToken = loginResponse.data.data?.token ||
                loginResponse.data.data?.accessToken ||
                loginResponse.data.token;
            console.log('✅ Demo user logged in successfully');
            return userToken !== null;
        }

        return false;
    } catch (error) {
        console.error('❌ Failed to login demo user:', error.response?.data || error.message);
        return false;
    }
}

// Helper function to login as admin
async function loginAsAdmin() {
    try {
        console.log('\n🔐 Logging in as admin...');

        const response = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (response.data.success) {
            adminToken = response.data.data?.token ||
                response.data.data?.accessToken ||
                response.data.token;
            console.log('✅ Admin logged in successfully');
            return adminToken !== null;
        }

        return false;
    } catch (error) {
        console.error('❌ Failed to login as admin:', error.response?.data || error.message);
        return false;
    }
}

// Test 1: Submit complaints with all 8 categories
async function testAllCategories() {
    console.log('\n\n🧪 TEST 1: Submit complaints with all 8 categories');
    console.log('='.repeat(60));

    for (const category of CATEGORIES) {
        try {
            // Use first subcategory for each category
            const subcategory = category.subcategories[0];

            const formData = new FormData();
            formData.append('description', `Test complaint for ${category.name} category`);
            formData.append('category', category.id);
            formData.append('subcategory', subcategory);
            formData.append('location[address]', '123 Test Street');
            formData.append('location[district]', 'Dhaka');
            formData.append('location[thana]', 'Dhanmondi');
            formData.append('location[ward]', '5');

            const response = await axios.post(
                `${BASE_URL}/api/complaints`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${userToken}`
                    }
                }
            );

            if (response.data.success) {
                // Response structure: { success, message, data: { complaint: {...} } }
                const complaint = response.data.data.complaint || response.data.data;
                createdComplaintIds.push(complaint.id);

                // Check if category was saved
                if (complaint.category === category.id) {
                    logTest(
                        `Submit complaint with category: ${category.name}`,
                        true
                    );
                } else {
                    logTest(
                        `Submit complaint with category: ${category.name}`,
                        false,
                        `Expected category '${category.id}', got '${complaint.category || 'undefined'}'`
                    );
                }
            } else {
                logTest(
                    `Submit complaint with category: ${category.name}`,
                    false,
                    'API returned success: false'
                );
            }
        } catch (error) {
            logTest(
                `Submit complaint with category: ${category.name}`,
                false,
                error.response?.data?.message || error.message
            );
        }
    }
}

// Test 2: Submit complaints with all subcategories
async function testAllSubcategories() {
    console.log('\n\n🧪 TEST 2: Submit complaints with all 22 subcategories');
    console.log('='.repeat(60));

    for (const category of CATEGORIES) {
        for (const subcategory of category.subcategories) {
            try {
                const formData = new FormData();
                formData.append('description', `Test complaint for ${category.name} - ${subcategory}`);
                formData.append('category', category.id);
                formData.append('subcategory', subcategory);
                formData.append('location[address]', '123 Test Street');
                formData.append('location[district]', 'Dhaka');
                formData.append('location[thana]', 'Dhanmondi');
                formData.append('location[ward]', '5');

                const response = await axios.post(
                    `${BASE_URL}/api/complaints`,
                    formData,
                    {
                        headers: {
                            ...formData.getHeaders(),
                            'Authorization': `Bearer ${userToken}`
                        }
                    }
                );

                if (response.data.success) {
                    const complaint = response.data.data.complaint || response.data.data;
                    createdComplaintIds.push(complaint.id);

                    if (complaint.category === category.id && complaint.subcategory === subcategory) {
                        logTest(
                            `Submit complaint with subcategory: ${category.name} - ${subcategory}`,
                            true
                        );
                    } else {
                        logTest(
                            `Submit complaint with subcategory: ${category.name} - ${subcategory}`,
                            false,
                            `Expected ${category.id}/${subcategory}, got ${complaint.category || 'undefined'}/${complaint.subcategory || 'undefined'}`
                        );
                    }
                } else {
                    logTest(
                        `Submit complaint with subcategory: ${category.name} - ${subcategory}`,
                        false,
                        'API returned success: false'
                    );
                }
            } catch (error) {
                logTest(
                    `Submit complaint with subcategory: ${category.name} - ${subcategory}`,
                    false,
                    error.response?.data?.message || error.message
                );
            }
        }
    }
}

// Test 3: Test error handling for invalid categories
async function testInvalidCategories() {
    console.log('\n\n🧪 TEST 3: Test error handling for invalid categories');
    console.log('='.repeat(60));

    // Test 3.1: Invalid category
    try {
        const formData = new FormData();
        formData.append('description', 'Test complaint with invalid category');
        formData.append('category', 'invalid_category');
        formData.append('subcategory', 'not_collecting');
        formData.append('location[address]', '123 Test Street');
        formData.append('location[district]', 'Dhaka');
        formData.append('location[thana]', 'Dhanmondi');
        formData.append('location[ward]', '5');

        await axios.post(
            `${BASE_URL}/api/complaints`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${userToken}`
                }
            }
        );

        logTest(
            'Reject complaint with invalid category',
            false,
            'Invalid category was accepted'
        );
    } catch (error) {
        const errorMessage = error.response?.data?.message || '';
        const isCorrectError = errorMessage.includes('Invalid category') ||
            errorMessage.includes('category') && errorMessage.includes('invalid');
        logTest(
            'Reject complaint with invalid category',
            isCorrectError,
            isCorrectError ? '' : `Wrong error message: ${errorMessage}`
        );
    }

    // Test 3.2: Invalid subcategory
    try {
        const formData = new FormData();
        formData.append('description', 'Test complaint with invalid subcategory');
        formData.append('category', 'home');
        formData.append('subcategory', 'invalid_subcategory');
        formData.append('location[address]', '123 Test Street');
        formData.append('location[district]', 'Dhaka');
        formData.append('location[thana]', 'Dhanmondi');
        formData.append('location[ward]', '5');

        await axios.post(
            `${BASE_URL}/api/complaints`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${userToken}`
                }
            }
        );

        logTest(
            'Reject complaint with invalid subcategory',
            false,
            'Invalid subcategory was accepted'
        );
    } catch (error) {
        const errorMessage = error.response?.data?.message || '';
        const isCorrectError = errorMessage.includes('Invalid') && errorMessage.includes('subcategory');
        logTest(
            'Reject complaint with invalid subcategory',
            isCorrectError,
            isCorrectError ? '' : `Wrong error message: ${errorMessage}`
        );
    }

    // Test 3.3: Wrong category-subcategory combination
    try {
        const formData = new FormData();
        formData.append('description', 'Test complaint with wrong combination');
        formData.append('category', 'home');
        formData.append('subcategory', 'road_waste'); // This belongs to road_environment
        formData.append('location[address]', '123 Test Street');
        formData.append('location[district]', 'Dhaka');
        formData.append('location[thana]', 'Dhanmondi');
        formData.append('location[ward]', '5');

        await axios.post(
            `${BASE_URL}/api/complaints`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${userToken}`
                }
            }
        );

        logTest(
            'Reject complaint with wrong category-subcategory combination',
            false,
            'Wrong combination was accepted'
        );
    } catch (error) {
        const errorMessage = error.response?.data?.message || '';
        const isCorrectError = errorMessage.includes('Invalid') &&
            (errorMessage.includes('combination') || errorMessage.includes('subcategory'));
        logTest(
            'Reject complaint with wrong category-subcategory combination',
            isCorrectError,
            isCorrectError ? '' : `Wrong error message: ${errorMessage}`
        );
    }
}

// Test 4: Verify complaints appear correctly in admin panel
async function testAdminPanelDisplay() {
    console.log('\n\n🧪 TEST 4: Verify complaints appear correctly in admin panel');
    console.log('='.repeat(60));

    // Test 4.1: Fetch all complaints as admin
    try {
        const response = await axios.get(
            `${BASE_URL}/api/admin/complaints`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (response.data.success) {
            const complaints = response.data.data.complaints || [];
            logTest(
                'Fetch complaints in admin panel',
                complaints.length > 0,
                complaints.length === 0 ? 'No complaints found' : ''
            );

            // Verify category data is present
            const complaintsWithCategory = complaints.filter(c => c.category && c.subcategory);
            logTest(
                'Complaints have category and subcategory data',
                complaintsWithCategory.length > 0,
                complaintsWithCategory.length === 0 ? 'No complaints with category data' : ''
            );
        } else {
            logTest(
                'Fetch complaints in admin panel',
                false,
                'Failed to fetch complaints'
            );
        }
    } catch (error) {
        logTest(
            'Fetch complaints in admin panel',
            false,
            error.response?.data?.message || error.message
        );
    }

    // Test 4.2: Filter by category
    for (const category of CATEGORIES.slice(0, 3)) { // Test first 3 categories
        try {
            const response = await axios.get(
                `${BASE_URL}/api/admin/complaints?category=${category.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                }
            );

            if (response.data.success) {
                const complaints = response.data.data.complaints || [];
                const allMatchCategory = complaints.every(c => c.category === category.id);
                logTest(
                    `Filter complaints by category: ${category.name}`,
                    allMatchCategory,
                    allMatchCategory ? '' : 'Some complaints have wrong category'
                );
            } else {
                logTest(
                    `Filter complaints by category: ${category.name}`,
                    false,
                    'Failed to filter complaints'
                );
            }
        } catch (error) {
            logTest(
                `Filter complaints by category: ${category.name}`,
                false,
                error.response?.data?.message || error.message
            );
        }
    }

    // Test 4.3: Test category analytics
    try {
        const response = await axios.get(
            `${BASE_URL}/api/admin/analytics/categories`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (response.data.success) {
            const stats = response.data.data;
            const hasStats = Array.isArray(stats) && stats.length > 0;
            logTest(
                'Category analytics endpoint returns data',
                hasStats,
                hasStats ? '' : 'No category statistics found'
            );

            if (hasStats) {
                const hasRequiredFields = stats.every(s =>
                    s.category && s.count !== undefined
                );
                logTest(
                    'Category statistics have required fields',
                    hasRequiredFields,
                    hasRequiredFields ? '' : 'Missing required fields in stats'
                );
            }
        } else {
            logTest(
                'Category analytics endpoint returns data',
                false,
                'Failed to fetch category analytics'
            );
        }
    } catch (error) {
        logTest(
            'Category analytics endpoint returns data',
            false,
            error.response?.data?.message || error.message
        );
    }
}

// Print summary
function printSummary() {
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);

    if (testResults.errors.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.errors.forEach((err, index) => {
            console.log(`${index + 1}. ${err.test}`);
            console.log(`   Error: ${err.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Created ${createdComplaintIds.length} test complaints`);
    console.log('='.repeat(60));
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Mobile App Complaint Submission Tests');
    console.log('='.repeat(60));

    // Setup
    const userSetup = await setupTestUser();
    if (!userSetup) {
        console.error('❌ Failed to login demo user. Aborting tests.');
        return;
    }

    const adminSetup = await loginAsAdmin();
    if (!adminSetup) {
        console.error('❌ Failed to login as admin. Some tests will be skipped.');
    }

    // Run tests
    await testAllCategories();
    await testAllSubcategories();
    await testInvalidCategories();

    if (adminToken) {
        await testAdminPanelDisplay();
    } else {
        console.log('\n⚠️  Skipping admin panel tests (admin login failed)');
    }

    // Print summary
    printSummary();

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});
