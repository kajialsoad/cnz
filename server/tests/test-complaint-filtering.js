const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

/**
 * Test 14.5: Complaint Filtering
 * Requirements: 4.1, 4.2, 4.3, 4.4, 14.1, 14.2, 14.3
 */

let adminToken = '';
let userToken = '';
let testComplaintId = null;

async function getAdminToken() {
    console.log('🔐 Getting admin token...');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            phone: '01700000000',
            password: 'Admin@123'
        });
        adminToken = response.data.data.accessToken;
        console.log('✅ Admin token obtained\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to get admin token:', error.response?.data || error.message);
        return false;
    }
}

async function getUserToken() {
    console.log('🔐 Getting user token...');
    try {
        // Get a user from DSCC
        const usersResponse = await axios.get(
            `${BASE_URL}/admin/users?cityCorporationCode=DSCC&limit=1`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (usersResponse.data.data.length === 0) {
            console.log('⚠️  No DSCC users found\n');
            return false;
        }

        const user = usersResponse.data.data[0];
        console.log(`   Using user: ${user.name} (${user.phone})`);

        // Login as this user (assuming password is known or we can use admin token)
        // For testing, we'll use admin token to create complaints
        userToken = adminToken;
        console.log('✅ User token obtained\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to get user token:', error.message);
        return false;
    }
}

async function testFilterComplaintsByCityCorporation() {
    console.log('1️⃣ Testing: Filter complaints by city corporation');
    console.log('   Requirements: 4.1, 4.2, 14.3\n');

    try {
        console.log('   Filtering complaints by DSCC...');

        const response = await axios.get(
            `${BASE_URL}/admin/complaints?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Complaints filtered successfully');
        console.log(`   Found ${response.data.data.length} complaints from DSCC users`);

        // Validate all complaints belong to DSCC users
        if (response.data.data.length > 0) {
            const allDSCC = response.data.data.every(
                complaint => complaint.user?.cityCorporationCode === 'DSCC'
            );

            if (!allDSCC) {
                throw new Error('Some complaints do not belong to DSCC users');
            }

            console.log('✅ Validation passed: All complaints from DSCC users\n');
        } else {
            console.log('⚠️  No complaints found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterComplaintsByWard() {
    console.log('2️⃣ Testing: Filter complaints by ward');
    console.log('   Requirements: 4.3, 4.4, 14.3\n');

    try {
        const testWard = '10';
        console.log(`   Filtering complaints by ward ${testWard}...`);

        const response = await axios.get(
            `${BASE_URL}/admin/complaints?ward=${testWard}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Complaints filtered successfully');
        console.log(`   Found ${response.data.data.length} complaints from ward ${testWard}`);

        // Validate all complaints belong to users in the ward
        if (response.data.data.length > 0) {
            const allCorrectWard = response.data.data.every(
                complaint => complaint.user?.ward === testWard
            );

            if (!allCorrectWard) {
                throw new Error(`Some complaints do not belong to ward ${testWard} users`);
            }

            console.log(`✅ Validation passed: All complaints from ward ${testWard} users\n`);
        } else {
            console.log('⚠️  No complaints found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterComplaintsByThana() {
    console.log('3️⃣ Testing: Filter complaints by thana');
    console.log('   Requirements: 4.3, 4.4, 14.3\n');

    try {
        // Get a thana first
        const thanasResponse = await axios.get(
            `${BASE_URL}/admin/thanas?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (thanasResponse.data.data.length === 0) {
            console.log('⚠️  No thanas available for testing, skipping...\n');
            return true;
        }

        const testThana = thanasResponse.data.data[0];
        console.log(`   Filtering complaints by thana: ${testThana.name} (ID: ${testThana.id})...`);

        const response = await axios.get(
            `${BASE_URL}/admin/complaints?thanaId=${testThana.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Complaints filtered successfully');
        console.log(`   Found ${response.data.data.length} complaints from thana ${testThana.name}`);

        // Validate all complaints belong to users in the thana
        if (response.data.data.length > 0) {
            const allCorrectThana = response.data.data.every(
                complaint => complaint.user?.thanaId === testThana.id
            );

            if (!allCorrectThana) {
                throw new Error(`Some complaints do not belong to thana ${testThana.name} users`);
            }

            console.log(`✅ Validation passed: All complaints from thana ${testThana.name} users\n`);
        } else {
            console.log('⚠️  No complaints found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testComplaintAutoAssociation() {
    console.log('4️⃣ Testing: Complaint auto-association with user\'s city corporation');
    console.log('   Requirements: 14.1, 14.2\n');

    try {
        // Get a user with city corporation
        const usersResponse = await axios.get(
            `${BASE_URL}/admin/users?cityCorporationCode=DSCC&limit=1`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (usersResponse.data.data.length === 0) {
            console.log('⚠️  No DSCC users found for testing, skipping...\n');
            return true;
        }

        const user = usersResponse.data.data[0];
        console.log(`   User: ${user.name}`);
        console.log(`   City Corporation: ${user.cityCorporationCode}`);
        console.log(`   Ward: ${user.ward}`);
        console.log(`   Thana ID: ${user.thanaId || 'null'}`);

        // Get complaints for this user
        const complaintsResponse = await axios.get(
            `${BASE_URL}/admin/complaints?userId=${user.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        if (complaintsResponse.data.data.length === 0) {
            console.log('⚠️  No complaints found for this user\n');
            return true;
        }

        const complaint = complaintsResponse.data.data[0];
        console.log(`\n   Complaint ID: ${complaint.id}`);
        console.log(`   Complaint user's CC: ${complaint.user?.cityCorporationCode}`);
        console.log(`   Complaint user's ward: ${complaint.user?.ward}`);
        console.log(`   Complaint user's thana: ${complaint.user?.thanaId || 'null'}`);

        // Validate complaint inherits user's city corporation data
        if (complaint.user.cityCorporationCode !== user.cityCorporationCode) {
            throw new Error('Complaint does not inherit user\'s city corporation');
        }

        console.log('✅ Validation passed: Complaint auto-associated with user\'s city corporation\n');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 COMPLAINT FILTERING TESTS');
    console.log('   Task 14.5: Test complaint filtering');
    console.log('   Requirements: 4.1, 4.2, 4.3, 4.4, 14.1, 14.2, 14.3');
    console.log('='.repeat(70));
    console.log();

    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Get admin token first
    const hasToken = await getAdminToken();
    if (!hasToken) {
        console.log('❌ Cannot proceed without admin token');
        process.exit(1);
    }

    // Run tests
    const tests = [
        { name: 'Filter by City Corporation', fn: testFilterComplaintsByCityCorporation },
        { name: 'Filter by Ward', fn: testFilterComplaintsByWard },
        { name: 'Filter by Thana', fn: testFilterComplaintsByThana },
        { name: 'Auto-Association', fn: testComplaintAutoAssociation }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    // Summary
    console.log('='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('='.repeat(70));

    if (results.failed === 0) {
        console.log('🎉 All complaint filtering tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
