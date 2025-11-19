/**
 * Test complaint creation and filtering with categories
 * This test creates a test user, then tests complaint operations
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:4000/api';

let authToken = '';
let testUserId = null;
let testComplaintIds = [];

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

// Setup: Create test user
async function setupTestUser() {
    console.log('\n=== Setup: Creating Test User ===');

    try {
        // Check if test user already exists
        let user = await prisma.user.findUnique({
            where: { phone: '01700000001' }
        });

        if (user) {
            console.log('Test user already exists, deleting old user...');
            await prisma.user.delete({ where: { id: user.id } });
        }

        // Create new test user
        const hashedPassword = await bcrypt.hash('test123', 10);
        user = await prisma.user.create({
            data: {
                firstName: 'Test',
                lastName: 'User',
                phone: '01700000001',
                passwordHash: hashedPassword,
                role: 'CUSTOMER',
                status: 'ACTIVE',
                emailVerified: true
            }
        });

        testUserId = user.id;
        logTest('Create Test User', true, `User created with ID: ${testUserId}`);
        return true;
    } catch (error) {
        logTest('Create Test User', false, error.message);
        return false;
    }
}

// Test 1: Login
async function testLogin() {
    console.log('\n=== Test 1: User Login ===');
    const result = await makeRequest('post', '/auth/login', {
        phone: '01700000001',
        password: 'test123'
    });

    if (result.success && result.data.data?.token) {
        authToken = result.data.data.token;
        logTest('Login', true, 'Successfully authenticated');
        return true;
    } else {
        const errorMsg = result.error ? JSON.stringify(result.error, null, 2) : 'Unknown error';
        logTest('Login', false, `Failed: ${errorMsg}`);
        return false;
    }
}

// Test 2: Create complaint with valid category
async function testCreateComplaintWithCategory() {
    console.log('\n=== Test 2: Create Complaint with Valid Category ===');

    const complaintData = {
        description: 'Test complaint - waste not being collected from my home',
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
        const complaint = result.data.data.complaint;
        testComplaintIds.push(complaint.id);

        if (complaint.category === 'home' && complaint.subcategory === 'not_collecting_waste') {
            logTest('Create Complaint with Category', true,
                `Complaint ID: ${complaint.id}, Category: ${complaint.category}, Subcategory: ${complaint.subcategory}`);
            return true;
        }
    }

    logTest('Create Complaint with Category', false,
        `Failed: ${JSON.stringify(result.error)}`);
    return false;
}

// Test 3: Create complaint with invalid category combination
async function testInvalidCategoryCombination() {
    console.log('\n=== Test 3: Invalid Category Combination ===');

    const complaintData = {
        description: 'Test complaint with invalid combination',
        category: 'home',
        subcategory: 'road_waste', // Wrong subcategory for home
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
            'Correctly rejected invalid combination');
        return true;
    }

    logTest('Invalid Category Validation', false,
        'Should have rejected invalid combination');
    return false;
}

// Test 4: Create multiple complaints with different categories
async function testMultipleCategories() {
    console.log('\n=== Test 4: Create Multiple Complaints with Different Categories ===');

    const testCases = [
        { category: 'road_environment', subcategory: 'road_waste', desc: 'Road waste issue' },
        { category: 'business', subcategory: 'not_collecting', desc: 'Business waste not collected' },
        { category: 'office', subcategory: 'worker_behavior', desc: 'Worker behavior issue' }
    ];

    let passCount = 0;

    for (const testCase of testCases) {
        const complaintData = {
            description: testCase.desc,
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

        if (result.success && result.data.data?.complaint) {
            testComplaintIds.push(result.data.data.complaint.id);
            console.log(`   ✅ ${testCase.category} / ${testCase.subcategory}`);
            passCount++;
        } else {
            console.log(`   ❌ ${testCase.category} / ${testCase.subcategory}`);
        }
    }

    const allPassed = passCount === testCases.length;
    logTest('Multiple Categories', allPassed,
        `${passCount}/${testCases.length} complaints created`);
    return allPassed;
}

// Test 5: Filter by category
async function testFilterByCategory() {
    console.log('\n=== Test 5: Filter Complaints by Category ===');

    const result = await makeRequest('get', '/complaints?category=home');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allHomeCategory = complaints.every(c => c.category === 'home');

        if (allHomeCategory && complaints.length > 0) {
            logTest('Filter by Category', true,
                `Found ${complaints.length} complaints with category 'home'`);
            return true;
        }
    }

    logTest('Filter by Category', false,
        `Failed: ${JSON.stringify(result.error)}`);
    return false;
}

// Test 6: Filter by subcategory
async function testFilterBySubcategory() {
    console.log('\n=== Test 6: Filter Complaints by Subcategory ===');

    const result = await makeRequest('get', '/complaints?subcategory=not_collecting_waste');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allCorrect = complaints.every(c => c.subcategory === 'not_collecting_waste');

        if (allCorrect && complaints.length > 0) {
            logTest('Filter by Subcategory', true,
                `Found ${complaints.length} complaints with subcategory 'not_collecting_waste'`);
            return true;
        }
    }

    logTest('Filter by Subcategory', false,
        `Failed: ${JSON.stringify(result.error)}`);
    return false;
}

// Test 7: Filter by both category and subcategory
async function testFilterByCategoryAndSubcategory() {
    console.log('\n=== Test 7: Filter by Category AND Subcategory ===');

    const result = await makeRequest('get', '/complaints?category=home&subcategory=not_collecting_waste');

    if (result.success && result.data.data?.complaints) {
        const complaints = result.data.data.complaints;
        const allCorrect = complaints.every(c =>
            c.category === 'home' && c.subcategory === 'not_collecting_waste'
        );

        if (allCorrect && complaints.length > 0) {
            logTest('Filter by Category and Subcategory', true,
                `Found ${complaints.length} matching complaints`);
            return true;
        }
    }

    logTest('Filter by Category and Subcategory', false,
        `Failed: ${JSON.stringify(result.error)}`);
    return false;
}

// Cleanup: Delete test data
async function cleanup() {
    console.log('\n=== Cleanup: Removing Test Data ===');

    try {
        // Delete test complaints
        if (testComplaintIds.length > 0) {
            await prisma.complaint.deleteMany({
                where: { id: { in: testComplaintIds } }
            });
            console.log(`Deleted ${testComplaintIds.length} test complaints`);
        }

        // Delete test user
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } });
            console.log(`Deleted test user (ID: ${testUserId})`);
        }

        logTest('Cleanup', true, 'Test data removed successfully');
    } catch (error) {
        logTest('Cleanup', false, error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('=================================================');
    console.log('Complaint Category Integration Tests');
    console.log('=================================================');

    const results = [];

    try {
        // Setup
        const setupSuccess = await setupTestUser();
        if (!setupSuccess) {
            console.log('\n❌ Setup failed, aborting tests');
            return;
        }

        // Run tests
        results.push(await testLogin());

        if (results[0]) {
            results.push(await testCreateComplaintWithCategory());
            results.push(await testInvalidCategoryCombination());
            results.push(await testMultipleCategories());
            results.push(await testFilterByCategory());
            results.push(await testFilterBySubcategory());
            results.push(await testFilterByCategoryAndSubcategory());
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
    } finally {
        // Always cleanup
        await cleanup();
        await prisma.$disconnect();
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Test execution failed:', error);
    prisma.$disconnect();
    process.exit(1);
});
