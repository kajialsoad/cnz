/**
 * Test script for chat system
 * Tests database connection and chat endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test credentials - update these with real test user credentials
const TEST_USER = {
    email: 'test@example.com',
    password: 'password123'
};

const TEST_ADMIN = {
    email: 'admin@cleancare.bd',
    password: 'admin123'
};

let userToken = '';
let adminToken = '';
let testComplaintId = null;

async function login(credentials, role = 'user') {
    try {
        console.log(`\n🔐 Logging in as ${role}...`);
        const response = await axios.post(`${BASE_URL}/auth/login`, credentials);

        if (response.data.success) {
            console.log(`✅ ${role} login successful`);
            return response.data.data.accessToken;
        } else {
            console.log(`❌ ${role} login failed:`, response.data.message);
            return null;
        }
    } catch (error) {
        console.error(`❌ ${role} login error:`, error.response?.data || error.message);
        return null;
    }
}

async function testDatabaseConnection() {
    try {
        console.log('\n📊 Testing database connection...');
        const response = await axios.get(`${BASE_URL}/complaints`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (response.data.success) {
            console.log('✅ Database connection successful');
            return true;
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error.response?.data || error.message);
        return false;
    }
}

async function getUserComplaints() {
    try {
        console.log('\n📋 Getting user complaints...');
        const response = await axios.get(`${BASE_URL}/complaints`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });

        if (response.data.success && response.data.data.complaints.length > 0) {
            testComplaintId = response.data.data.complaints[0].id;
            console.log(`✅ Found ${response.data.data.complaints.length} complaints`);
            console.log(`   Using complaint ID: ${testComplaintId}`);
            return true;
        } else {
            console.log('⚠️  No complaints found. Please create a complaint first.');
            return false;
        }
    } catch (error) {
        console.error('❌ Error getting complaints:', error.response?.data || error.message);
        return false;
    }
}

async function testUserSendMessage() {
    if (!testComplaintId) {
        console.log('⚠️  Skipping user message test - no complaint ID');
        return false;
    }

    try {
        console.log('\n💬 Testing user sending message...');
        const response = await axios.post(
            `${BASE_URL}/complaints/${testComplaintId}/chat`,
            {
                message: 'Test message from user - ' + new Date().toISOString()
            },
            {
                headers: { Authorization: `Bearer ${userToken}` }
            }
        );

        if (response.data.success) {
            console.log('✅ User message sent successfully');
            console.log('   Message:', response.data.data.message.message);
            return true;
        }
    } catch (error) {
        console.error('❌ Error sending user message:', error.response?.data || error.message);
        return false;
    }
}

async function testAdminSendMessage() {
    if (!testComplaintId || !adminToken) {
        console.log('⚠️  Skipping admin message test - no complaint ID or admin token');
        return false;
    }

    try {
        console.log('\n💬 Testing admin sending message...');
        const response = await axios.post(
            `${BASE_URL}/admin/chat/${testComplaintId}`,
            {
                message: 'Test response from admin - ' + new Date().toISOString()
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (response.data.success) {
            console.log('✅ Admin message sent successfully');
            console.log('   Message:', response.data.data.message.message);
            return true;
        }
    } catch (error) {
        console.error('❌ Error sending admin message:', error.response?.data || error.message);
        return false;
    }
}

async function testUserGetMessages() {
    if (!testComplaintId) {
        console.log('⚠️  Skipping get messages test - no complaint ID');
        return false;
    }

    try {
        console.log('\n📨 Testing user getting messages...');
        const response = await axios.get(
            `${BASE_URL}/complaints/${testComplaintId}/chat`,
            {
                headers: { Authorization: `Bearer ${userToken}` }
            }
        );

        if (response.data.success) {
            const messages = response.data.data.messages;
            console.log(`✅ Retrieved ${messages.length} messages`);

            if (messages.length > 0) {
                console.log('\n   Recent messages:');
                messages.slice(0, 3).forEach(msg => {
                    console.log(`   - [${msg.senderType}] ${msg.senderName}: ${msg.message}`);
                });
            }
            return true;
        }
    } catch (error) {
        console.error('❌ Error getting messages:', error.response?.data || error.message);
        return false;
    }
}

async function testAdminGetChatStatistics() {
    if (!adminToken) {
        console.log('⚠️  Skipping chat statistics test - no admin token');
        return false;
    }

    try {
        console.log('\n📊 Testing admin getting chat statistics...');
        const response = await axios.get(
            `${BASE_URL}/admin/chat/statistics`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (response.data.success) {
            const stats = response.data.data;
            console.log('✅ Chat statistics retrieved successfully');
            console.log(`   Total chats: ${stats.totalChats}`);
            console.log(`   Unread count: ${stats.unreadCount}`);
            return true;
        }
    } catch (error) {
        console.error('❌ Error getting chat statistics:', error.response?.data || error.message);
        console.error('   This might be due to database connection issues');
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Chat System Tests\n');
    console.log('='.repeat(50));

    // Login as user
    userToken = await login(TEST_USER, 'user');
    if (!userToken) {
        console.log('\n❌ Cannot proceed without user login');
        return;
    }

    // Login as admin
    adminToken = await login(TEST_ADMIN, 'admin');

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n⚠️  Database connection failed. Check your .env file and database server.');
        console.log('   Make sure the database server is running and accessible.');
        return;
    }

    // Get user complaints
    const hasComplaints = await getUserComplaints();

    // Test user sending message
    await testUserSendMessage();

    // Test admin sending message
    await testAdminSendMessage();

    // Test user getting messages
    await testUserGetMessages();

    // Test admin getting chat statistics
    await testAdminGetChatStatistics();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Chat System Tests Complete\n');
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
