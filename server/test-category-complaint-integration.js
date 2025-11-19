/**
 * Test script for category/subcategory complaint integration
 * Tests complaint creation with category validation and filtering
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test user credentials (you may need to adjust these)
const TEST_USER = {
    phone: '01712345678',
    password: 'test123'
};

let authToken = '';
let testComplaintId = null;

// Helper function to log test results
function logTest(testName, success, message) {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} - ${testName}`);
    if (message) console.log(`   ${message}`);
}

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            ...(data && { data })
        };
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Test 1: Login to get auth token
async function testLogin() {
    console.log('\n=== Test 1: User Login ===');
    const result = await makeRequest('post', '/auth/login', TEST_USER);

    if (result.success && result.data.data?.token) {
        authToken = result.data.data.token;
        logTest('Login', true, 'Successfully authenticated');
        return true;
    } else {
        logTest('Login', false, `Failed to login: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Test 2: Create complaint with valid category/subcategory
async function testCreateComplaintWithCategory() {
    console.log('\n=== Test 2: Create Complaint with Valid Category ===');

    const complaintData = {
        description: 'Test complaint with category - waste not being collected from my home',
        category: 'home',
        subcategory: 'not_collecting_waste',
        location: {
            address: '123 Test Street, Dhaka',
            district: 'Dhaka',
            thana: 'Gulshan',
            ward: '19'
        }
    };

    const result = await makeRequest('post', '/complaints', complaintData);

    if (result.success && result.data.data?.complaint) {
        testComplaintId = result.data.data.complaint.id;
        const complaint = result.data.data.complaint;

        if (complaint.category === 'home' && complaint.subcategory === 'not_collecting_waste') {
            logTest('Create Complaint with Category', true,
                `Complaint created with ID: ${testComplaintId}, Category: ${complaint.category}, Subcategory: ${complaint.subcategory}`);
            return true;
        } else {
            logTest('Create Complaint with Category', false,
                'Category/subcategory not stored correctly');
            return false;
        }
    } else {
        logTest('Create Complaint with Category', false,
            `Failed: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Test 3: Create complaint with invalid category/subcategory combination
async function testCreateComplaintWithInvalidCategory() {
    console.log('\n=== Test 3: Create Complaint with Invalid Category Combination ===');

    const complaintData = {
        description: 'Test complaint with invalid category combination',
        category: 'home',
        subcategory: 'road_waste', // This subcategory belongs to road_environment, not home
        location: {
            address: '123 Test Street, Dhaka',
            district: 'Dhaka',
            thana: 'Gulshan',
            ward: '19'
        }
    };

    const result = await makeRequest('post', '/complaints', complaintData);

    if (!result.success && result.error.message?.includes('Invalid category and subcategory combination')) {
        logTest('Invalid Category Validation', true,
            'Correctly rejected invalid category/subcategory combination');
        return true;
    } else {
        logTest('Invalid Category Validation', false,
            'Should have rejected invalid category/subcategory combination');
        return false;
    }
}

// Test 4: Create complaint without category (should fail)
async function testCreateComplaintWithoutCategory() {
    console.log('\n=== Test 4: Create Complaint without Category ===');

    const complaintData = {
        description: 'Test complaint without category',
        location: {
            address: '123 Test Street, Dhaka',
            district: 'Dhaka',
            thana: 'Gulshan',
            ward: '19'
        }
    };

    const result = await makeRequest('post', '/complaints', complaintData);

    if (!result.success && result.error.message?.includes('অভিযোগের ধরন নির্বাচন করুন')) {
        logTest('Missing Category Validation', true,
            'Correctly rejected complaint without category');
        return true;
    } else {
        logTest('Missing Category Validation', false,
            'Should have rejected complaint without category');
        return false;
    }
}

// Test 5: Filter complaints by category
async function testFilterByCategory() {
    console.log('\n=== Test 5: Filter Complaints by Category ===');

    const result = await makeRequest('get', '/complaints?category=home');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allHomeCategory = complaints.every(c => c.category === 'home');

        if (allHomeCategory) {
            logTest('Filter by Category', true,
                `Found ${complaints.length} complaints with category 'home'`);
            return true;
        } else {
            logTest('Filter by Category', false,
                'Some complaints have wrong category');
            return false;
        }
    } else {
        logTest('Filter by Category', false,
            `Failed: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Test 6: Filter complaints by subcategory
async function testFilterBySubcategory() {
    console.log('\n=== Test 6: Filter Complaints by Subcategory ===');

    const result = await makeRequest('get', '/complaints?subcategory=not_collecting_waste');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allCorrectSubcategory = complaints.every(c => c.subcategory === 'not_collecting_waste');

        if (allCorrectSubcategory) {
            logTest('Filter by Subcategory', true,
                `Found ${complaints.length} complaints with subcategory 'not_collecting_waste'`);
            return true;
        } else {
            logTest('Filter by Subcategory', false,
                'Some complaints have wrong subcategory');
            return false;
        }
    } else {
        logTest('Filter by Subcategory', false,
            `Failed: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Test 7: Filter complaints by both category and subcategory
async function testFilterByCategoryAndSubcategory() {
    console.log('\n=== Test 7: Filter Complaints by Category and Subcategory ===');

    const result = await makeRequest('get', '/complaints?category=home&subcategory=not_collecting_waste');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allCorrect = complaints.every(c =>
            c.category === 'home' && c.subcategory === 'not_collecting_waste'
        );

        if (allCorrect) {
            logTest('Filter by Category and Subcategory', true,
                `Found ${complaints.length} complaints matching both filters`);
            return true;
        } else {
            logTest('Filter by Category and Subcategory', false,
                'Some complaints do not match filters');
            return false;
        }
    } else {
        logTest('Filter by Category and Subcategory', false,
            `Failed: ${JSON.stringify(result.error)}`);
        return false;
    }
}

// Test 8: Test all category/subcategory combinations
async function testAllCategoryCombinations() {
    console.log('\n=== Test 8: Test Multiple Category Combinations ===');

    const testCases = [
        { category: 'road_environment', subcategory: 'road_waste' },
        { category: 'business', subcategory: 'not_collecting' },
        { category: 'office', subcategory: 'worker_behavior' },
        { category: 'education', subcategory: 'billing_issue' },
        { category: 'hospital', subcategory: 'not_collecting' },
        { category: 'religious', subcategory: 'worker_behavior' },
        { category: 'events', subcategory: 'event_description' }
    ];

    let passCount = 0;

    for (const testCase of testCases) {
        const complaintData = {
            description: `Test complaint for ${testCase.category} - ${testCase.subcategory}`,
            category: testCase.category,
            subcategory: testCase.subcategory,
            location: {
                address: '123 Test Street, Dhaka',
                district: 'Dhaka',
                thana: 'Gulshan',
                ward: '19'
            }
        };

        const result = await makeRequest('post', '/complaints', complaintData);

        if (result.success) {
            console.log(`   ✅ ${testCase.category} / ${testCase.subcategory}`);
            passCount++;
        } else {
            console.log(`   ❌ ${testCase.category} / ${testCase.subcategory}: ${result.error.message}`);
        }
    }

    const allPassed = passCount === testCases.length;
    logTest('Multiple Category Combinations', allPassed,
        `${passCount}/${testCases.length} combinations passed`);
    return allPassed;
}

// Main test runner
async function runTests() {
    console.log('=================================================');
    console.log('Category/Subcategory Complaint Integration Tests');
    console.log('=================================================');

    const results = [];

    // Run tests sequentially
    results.push(await testLogin());

    if (results[0]) { // Only continue if login succeeded
        results.push(await testCreateComplaintWithCategory());
        results.push(await testCreateComplaintWithInvalidCategory());
        results.push(await testCreateComplaintWithoutCategory());
        results.push(await testFilterByCategory());
        results.push(await testFilterBySubcategory());
        results.push(await testFilterByCategoryAndSubcategory());
        results.push(await testAllCategoryCombinations());
    }

    // Summary
    console.log('\n=================================================');
    console.log('Test Summary');
    console.log('=================================================');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`Total: ${passed}/${total} tests passed`);

    if (passed === total) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log(`\n⚠️  ${total - passed} test(s) failed`);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});
