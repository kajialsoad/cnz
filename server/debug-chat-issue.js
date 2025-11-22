/**
 * Debug script to identify chat message loading issues
 * Run this to see what's wrong with the chat system
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:4000/api';

// Test user credentials
const TEST_USER = {
    email: 'munna@example.com', // Update with actual user email
    password: 'password123'
};

async function debugChatIssue() {
    console.log('🔍 Debugging Chat Message Loading Issue\n');
    console.log('='.repeat(60));

    // Step 1: Test database connection
    console.log('\n📊 Step 1: Testing Database Connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.log('\n❌ ISSUE FOUND: Database connection failed!');
        console.log('   Fix: Check your .env DATABASE_URL');
        return;
    }

    // Step 2: Check if user exists
    console.log('\n👤 Step 2: Checking User...');
    const userToken = await loginUser();
    if (!userToken) {
        console.log('\n❌ ISSUE FOUND: User login failed!');
        console.log('   Fix: Create a test user or update credentials');
        return;
    }

    // Step 3: Get user's complaints
    console.log('\n📋 Step 3: Getting User Complaints...');
    const complaints = await getUserComplaints(userToken);
    if (!complaints || complaints.length === 0) {
        console.log('\n⚠️  No complaints found for this user');
        console.log('   Create a complaint first to test chat');
        return;
    }

    const complaintId = complaints[0].id;
    console.log(`   ✅ Found complaint ID: ${complaintId}`);

    // Step 4: Check if chat messages exist
    console.log('\n💬 Step 4: Checking Chat Messages in Database...');
    const dbMessages = await getMessagesFromDatabase(complaintId);
    console.log(`   Found ${dbMessages.length} messages in database`);

    // Step 5: Test API endpoint
    console.log('\n🌐 Step 5: Testing API Endpoint...');
    const apiMessages = await getMessagesFromAPI(complaintId, userToken);

    if (apiMessages === null) {
        console.log('\n❌ ISSUE FOUND: API endpoint failed!');
        console.log('   This is why mobile app shows error');
        await diagnoseAPIIssue(complaintId, userToken);
    } else {
        console.log(`   ✅ API returned ${apiMessages.length} messages`);

        if (apiMessages.length !== dbMessages.length) {
            console.log('\n⚠️  WARNING: Message count mismatch!');
            console.log(`   Database: ${dbMessages.length} messages`);
            console.log(`   API: ${apiMessages.length} messages`);
        }
    }

    // Step 6: Test sending message
    console.log('\n📤 Step 6: Testing Send Message...');
    const sendResult = await testSendMessage(complaintId, userToken);

    console.log('\n' + '='.repeat(60));
    console.log('🎯 DIAGNOSIS COMPLETE\n');

    if (dbConnected && userToken && apiMessages !== null) {
        console.log('✅ Chat system is working correctly!');
        console.log('   If mobile app still shows error, check:');
        console.log('   1. Mobile app API URL configuration');
        console.log('   2. Mobile app authentication token');
        console.log('   3. Network connectivity from mobile device');
    }
}

async function testDatabaseConnection() {
    try {
        const dbUrl = process.env.DATABASE_URL;
        const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

        if (!urlMatch) {
            console.log('   ❌ Invalid DATABASE_URL format');
            return false;
        }

        const [, user, password, host, port, database] = urlMatch;

        const connection = await mysql.createConnection({
            host,
            port: parseInt(port),
            user,
            password,
            database
        });

        await connection.execute('SELECT 1');
        await connection.end();

        console.log('   ✅ Database connection successful');
        return true;
    } catch (error) {
        console.log('   ❌ Database connection failed:', error.message);
        return false;
    }
}

async function loginUser() {
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);

        if (response.data.success) {
            console.log('   ✅ User login successful');
            return response.data.data.accessToken;
        }
        return null;
    } catch (error) {
        console.log('   ❌ Login failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function getUserComplaints(token) {
    try {
        const response = await axios.get(`${BASE_URL}/complaints`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
            console.log(`   ✅ Found ${response.data.data.complaints.length} complaints`);
            return response.data.data.complaints;
        }
        return [];
    } catch (error) {
        console.log('   ❌ Failed to get complaints:', error.response?.data?.message || error.message);
        return [];
    }
}

async function getMessagesFromDatabase(complaintId) {
    try {
        const dbUrl = process.env.DATABASE_URL;
        const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        const [, user, password, host, port, database] = urlMatch;

        const connection = await mysql.createConnection({
            host,
            port: parseInt(port),
            user,
            password,
            database
        });

        const [rows] = await connection.execute(
            'SELECT * FROM ComplaintChatMessage WHERE complaintId = ? ORDER BY createdAt DESC',
            [complaintId]
        );

        await connection.end();

        if (rows.length > 0) {
            console.log('   Messages in database:');
            rows.slice(0, 3).forEach(msg => {
                console.log(`   - [${msg.senderType}] ${msg.message.substring(0, 50)}...`);
            });
        }

        return rows;
    } catch (error) {
        console.log('   ❌ Database query failed:', error.message);
        return [];
    }
}

async function getMessagesFromAPI(complaintId, token) {
    try {
        const response = await axios.get(
            `${BASE_URL}/complaints/${complaintId}/chat`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data.success) {
            const messages = response.data.data.messages;
            console.log('   ✅ API endpoint working');

            if (messages.length > 0) {
                console.log('   Recent messages from API:');
                messages.slice(0, 3).forEach(msg => {
                    console.log(`   - [${msg.senderType}] ${msg.senderName}: ${msg.message.substring(0, 40)}...`);
                });
            }

            return messages;
        }
        return null;
    } catch (error) {
        console.log('   ❌ API request failed');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data?.message || error.message);
        return null;
    }
}

async function diagnoseAPIIssue(complaintId, token) {
    console.log('\n🔍 Diagnosing API Issue...');

    // Test if server is running
    try {
        await axios.get(`${BASE_URL.replace('/api', '')}/health`);
        console.log('   ✅ Server is running');
    } catch (error) {
        console.log('   ❌ Server is not responding');
        console.log('   Fix: Start the server with "npm run dev"');
        return;
    }

    // Test if route exists
    try {
        const response = await axios.get(
            `${BASE_URL}/complaints/${complaintId}/chat`,
            {
                headers: { Authorization: `Bearer ${token}` },
                validateStatus: () => true // Don't throw on any status
            }
        );

        if (response.status === 404) {
            console.log('   ❌ Route not found (404)');
            console.log('   Fix: Make sure complaint routes are registered');
        } else if (response.status === 401) {
            console.log('   ❌ Unauthorized (401)');
            console.log('   Fix: Token might be invalid or expired');
        } else if (response.status === 500) {
            console.log('   ❌ Server error (500)');
            console.log('   Error:', response.data);
        }
    } catch (error) {
        console.log('   ❌ Request failed:', error.message);
    }
}

async function testSendMessage(complaintId, token) {
    try {
        const testMessage = 'Test message from debug script - ' + new Date().toISOString();

        const response = await axios.post(
            `${BASE_URL}/complaints/${complaintId}/chat`,
            { message: testMessage },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data.success) {
            console.log('   ✅ Message sent successfully');
            console.log('   Message:', testMessage);
            return true;
        }
        return false;
    } catch (error) {
        console.log('   ❌ Failed to send message');
        console.log('   Error:', error.response?.data?.message || error.message);
        return false;
    }
}

// Run the debug
debugChatIssue().catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
});
