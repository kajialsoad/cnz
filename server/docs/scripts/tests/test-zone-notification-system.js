/**
 * Test Script: Zone-Based Notification System
 * 
 * This script tests the zone-based notification filtering to ensure:
 * 1. Super Admins only receive notifications for their assigned zones
 * 2. Master Admins receive all notifications
 * 3. Authorization checks work correctly
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:4000/api';

// Test configuration
const TEST_CONFIG = {
    // Super Admin in Zone 1
    superAdminZone1: {
        email: 'superadmin1@example.com',
        password: 'password123',
        expectedZones: [1]
    },
    // Super Admin in Zone 2
    superAdminZone2: {
        email: 'superadmin2@example.com',
        password: 'password123',
        expectedZones: [2]
    },
    // Master Admin (all zones)
    masterAdmin: {
        email: 'masteradmin@example.com',
        password: 'password123'
    },
    // Test user for creating complaints
    testUser: {
        email: 'testuser@example.com',
        password: 'password123'
    }
};

let tokens = {};
let testComplaintIds = {};

/**
 * Login and get token
 */
async function login(email, password) {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });

        if (response.data.success && response.data.data.token) {
            console.log(`✅ Logged in as ${email}`);
            return response.data.data.token;
        } else {
            throw new Error('Login failed');
        }
    } catch (error) {
        console.error(`❌ Login failed for ${email}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Create a test complaint in a specific zone
 */
async function createComplaint(token, zoneId, wardId, cityCorporationCode = 'DSCC') {
    try {
        const response = await axios.post(
            `${BASE_URL}/complaints`,
            {
                title: `Test Complaint for Zone ${zoneId}`,
                description: `This is a test complaint created in Zone ${zoneId} to test notification filtering`,
                location: `Test Location, Ward ${wardId}, Zone ${zoneId}`,
                category: 'WASTE_MANAGEMENT',
                subcategory: 'Garbage Collection',
                complaintCityCorporationCode: cityCorporationCode,
                complaintZoneId: zoneId,
                complaintWardId: wardId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            const complaintId = response.data.data.complaint.id;
            console.log(`✅ Created complaint ${complaintId} in Zone ${zoneId}`);
            return complaintId;
        } else {
            throw new Error('Complaint creation failed');
        }
    } catch (error) {
        console.error(`❌ Failed to create complaint in Zone ${zoneId}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get notifications for a user
 */
async function getNotifications(token) {
    try {
        const response = await axios.get(`${BASE_URL}/admin/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.data.success) {
            return response.data.data.notifications;
        } else {
            throw new Error('Failed to get notifications');
        }
    } catch (error) {
        console.error('❌ Failed to get notifications:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Try to view a complaint
 */
async function viewComplaint(token, complaintId) {
    try {
        const response = await axios.get(`${BASE_URL}/admin/complaints/${complaintId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return {
            success: true,
            status: response.status,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status,
            message: error.response?.data?.message
        };
    }
}

/**
 * Test 1: Notification Filtering
 */
async function testNotificationFiltering() {
    console.log('\n🧪 TEST 1: Notification Filtering');
    console.log('='.repeat(60));

    // Create complaint in Zone 1
    const zone1ComplaintId = await createComplaint(tokens.testUser, 1, 1, 'DSCC');
    testComplaintIds.zone1 = zone1ComplaintId;

    // Wait for notifications to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check Super Admin Zone 1 notifications
    console.log('\n📬 Checking Super Admin Zone 1 notifications...');
    const zone1Notifications = await getNotifications(tokens.superAdminZone1);
    const zone1HasNotification = zone1Notifications.some(n => n.complaintId === zone1ComplaintId);

    if (zone1HasNotification) {
        console.log('✅ Super Admin Zone 1 received notification for Zone 1 complaint');
    } else {
        console.log('❌ Super Admin Zone 1 did NOT receive notification for Zone 1 complaint');
    }

    // Check Super Admin Zone 2 notifications
    console.log('\n📬 Checking Super Admin Zone 2 notifications...');
    const zone2Notifications = await getNotifications(tokens.superAdminZone2);
    const zone2HasNotification = zone2Notifications.some(n => n.complaintId === zone1ComplaintId);

    if (!zone2HasNotification) {
        console.log('✅ Super Admin Zone 2 did NOT receive notification for Zone 1 complaint (correct)');
    } else {
        console.log('❌ Super Admin Zone 2 received notification for Zone 1 complaint (incorrect)');
    }

    // Check Master Admin notifications
    console.log('\n📬 Checking Master Admin notifications...');
    const masterNotifications = await getNotifications(tokens.masterAdmin);
    const masterHasNotification = masterNotifications.some(n => n.complaintId === zone1ComplaintId);

    if (masterHasNotification) {
        console.log('✅ Master Admin received notification for Zone 1 complaint');
    } else {
        console.log('❌ Master Admin did NOT receive notification for Zone 1 complaint');
    }
}

/**
 * Test 2: View Authorization
 */
async function testViewAuthorization() {
    console.log('\n🧪 TEST 2: View Authorization');
    console.log('='.repeat(60));

    // Create complaint in Zone 2
    const zone2ComplaintId = await createComplaint(tokens.testUser, 2, 5, 'DSCC');
    testComplaintIds.zone2 = zone2ComplaintId;

    // Wait for complaint to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Super Admin Zone 1 tries to view Zone 2 complaint
    console.log('\n🔒 Super Admin Zone 1 trying to view Zone 2 complaint...');
    const zone1ViewZone2 = await viewComplaint(tokens.superAdminZone1, zone2ComplaintId);

    if (!zone1ViewZone2.success && zone1ViewZone2.status === 403) {
        console.log('✅ Super Admin Zone 1 denied access to Zone 2 complaint (correct)');
    } else {
        console.log('❌ Super Admin Zone 1 was able to view Zone 2 complaint (incorrect)');
    }

    // Super Admin Zone 2 tries to view Zone 2 complaint
    console.log('\n🔒 Super Admin Zone 2 trying to view Zone 2 complaint...');
    const zone2ViewZone2 = await viewComplaint(tokens.superAdminZone2, zone2ComplaintId);

    if (zone2ViewZone2.success) {
        console.log('✅ Super Admin Zone 2 can view Zone 2 complaint (correct)');
    } else {
        console.log('❌ Super Admin Zone 2 denied access to Zone 2 complaint (incorrect)');
    }

    // Master Admin tries to view Zone 2 complaint
    console.log('\n🔒 Master Admin trying to view Zone 2 complaint...');
    const masterViewZone2 = await viewComplaint(tokens.masterAdmin, zone2ComplaintId);

    if (masterViewZone2.success) {
        console.log('✅ Master Admin can view Zone 2 complaint (correct)');
    } else {
        console.log('❌ Master Admin denied access to Zone 2 complaint (incorrect)');
    }
}

/**
 * Test 3: Cross-Zone Notification Test
 */
async function testCrossZoneNotifications() {
    console.log('\n🧪 TEST 3: Cross-Zone Notification Test');
    console.log('='.repeat(60));

    // Create complaints in both zones
    const zone1ComplaintId = await createComplaint(tokens.testUser, 1, 2, 'DSCC');
    const zone2ComplaintId = await createComplaint(tokens.testUser, 2, 6, 'DSCC');

    // Wait for notifications
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check Super Admin Zone 1
    console.log('\n📬 Checking Super Admin Zone 1 notifications...');
    const zone1Notifications = await getNotifications(tokens.superAdminZone1);
    const zone1Count = zone1Notifications.filter(n =>
        n.complaintId === zone1ComplaintId || n.complaintId === zone2ComplaintId
    ).length;

    console.log(`Super Admin Zone 1 received ${zone1Count} notification(s)`);
    if (zone1Count === 1) {
        console.log('✅ Correct: Only received notification for Zone 1 complaint');
    } else {
        console.log('❌ Incorrect: Should only receive 1 notification');
    }

    // Check Super Admin Zone 2
    console.log('\n📬 Checking Super Admin Zone 2 notifications...');
    const zone2Notifications = await getNotifications(tokens.superAdminZone2);
    const zone2Count = zone2Notifications.filter(n =>
        n.complaintId === zone1ComplaintId || n.complaintId === zone2ComplaintId
    ).length;

    console.log(`Super Admin Zone 2 received ${zone2Count} notification(s)`);
    if (zone2Count === 1) {
        console.log('✅ Correct: Only received notification for Zone 2 complaint');
    } else {
        console.log('❌ Incorrect: Should only receive 1 notification');
    }

    // Check Master Admin
    console.log('\n📬 Checking Master Admin notifications...');
    const masterNotifications = await getNotifications(tokens.masterAdmin);
    const masterCount = masterNotifications.filter(n =>
        n.complaintId === zone1ComplaintId || n.complaintId === zone2ComplaintId
    ).length;

    console.log(`Master Admin received ${masterCount} notification(s)`);
    if (masterCount === 2) {
        console.log('✅ Correct: Received notifications for both zones');
    } else {
        console.log('❌ Incorrect: Should receive 2 notifications');
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🚀 Starting Zone-Based Notification System Tests');
    console.log('='.repeat(60));

    try {
        // Login all users
        console.log('\n🔐 Logging in test users...');
        tokens.superAdminZone1 = await login(TEST_CONFIG.superAdminZone1.email, TEST_CONFIG.superAdminZone1.password);
        tokens.superAdminZone2 = await login(TEST_CONFIG.superAdminZone2.email, TEST_CONFIG.superAdminZone2.password);
        tokens.masterAdmin = await login(TEST_CONFIG.masterAdmin.email, TEST_CONFIG.masterAdmin.password);
        tokens.testUser = await login(TEST_CONFIG.testUser.email, TEST_CONFIG.testUser.password);

        // Run tests
        await testNotificationFiltering();
        await testViewAuthorization();
        await testCrossZoneNotifications();

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runTests();
