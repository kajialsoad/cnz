const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

// Test admin credentials (from database)
const ADMIN_CREDENTIALS = {
    email: 'admin@demo.com',
    password: 'Demo123!@#'
};

let adminToken = '';
let testComplaintId = null;
let testMessageId = null;

async function loginAsAdmin() {
    try {
        console.log('🔐 Logging in as admin...');
        const response = await axios.post(`${API_URL}/admin/auth/login`, ADMIN_CREDENTIALS);

        // Check for different possible token locations
        const token = response.data.accessToken ||
            response.data.data?.accessToken ||
            response.data.data?.token ||
            response.data.token;

        if (token) {
            adminToken = token;
            console.log('✅ Admin login successful');
            return true;
        } else {
            console.log('❌ Admin login failed:', response.data.message);
            console.log('   Response data:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        console.error('❌ Error logging in as admin:', error.response?.data || error.message);
        return false;
    }
}

async function testGetChatMessages() {
    try {
        console.log('\n📋 Test 1: GET /api/admin/chat/:complaintId - Get chat messages');

        if (!testComplaintId) {
            console.log('   ⚠️  No test complaint ID available. Skipping test.');
            return false;
        }

        const response = await axios.get(
            `${API_URL}/admin/chat/${testComplaintId}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` },
                params: { page: 1, limit: 50 }
            }
        );

        if (response.data.success) {
            console.log('   ✅ Successfully fetched chat messages');
            console.log(`   📊 Total messages: ${response.data.data.pagination.total}`);
            console.log(`   📄 Messages on page: ${response.data.data.messages.length}`);

            if (response.data.data.messages.length > 0) {
                const firstMsg = response.data.data.messages[0];
                console.log(`   💬 First message: "${firstMsg.message.substring(0, 50)}..."`);
                console.log(`   👤 Sender: ${firstMsg.senderName} (${firstMsg.senderType})`);
            }
            return true;
        } else {
            console.log('   ❌ Failed to fetch chat messages:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error fetching chat messages:', error.response?.data || error.message);
        return false;
    }
}

async function testSendChatMessage() {
    try {
        console.log('\n💬 Test 2: POST /api/admin/chat/:complaintId - Send chat message');

        if (!testComplaintId) {
            console.log('   ⚠️  No test complaint ID available. Skipping test.');
            return false;
        }

        const messageData = {
            message: `Test message from admin at ${new Date().toISOString()}`,
            imageUrl: null
        };

        const response = await axios.post(
            `${API_URL}/admin/chat/${testComplaintId}`,
            messageData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (response.data.success) {
            console.log('   ✅ Successfully sent chat message');
            testMessageId = response.data.data.message.id;
            console.log(`   📝 Message ID: ${testMessageId}`);
            console.log(`   💬 Message: "${response.data.data.message.message}"`);
            console.log(`   👤 Sender: ${response.data.data.message.senderName}`);
            return true;
        } else {
            console.log('   ❌ Failed to send chat message:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error sending chat message:', error.response?.data || error.message);
        return false;
    }
}

async function testSendChatMessageWithImage() {
    try {
        console.log('\n🖼️  Test 3: POST /api/admin/chat/:complaintId - Send message with image');

        if (!testComplaintId) {
            console.log('   ⚠️  No test complaint ID available. Skipping test.');
            return false;
        }

        const messageData = {
            message: 'Test message with image attachment',
            imageUrl: 'https://example.com/test-image.jpg'
        };

        const response = await axios.post(
            `${API_URL}/admin/chat/${testComplaintId}`,
            messageData,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (response.data.success) {
            console.log('   ✅ Successfully sent message with image');
            console.log(`   📝 Message ID: ${response.data.data.message.id}`);
            console.log(`   🖼️  Image URL: ${response.data.data.message.imageUrl}`);
            return true;
        } else {
            console.log('   ❌ Failed to send message with image:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error sending message with image:', error.response?.data || error.message);
        return false;
    }
}

async function testMarkMessagesAsRead() {
    try {
        console.log('\n✔️  Test 4: PATCH /api/admin/chat/:complaintId/read - Mark messages as read');

        if (!testComplaintId) {
            console.log('   ⚠️  No test complaint ID available. Skipping test.');
            return false;
        }

        const response = await axios.patch(
            `${API_URL}/admin/chat/${testComplaintId}/read`,
            {},
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (response.data.success) {
            console.log('   ✅ Successfully marked messages as read');
            console.log(`   📊 Messages marked: ${response.data.data.messagesMarkedAsRead}`);
            return true;
        } else {
            console.log('   ❌ Failed to mark messages as read:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error marking messages as read:', error.response?.data || error.message);
        return false;
    }
}

async function testInvalidComplaintId() {
    try {
        console.log('\n🚫 Test 5: GET /api/admin/chat/:complaintId - Invalid complaint ID');

        const response = await axios.get(
            `${API_URL}/admin/chat/999999`,
            {
                headers: { Authorization: `Bearer ${adminToken}` },
                validateStatus: () => true // Don't throw on error status
            }
        );

        if (response.status === 404 || !response.data.success) {
            console.log('   ✅ Correctly handled invalid complaint ID');
            console.log(`   📊 Status: ${response.status}`);
            console.log(`   💬 Message: ${response.data.message}`);
            return true;
        } else {
            console.log('   ❌ Should have returned error for invalid complaint ID');
            return false;
        }
    } catch (error) {
        console.log('   ✅ Correctly threw error for invalid complaint ID');
        return true;
    }
}

async function testUnauthorizedAccess() {
    try {
        console.log('\n🔒 Test 6: Unauthorized access without token');

        const response = await axios.get(
            `${API_URL}/admin/chat/${testComplaintId || 1}`,
            {
                validateStatus: () => true // Don't throw on error status
            }
        );

        if (response.status === 401) {
            console.log('   ✅ Correctly blocked unauthorized access');
            console.log(`   📊 Status: ${response.status}`);
            return true;
        } else {
            console.log('   ❌ Should have blocked unauthorized access');
            return false;
        }
    } catch (error) {
        console.log('   ✅ Correctly blocked unauthorized access');
        return true;
    }
}

async function testPagination() {
    try {
        console.log('\n📄 Test 7: GET /api/admin/chat/:complaintId - Pagination');

        if (!testComplaintId) {
            console.log('   ⚠️  No test complaint ID available. Skipping test.');
            return false;
        }

        // Test with different page sizes
        const response1 = await axios.get(
            `${API_URL}/admin/chat/${testComplaintId}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` },
                params: { page: 1, limit: 5 }
            }
        );

        if (response1.data.success) {
            console.log('   ✅ Pagination working correctly');
            console.log(`   📊 Page 1, Limit 5: ${response1.data.data.messages.length} messages`);
            console.log(`   📄 Total pages: ${response1.data.data.pagination.totalPages}`);
            console.log(`   ⏭️  Has next page: ${response1.data.data.pagination.hasNextPage}`);
            return true;
        } else {
            console.log('   ❌ Pagination test failed');
            return false;
        }
    } catch (error) {
        console.error('   ❌ Error testing pagination:', error.response?.data || error.message);
        return false;
    }
}

async function cleanupTestData() {
    try {
        console.log('\n🧹 Cleaning up test data...');

        // Delete test messages created during tests
        const result = await prisma.complaintChatMessage.deleteMany({
            where: {
                message: {
                    contains: 'Test message from admin'
                }
            }
        });

        console.log(`   ✅ Cleaned up ${result.count} test messages`);
    } catch (error) {
        console.error('   ⚠️  Error cleaning up test data:', error.message);
    }
}

async function setupTestData() {
    try {
        console.log('\n🔧 Setting up test data...');

        // Find or create a test complaint
        const complaint = await prisma.complaint.findFirst({
            include: {
                user: true
            }
        });

        if (complaint) {
            testComplaintId = complaint.id;
            console.log(`   ✅ Using existing complaint ID: ${testComplaintId}`);
        } else {
            console.log('   ⚠️  No complaints found in database');
            return false;
        }

        return true;
    } catch (error) {
        console.error('   ❌ Error setting up test data:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Testing Admin Chat Routes\n');
    console.log('='.repeat(60));

    try {
        // Setup
        const setupSuccess = await setupTestData();
        if (!setupSuccess) {
            console.log('\n❌ Failed to setup test data. Exiting...');
            return;
        }

        // Login
        const loginSuccess = await loginAsAdmin();
        if (!loginSuccess) {
            console.log('\n❌ Failed to login as admin. Exiting...');
            return;
        }

        // Run tests
        const results = {
            getChatMessages: await testGetChatMessages(),
            sendChatMessage: await testSendChatMessage(),
            sendChatMessageWithImage: await testSendChatMessageWithImage(),
            markMessagesAsRead: await testMarkMessagesAsRead(),
            invalidComplaintId: await testInvalidComplaintId(),
            unauthorizedAccess: await testUnauthorizedAccess(),
            pagination: await testPagination()
        };

        // Cleanup
        await cleanupTestData();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary\n');

        const passed = Object.values(results).filter(r => r === true).length;
        const total = Object.keys(results).length;

        Object.entries(results).forEach(([test, result]) => {
            const icon = result ? '✅' : '❌';
            console.log(`${icon} ${test}`);
        });

        console.log(`\n${passed}/${total} tests passed`);

        if (passed === total) {
            console.log('\n🎉 All admin chat route tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the output above.');
        }

    } catch (error) {
        console.error('\n❌ Unexpected error during testing:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the tests
runTests();
