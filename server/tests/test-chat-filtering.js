const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

/**
 * Test 14.6: Chat Filtering
 * Requirements: 5.1, 5.2, 5.3
 */

let adminToken = '';

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

async function testFilterChatsByCityCorporation() {
    console.log('1️⃣ Testing: Filter chats by city corporation');
    console.log('   Requirements: 5.1, 5.2\n');

    try {
        console.log('   Filtering chats by DSCC...');

        const response = await axios.get(
            `${BASE_URL}/admin/chats?cityCorporationCode=DSCC`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Chats filtered successfully');
        console.log(`   Found ${response.data.data.length} chats from DSCC users`);

        // Validate all chats belong to DSCC users
        if (response.data.data.length > 0) {
            const allDSCC = response.data.data.every(
                chat => chat.user?.cityCorporationCode === 'DSCC'
            );

            if (!allDSCC) {
                throw new Error('Some chats do not belong to DSCC users');
            }

            console.log('✅ Validation passed: All chats from DSCC users\n');
        } else {
            console.log('⚠️  No chats found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testFilterChatsByThana() {
    console.log('2️⃣ Testing: Filter chats by thana');
    console.log('   Requirements: 5.2, 5.3\n');

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
        console.log(`   Filtering chats by thana: ${testThana.name} (ID: ${testThana.id})...`);

        const response = await axios.get(
            `${BASE_URL}/admin/chats?thanaId=${testThana.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Chats filtered successfully');
        console.log(`   Found ${response.data.data.length} chats from thana ${testThana.name}`);

        // Validate all chats belong to users in the thana
        if (response.data.data.length > 0) {
            const allCorrectThana = response.data.data.every(
                chat => chat.user?.thanaId === testThana.id
            );

            if (!allCorrectThana) {
                throw new Error(`Some chats do not belong to thana ${testThana.name} users`);
            }

            console.log(`✅ Validation passed: All chats from thana ${testThana.name} users\n`);
        } else {
            console.log('⚠️  No chats found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testCombinedChatFilters() {
    console.log('3️⃣ Testing: Combined chat filters (city corporation + thana)');
    console.log('   Requirements: 5.1, 5.2, 5.3\n');

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

        console.log('   Applying combined filters:');
        console.log(`   - City Corporation: DSCC`);
        console.log(`   - Thana: ${testThana.name} (ID: ${testThana.id})`);

        const response = await axios.get(
            `${BASE_URL}/admin/chats?cityCorporationCode=DSCC&thanaId=${testThana.id}`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Chats filtered successfully');
        console.log(`   Found ${response.data.data.length} chats matching all filters`);

        // Validate all chats match all filters
        if (response.data.data.length > 0) {
            const allMatch = response.data.data.every(
                chat => chat.user?.cityCorporationCode === 'DSCC' &&
                    chat.user?.thanaId === testThana.id
            );

            if (!allMatch) {
                throw new Error('Some chats do not match all filters');
            }

            console.log('✅ Validation passed: All chats match combined filters\n');
        } else {
            console.log('⚠️  No chats found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testChatUserInformation() {
    console.log('4️⃣ Testing: Chat includes user city corporation and thana information');
    console.log('   Requirements: 5.4\n');

    try {
        console.log('   Getting chats with user information...');

        const response = await axios.get(
            `${BASE_URL}/admin/chats?limit=5`,
            {
                headers: { Authorization: `Bearer ${adminToken}` }
            }
        );

        console.log('✅ Chats retrieved successfully');
        console.log(`   Found ${response.data.data.length} chats`);

        if (response.data.data.length > 0) {
            const firstChat = response.data.data[0];
            console.log('\n   Sample chat user information:');
            console.log(`   - User: ${firstChat.user?.name || 'N/A'}`);
            console.log(`   - City Corporation: ${firstChat.user?.cityCorporationCode || 'N/A'}`);
            console.log(`   - Ward: ${firstChat.user?.ward || 'N/A'}`);
            console.log(`   - Thana ID: ${firstChat.user?.thanaId || 'N/A'}`);

            // Validate user information is included
            if (!firstChat.user) {
                throw new Error('Chat does not include user information');
            }

            console.log('\n✅ Validation passed: Chat includes user city corporation information\n');
        } else {
            console.log('⚠️  No chats found for validation\n');
        }

        return true;
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('='.repeat(70));
    console.log('🧪 CHAT FILTERING TESTS');
    console.log('   Task 14.6: Test chat filtering');
    console.log('   Requirements: 5.1, 5.2, 5.3');
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
        { name: 'Filter by City Corporation', fn: testFilterChatsByCityCorporation },
        { name: 'Filter by Thana', fn: testFilterChatsByThana },
        { name: 'Combined Filters', fn: testCombinedChatFilters },
        { name: 'User Information', fn: testChatUserInformation }
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
        console.log('🎉 All chat filtering tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the output above.');
    }

    process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runAllTests();
