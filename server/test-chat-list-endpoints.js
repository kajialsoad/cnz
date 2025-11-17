/**
 * Test script for new chat list endpoints
 * Tests:
 * 1. GET /api/admin/chat - Get all chat conversations
 * 2. GET /api/admin/chat/statistics - Get chat statistics
 * 3. GET /api/admin/chat/:complaintId - Get messages with full details
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
    email: 'admin@demo.com',
    password: 'Demo123!@#'
};

let authToken = '';
let api = null;

async function loginAsAdmin() {
    try {
        console.log('🔐 Logging in as admin...');
        const response = await axios.post(`${BASE_URL}/admin/auth/login`, ADMIN_CREDENTIALS);

        const token = response.data.accessToken ||
            response.data.data?.accessToken ||
            response.data.data?.token ||
            response.data.token;

        if (token) {
            authToken = token;
            // Create API instance with token
            api = axios.create({
                baseURL: BASE_URL,
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('✅ Admin login successful\n');
            return true;
        } else {
            console.error('❌ Admin login failed:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Error logging in as admin:', error.response?.data || error.message);
        return false;
    }
}

async function testGetChatConversations() {
    console.log('\n📋 Test 1: GET /api/admin/chat - Get all chat conversations');
    console.log('='.repeat(60));

    try {
        const response = await api.get('/admin/chat');

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('\n📊 Response Data:');
        console.log('Total chats:', response.data.data.chats.length);
        console.log('Pagination:', JSON.stringify(response.data.data.pagination, null, 2));

        if (response.data.data.chats.length > 0) {
            console.log('\n📝 First chat conversation:');
            console.log(JSON.stringify(response.data.data.chats[0], null, 2));
        }

        return response.data.data.chats[0]?.complaintId;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return null;
    }
}

async function testGetChatConversationsWithFilters() {
    console.log('\n📋 Test 2: GET /api/admin/chat with filters');
    console.log('='.repeat(60));

    try {
        // Test with unreadOnly filter
        const response = await api.get('/admin/chat', {
            params: {
                unreadOnly: true,
                limit: 5
            }
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('📊 Unread chats:', response.data.data.chats.length);

        if (response.data.data.chats.length > 0) {
            console.log('\n📝 First unread chat:');
            console.log('Complaint ID:', response.data.data.chats[0].complaintId);
            console.log('Unread count:', response.data.data.chats[0].unreadCount);
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testGetChatStatistics() {
    console.log('\n📊 Test 3: GET /api/admin/chat/statistics');
    console.log('='.repeat(60));

    try {
        const response = await api.get('/admin/chat/statistics');

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('\n📊 Statistics:');
        console.log(JSON.stringify(response.data.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testGetChatMessagesEnhanced(complaintId) {
    if (!complaintId) {
        console.log('\n⚠️  Skipping Test 4: No complaint ID available');
        return;
    }

    console.log(`\n💬 Test 4: GET /api/admin/chat/${complaintId} - Enhanced with full details`);
    console.log('='.repeat(60));

    try {
        const response = await api.get(`/admin/chat/${complaintId}`);

        console.log('✅ Status:', response.status);
        console.log('✅ Success:', response.data.success);
        console.log('\n📊 Response includes:');
        console.log('- Complaint details:', !!response.data.data.complaint);
        console.log('- Citizen details:', !!response.data.data.citizen);
        console.log('- Messages:', response.data.data.messages.length);

        console.log('\n📝 Complaint details:');
        console.log(JSON.stringify(response.data.data.complaint, null, 2));

        console.log('\n👤 Citizen details:');
        console.log(JSON.stringify(response.data.data.citizen, null, 2));

        if (response.data.data.messages.length > 0) {
            console.log('\n💬 First message:');
            console.log(JSON.stringify(response.data.data.messages[0], null, 2));
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function testSearchAndFilter() {
    console.log('\n🔍 Test 5: Search and filter functionality');
    console.log('='.repeat(60));

    try {
        // Test search
        const searchResponse = await api.get('/admin/chat', {
            params: {
                search: 'road',
                limit: 3
            }
        });

        console.log('✅ Search test:');
        console.log('Found chats:', searchResponse.data.data.chats.length);

        // Test status filter
        const statusResponse = await api.get('/admin/chat', {
            params: {
                status: 'PENDING',
                limit: 3
            }
        });

        console.log('\n✅ Status filter test:');
        console.log('Pending chats:', statusResponse.data.data.chats.length);
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Chat List Endpoints Tests');
    console.log('='.repeat(60));
    console.log();

    // Login first
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
        console.error('❌ Failed to login. Exiting...');
        process.exit(1);
    }

    const complaintId = await testGetChatConversations();
    await testGetChatConversationsWithFilters();
    await testGetChatStatistics();
    await testGetChatMessagesEnhanced(complaintId);
    await testSearchAndFilter();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
}

runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
