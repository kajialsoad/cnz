/**
 * Test script for Notification API endpoints
 * 
 * This script tests all notification endpoints to verify they work correctly.
 * 
 * Prerequisites:
 * 1. Server must be running (npm run dev)
 * 2. You must have a valid user account
 * 3. Update the TEST_USER credentials below
 * 
 * Usage:
 * node test-notification-api.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:4000/api';
const TEST_USER = {
    email: 'test@example.com',  // Update with your test user
    password: 'password123'      // Update with your test password
};

let authToken = '';
let testNotificationId = null;

// Helper function to log test results
function logTest(testName, success, details = '') {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${testName}`);
    if (details) {
        console.log(`   ${details}`);
    }
    console.log('');
}

// Test 1: Login to get auth token
async function testLogin() {
    try {
        console.log('🔐 Test 1: User Login');
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);

        if (response.data.accessToken) {
            authToken = response.data.accessToken;
            logTest('Login', true, `Token received: ${authToken.substring(0, 20)}...`);
            return true;
        } else {
            logTest('Login', false, 'No access token in response');
            return false;
        }
    } catch (error) {
        logTest('Login', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 2: Get notifications (should require auth)
async function testGetNotifications() {
    try {
        console.log('📬 Test 2: Get Notifications');
        const response = await axios.get(`${BASE_URL}/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 1, limit: 20 }
        });

        if (response.data.success && response.data.data.notifications) {
            const count = response.data.data.notifications.length;
            const unreadCount = response.data.data.unreadCount;

            // Store first notification ID for later tests
            if (count > 0) {
                testNotificationId = response.data.data.notifications[0].id;
            }

            logTest('Get Notifications', true,
                `Retrieved ${count} notifications, ${unreadCount} unread`);
            return true;
        } else {
            logTest('Get Notifications', false, 'Invalid response structure');
            return false;
        }
    } catch (error) {
        logTest('Get Notifications', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 3: Get notifications without auth (should fail)
async function testGetNotificationsNoAuth() {
    try {
        console.log('🔒 Test 3: Get Notifications Without Auth (Should Fail)');
        await axios.get(`${BASE_URL}/notifications`);

        logTest('Get Notifications Without Auth', false, 'Should have been rejected');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            logTest('Get Notifications Without Auth', true, 'Correctly rejected unauthorized request');
            return true;
        } else {
            logTest('Get Notifications Without Auth', false, 'Wrong error status');
            return false;
        }
    }
}

// Test 4: Get unread count
async function testGetUnreadCount() {
    try {
        console.log('🔢 Test 4: Get Unread Count');
        const response = await axios.get(`${BASE_URL}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && typeof response.data.data.count === 'number') {
            logTest('Get Unread Count', true, `Unread count: ${response.data.data.count}`);
            return true;
        } else {
            logTest('Get Unread Count', false, 'Invalid response structure');
            return false;
        }
    } catch (error) {
        logTest('Get Unread Count', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 5: Mark notification as read (if we have one)
async function testMarkAsRead() {
    if (!testNotificationId) {
        console.log('⏭️  Test 5: Mark Notification as Read - SKIPPED (No notifications available)');
        console.log('');
        return true;
    }

    try {
        console.log('✔️  Test 5: Mark Notification as Read');
        const response = await axios.patch(
            `${BASE_URL}/notifications/${testNotificationId}/read`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && response.data.data.isRead === true) {
            logTest('Mark Notification as Read', true, `Notification ${testNotificationId} marked as read`);
            return true;
        } else {
            logTest('Mark Notification as Read', false, 'Invalid response structure');
            return false;
        }
    } catch (error) {
        logTest('Mark Notification as Read', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 6: Mark all as read
async function testMarkAllAsRead() {
    try {
        console.log('✔️✔️ Test 6: Mark All Notifications as Read');
        const response = await axios.patch(
            `${BASE_URL}/notifications/read-all`,
            {},
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (response.data.success && typeof response.data.data.updatedCount === 'number') {
            logTest('Mark All as Read', true, `${response.data.data.updatedCount} notifications marked as read`);
            return true;
        } else {
            logTest('Mark All as Read', false, 'Invalid response structure');
            return false;
        }
    } catch (error) {
        logTest('Mark All as Read', false, error.response?.data?.message || error.message);
        return false;
    }
}

// Test 7: Pagination validation
async function testPaginationValidation() {
    try {
        console.log('📄 Test 7: Pagination Validation (Invalid Params)');
        await axios.get(`${BASE_URL}/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { page: 0, limit: 200 }  // Invalid: page < 1, limit > 100
        });

        logTest('Pagination Validation', false, 'Should have rejected invalid params');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            logTest('Pagination Validation', true, 'Correctly rejected invalid pagination params');
            return true;
        } else {
            logTest('Pagination Validation', false, 'Wrong error status');
            return false;
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Notification API Test Suite');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    const results = [];

    // Test 1: Login
    results.push(await testLogin());
    if (!authToken) {
        console.log('❌ Cannot continue without authentication token');
        console.log('   Please update TEST_USER credentials in this script');
        return;
    }

    // Test 2-7: API endpoints
    results.push(await testGetNotifications());
    results.push(await testGetNotificationsNoAuth());
    results.push(await testGetUnreadCount());
    results.push(await testMarkAsRead());
    results.push(await testMarkAllAsRead());
    results.push(await testPaginationValidation());

    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;

    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Test Results: ${passed}/${total} passed`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    if (passed === total) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
