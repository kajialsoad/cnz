const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testComplaint123() {
    try {
        console.log('Testing Complaint 123 access...\n');

        // Login as Rahim
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01712345678',
            password: 'Demo123!@#'
        });

        const token = loginResponse.data.data.accessToken;
        console.log('✅ Logged in as Rahim Ahmed');

        // Try to get complaint 123
        console.log('\nTesting GET /api/complaints/123');
        try {
            const complaintResponse = await axios.get(`${BASE_URL}/complaints/123`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Complaint 123 exists');
            console.log(`   Title: ${complaintResponse.data.data.complaint.title}`);
            console.log(`   User ID: ${complaintResponse.data.data.complaint.userId}`);
        } catch (error) {
            console.log('❌ Cannot access complaint 123');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message}`);
        }

        // Try to get chat for complaint 123
        console.log('\nTesting GET /api/complaints/123/chat');
        try {
            const chatResponse = await axios.get(`${BASE_URL}/complaints/123/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Chat accessible');
            console.log(`   Messages: ${chatResponse.data.data.messages.length}`);
        } catch (error) {
            console.log('❌ Cannot access chat');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message}`);
        }

        // Try complaint 121 (the one with admin messages)
        console.log('\nTesting GET /api/complaints/121/chat');
        try {
            const chatResponse = await axios.get(`${BASE_URL}/complaints/121/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Chat accessible');
            console.log(`   Messages: ${chatResponse.data.data.messages.length}`);
            chatResponse.data.data.messages.forEach((msg, idx) => {
                console.log(`   ${idx + 1}. [${msg.senderType}] ${msg.message.substring(0, 50)}`);
            });
        } catch (error) {
            console.log('❌ Cannot access chat');
            console.log(`   Status: ${error.response?.status}`);
            console.log(`   Error: ${error.response?.data?.message}`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testComplaint123();
