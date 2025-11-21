/**
 * Test script to verify complaint service includes city corporation and thana
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test configuration
let authToken = '';
let testUserId = null;
let testComplaintId = null;

async function testComplaintCityCorporation() {
    console.log('🧪 Testing Complaint Service City Corporation Integration\n');

    try {
        // Step 1: Login as a user
        console.log('1️⃣ Logging in as test user...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01771254209',
            password: 'password123'
        });

        authToken = loginResponse.data.token;
        testUserId = loginResponse.data.user.id;
        console.log('✅ Login successful');
        console.log(`   User ID: ${testUserId}`);
        console.log(`   City Corporation: ${loginResponse.data.user.cityCorporation?.name || 'Not set'}`);
        console.log(`   Thana: ${loginResponse.data.user.thana?.name || 'Not set'}\n`);

        // Step 2: Create a test complaint
        console.log('2️⃣ Creating test complaint...');
        const createResponse = await axios.post(
            `${BASE_URL}/complaints`,
            {
                description: 'Test complaint for city corporation verification',
                category: 'home',
                subcategory: 'not_collecting_waste',
                location: {
                    address: '123 Test Street',
                    district: 'Dhaka',
                    thana: 'Dhanmondi',
                    ward: '10'
                }
            },
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        testComplaintId = createResponse.data.complaint.id;
        console.log('✅ Complaint created successfully');
        console.log(`   Complaint ID: ${testComplaintId}`);
        console.log(`   City Corporation: ${createResponse.data.complaint.cityCorporation?.name || 'Not included'}`);
        console.log(`   Thana: ${createResponse.data.complaint.thana?.name || 'Not included'}\n`);

        // Step 3: Fetch the complaint by ID
        console.log('3️⃣ Fetching complaint by ID...');
        const getResponse = await axios.get(
            `${BASE_URL}/complaints/${testComplaintId}`,
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        console.log('✅ Complaint fetched successfully');
        console.log(`   City Corporation: ${getResponse.data.complaint.cityCorporation?.name || 'Not included'}`);
        console.log(`   Thana: ${getResponse.data.complaint.thana?.name || 'Not included'}\n`);

        // Step 4: List complaints
        console.log('4️⃣ Listing user complaints...');
        const listResponse = await axios.get(
            `${BASE_URL}/complaints?page=1&limit=5`,
            {
                headers: { Authorization: `Bearer ${authToken}` }
            }
        );

        console.log('✅ Complaints listed successfully');
        console.log(`   Total complaints: ${listResponse.data.pagination.total}`);
        if (listResponse.data.data.length > 0) {
            const firstComplaint = listResponse.data.data[0];
            console.log(`   First complaint city corporation: ${firstComplaint.cityCorporation?.name || 'Not included'}`);
            console.log(`   First complaint thana: ${firstComplaint.thana?.name || 'Not included'}\n`);
        }

        // Verification
        console.log('📊 Verification Results:');
        const hasCC = createResponse.data.complaint.cityCorporation !== null &&
            createResponse.data.complaint.cityCorporation !== undefined;
        const hasThana = createResponse.data.complaint.thana !== null &&
            createResponse.data.complaint.thana !== undefined;

        console.log(`   ✓ City Corporation included in create response: ${hasCC ? '✅ YES' : '❌ NO'}`);
        console.log(`   ✓ Thana included in create response: ${hasThana ? '✅ YES' : '❌ NO'}`);
        console.log(`   ✓ City Corporation included in get response: ${getResponse.data.complaint.cityCorporation ? '✅ YES' : '❌ NO'}`);
        console.log(`   ✓ Thana included in get response: ${getResponse.data.complaint.thana ? '✅ YES' : '❌ NO'}`);

        if (hasCC && hasThana) {
            console.log('\n✅ All tests passed! City corporation and thana are properly included.');
        } else {
            console.log('\n⚠️ Some tests failed. City corporation or thana may not be properly included.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Run the test
testComplaintCityCorporation();
