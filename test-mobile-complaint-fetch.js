const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Test user credentials (use your actual test user)
const TEST_USER = {
    phone: '01712345678', // Change this to your test user phone
    password: 'password123' // Change this to your test user password
};

async function testComplaintFetch() {
    console.log('=== Testing Mobile App Complaint Fetch ===\n');

    try {
        // Step 1: Login
        console.log('1. Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            phone: TEST_USER.phone,
            password: TEST_USER.password
        });

        if (!loginResponse.data.success) {
            console.error('❌ Login failed:', loginResponse.data.message);
            return;
        }

        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ Login successful');
        console.log('   Access Token:', accessToken.substring(0, 20) + '...\n');

        // Step 2: Fetch complaints
        console.log('2. Fetching complaints...');
        const complaintsResponse = await axios.get(`${BASE_URL}/api/complaints`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!complaintsResponse.data.success) {
            console.error('❌ Failed to fetch complaints:', complaintsResponse.data.message);
            return;
        }

        const complaints = complaintsResponse.data.data.complaints;
        console.log('✅ Complaints fetched successfully');
        console.log(`   Total complaints: ${complaints.length}\n`);

        // Step 3: Display complaints
        if (complaints.length === 0) {
            console.log('ℹ️  No complaints found for this user');
            console.log('   This is why the mobile app shows "No complaints yet"\n');
        } else {
            console.log('📋 Complaints:');
            complaints.forEach((complaint, index) => {
                console.log(`\n   ${index + 1}. ID: ${complaint.id}`);
                console.log(`      Title: ${complaint.title || 'N/A'}`);
                console.log(`      Description: ${complaint.description.substring(0, 50)}...`);
                console.log(`      Status: ${complaint.status}`);
                console.log(`      Category: ${complaint.category || 'N/A'}`);
                console.log(`      Location: ${complaint.location}`);
                console.log(`      Created: ${new Date(complaint.createdAt).toLocaleString()}`);
            });
        }

        // Step 4: Check user info
        console.log('\n3. Checking user info...');
        const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (meResponse.data.user) {
            const user = meResponse.data.user;
            console.log('✅ User info:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Phone: ${user.phone}`);
            console.log(`   Email: ${user.email || 'N/A'}`);
            console.log(`   City Corporation: ${user.CityCorporationCode || 'N/A'}`);
            console.log(`   Thana: ${user.thanaId || 'N/A'}`);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testComplaintFetch();
