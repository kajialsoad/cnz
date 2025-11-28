const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testChatResponse() {
    try {
        console.log('Testing chat API response structure...\n');

        // First, let's check if we have any test users
        console.log('Checking database for test data...');

        // Try to get a complaint ID from the database
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Get a user with complaints
        const user = await prisma.user.findFirst({
            where: {
                role: 'CUSTOMER',
                complaints: {
                    some: {}
                }
            },
            include: {
                complaints: {
                    take: 1
                }
            }
        });

        if (!user || !user.complaints.length) {
            console.log('❌ No test data found. Please create a user with complaints first.');
            await prisma.$disconnect();
            return;
        }

        console.log(`✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);
        console.log(`   Phone: ${user.phone}`);
        console.log(`   Complaint ID: ${user.complaints[0].id}`);

        // Now test the login
        console.log('\nAttempting login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            phone: user.phone,
            password: 'Demo123!@#' // Default test password
        }).catch(err => {
            console.log('❌ Login failed. The password might not be "Test@123"');
            console.log('   Please update the password in the database or use the correct password');
            return null;
        });

        if (!loginResponse) {
            await prisma.$disconnect();
            return;
        }

        const token = loginResponse.data.data.accessToken;
        const complaintId = user.complaints[0].id;

        console.log('✅ Login successful');

        // Test the chat endpoint
        console.log(`\nTesting GET /api/complaints/${complaintId}/chat`);
        const chatResponse = await axios.get(`${BASE_URL}/complaints/${complaintId}/chat`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n📦 Response structure:');
        console.log(JSON.stringify(chatResponse.data, null, 2));

        console.log('\n✅ Response received successfully!');
        console.log(`   Success: ${chatResponse.data.success}`);
        console.log(`   Has data: ${!!chatResponse.data.data}`);
        console.log(`   Has messages: ${!!chatResponse.data.data?.messages}`);
        console.log(`   Message count: ${chatResponse.data.data?.messages?.length || 0}`);

        await prisma.$disconnect();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testChatResponse();
