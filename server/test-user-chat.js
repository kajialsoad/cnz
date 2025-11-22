const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test user credentials (you'll need to use actual credentials)
const TEST_USER = {
    phone: '01712345678', // Replace with actual test user phone
    password: 'Demo123!@#' // Replace with actual test user password
};

async function testUserChat() {
    try {
        console.log('🧪 Testing User Chat System...\n');

        // Step 1: Login as user
        console.log('1️⃣ Logging in as user...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            phone: TEST_USER.phone,
            password: TEST_USER.password
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

        const token = loginResponse.data.data?.accessToken || loginResponse.data.data?.tokens?.accessToken;
        const userId = loginResponse.data.data?.user?.id || loginResponse.data.data?.id;

        if (!token) {
            throw new Error('No access token in response');
        }

        console.log('✅ Login successful');
        console.log(`   User ID: ${userId}`);
        console.log(`   Token: ${token.substring(0, 20)}...`);

        // Step 2: Get user's complaints
        console.log('\n2️⃣ Fetching user complaints...');
        const complaintsResponse = await axios.get(`${BASE_URL}/complaints`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!complaintsResponse.data.success || !complaintsResponse.data.data.complaints.length) {
            console.log('❌ No complaints found for this user');
            console.log('   Please create a complaint first or use a different test user');
            return;
        }

        const complaint = complaintsResponse.data.data.complaints[0];
        console.log('✅ Found complaints');
        console.log(`   Using complaint ID: ${complaint.id}`);
        console.log(`   Title: ${complaint.title}`);

        // Step 3: Get chat messages
        console.log('\n3️⃣ Fetching chat messages...');
        try {
            const chatResponse = await axios.get(`${BASE_URL}/complaints/${complaint.id}/chat`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('✅ Chat messages fetched successfully');
            console.log(`   Total messages: ${chatResponse.data.data.messages?.length || 0}`);

            if (chatResponse.data.data.messages && chatResponse.data.data.messages.length > 0) {
                console.log('\n   Recent messages:');
                chatResponse.data.data.messages.slice(-3).forEach((msg, idx) => {
                    console.log(`   ${idx + 1}. [${msg.senderType}] ${msg.message.substring(0, 50)}...`);
                });
            } else {
                console.log('   No messages yet');
            }
        } catch (error) {
            console.log('❌ Failed to fetch chat messages');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
            console.log(`   Full response:`, JSON.stringify(error.response?.data, null, 2));
        }

        // Step 4: Send a test message
        console.log('\n4️⃣ Sending a test message...');
        try {
            const sendResponse = await axios.post(
                `${BASE_URL}/complaints/${complaint.id}/chat`,
                {
                    message: 'Test message from user - ' + new Date().toISOString()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Message sent successfully');
            console.log(`   Message ID: ${sendResponse.data.data.message.id}`);
            console.log(`   Message: ${sendResponse.data.data.message.message}`);
        } catch (error) {
            console.log('❌ Failed to send message');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }

        // Step 5: Mark messages as read
        console.log('\n5️⃣ Marking messages as read...');
        try {
            const readResponse = await axios.patch(
                `${BASE_URL}/complaints/${complaint.id}/chat/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('✅ Messages marked as read');
            console.log(`   Messages marked: ${readResponse.data.data.messagesMarkedAsRead}`);
        } catch (error) {
            console.log('❌ Failed to mark messages as read');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message || error.message}`);
        }

        console.log('\n✅ User chat test completed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testUserChat();
