const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test credentials - using super admin
const SUPER_ADMIN_CREDENTIALS = {
    email: 'superadmin@demo.com',
    password: 'Demo123!@#'
};

let authToken = '';
let createdThanaId = null;

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error(`❌ Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            throw error;
        }
        throw error;
    }
}

// Test 1: Login as super admin
async function testLogin() {
    console.log('\n📝 Test 1: Login as Super Admin');
    try {
        const response = await axios.post(`${BASE_URL}/admin/auth/login`, SUPER_ADMIN_CREDENTIALS);
        authToken = response.data.accessToken;
        console.log('✅ Login successful');
        console.log(`   Token: ${authToken.substring(0, 20)}...`);
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

// Test 2: Get thanas for DSCC
async function testGetThanasByCity() {
    console.log('\n📝 Test 2: Get Thanas for DSCC');
    try {
        const result = await makeRequest('GET', '/admin/thanas?cityCorporationCode=DSCC');
        console.log('✅ Get thanas successful');
        console.log(`   Found ${result.data.length} thanas for DSCC`);
        if (result.data.length > 0) {
            console.log(`   First thana: ${result.data[0].name}`);
        }
        return true;
    } catch (error) {
        console.error('❌ Get thanas failed');
        return false;
    }
}

// Test 3: Get thanas with status filter
async function testGetThanasWithStatusFilter() {
    console.log('\n📝 Test 3: Get Active Thanas for DSCC');
    try {
        const result = await makeRequest('GET', '/admin/thanas?cityCorporationCode=DSCC&status=ACTIVE');
        console.log('✅ Get active thanas successful');
        console.log(`   Found ${result.data.length} active thanas`);
        return true;
    } catch (error) {
        console.error('❌ Get active thanas failed');
        return false;
    }
}

// Test 4: Create new thana
async function testCreateThana() {
    console.log('\n📝 Test 4: Create New Thana');
    try {
        const newThana = {
            name: 'Test Thana ' + Date.now(),
            cityCorporationCode: 'DSCC'
        };
        const result = await makeRequest('POST', '/admin/thanas', newThana);
        createdThanaId = result.data.id;
        console.log('✅ Create thana successful');
        console.log(`   Created thana: ${result.data.name} (ID: ${createdThanaId})`);
        return true;
    } catch (error) {
        console.error('❌ Create thana failed');
        return false;
    }
}

// Test 5: Get thana by ID
async function testGetThanaById() {
    console.log('\n📝 Test 5: Get Thana by ID');
    if (!createdThanaId) {
        console.log('⚠️  Skipping - no thana created');
        return true;
    }
    try {
        const result = await makeRequest('GET', `/admin/thanas/${createdThanaId}`);
        console.log('✅ Get thana by ID successful');
        console.log(`   Thana: ${result.data.name}`);
        console.log(`   City Corporation: ${result.data.cityCorporation.name}`);
        console.log(`   Status: ${result.data.status}`);
        return true;
    } catch (error) {
        console.error('❌ Get thana by ID failed');
        return false;
    }
}

// Test 6: Update thana
async function testUpdateThana() {
    console.log('\n📝 Test 6: Update Thana');
    if (!createdThanaId) {
        console.log('⚠️  Skipping - no thana created');
        return true;
    }
    try {
        const updateData = {
            name: 'Updated Test Thana ' + Date.now()
        };
        const result = await makeRequest('PUT', `/admin/thanas/${createdThanaId}`, updateData);
        console.log('✅ Update thana successful');
        console.log(`   Updated name: ${result.data.name}`);
        return true;
    } catch (error) {
        console.error('❌ Update thana failed');
        return false;
    }
}

// Test 7: Get thana statistics
async function testGetThanaStatistics() {
    console.log('\n📝 Test 7: Get Thana Statistics');
    if (!createdThanaId) {
        console.log('⚠️  Skipping - no thana created');
        return true;
    }
    try {
        const result = await makeRequest('GET', `/admin/thanas/${createdThanaId}/statistics`);
        console.log('✅ Get thana statistics successful');
        console.log(`   Total Users: ${result.data.totalUsers}`);
        console.log(`   Total Complaints: ${result.data.totalComplaints}`);
        return true;
    } catch (error) {
        console.error('❌ Get thana statistics failed');
        return false;
    }
}

// Test 8: Deactivate thana
async function testDeactivateThana() {
    console.log('\n📝 Test 8: Deactivate Thana');
    if (!createdThanaId) {
        console.log('⚠️  Skipping - no thana created');
        return true;
    }
    try {
        const result = await makeRequest('PUT', `/admin/thanas/${createdThanaId}`, { status: 'INACTIVE' });
        console.log('✅ Deactivate thana successful');
        console.log(`   Status: ${result.data.status}`);
        return true;
    } catch (error) {
        console.error('❌ Deactivate thana failed');
        return false;
    }
}

// Test 9: Try to create duplicate thana (should fail)
async function testCreateDuplicateThana() {
    console.log('\n📝 Test 9: Try to Create Duplicate Thana (should fail)');
    try {
        const duplicateThana = {
            name: 'Dhanmondi',
            cityCorporationCode: 'DSCC'
        };
        await makeRequest('POST', '/admin/thanas', duplicateThana);
        console.log('❌ Should have failed but succeeded');
        return false;
    } catch (error) {
        if (error.response?.status === 409) {
            console.log('✅ Correctly rejected duplicate thana');
            return true;
        }
        console.error('❌ Failed with unexpected error');
        return false;
    }
}

// Test 10: Try to get thanas without city corporation code (should fail)
async function testGetThanasWithoutCityCode() {
    console.log('\n📝 Test 10: Try to Get Thanas Without City Corporation Code (should fail)');
    try {
        await makeRequest('GET', '/admin/thanas');
        console.log('❌ Should have failed but succeeded');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected request without city corporation code');
            return true;
        }
        console.error('❌ Failed with unexpected error');
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('🧪 Starting Thana API Tests...');
    console.log('================================');

    const results = [];

    results.push(await testLogin());
    if (!authToken) {
        console.log('\n❌ Cannot continue without authentication');
        return;
    }

    results.push(await testGetThanasByCity());
    results.push(await testGetThanasWithStatusFilter());
    results.push(await testCreateThana());
    results.push(await testGetThanaById());
    results.push(await testUpdateThana());
    results.push(await testGetThanaStatistics());
    results.push(await testDeactivateThana());
    results.push(await testCreateDuplicateThana());
    results.push(await testGetThanasWithoutCityCode());

    console.log('\n================================');
    console.log('📊 Test Summary');
    console.log('================================');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log('\n⚠️  Some tests failed');
    }
}

// Run the tests
runTests().catch(console.error);
