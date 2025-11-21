/**
 * Test script for auth service city corporation validation
 * Tests Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 12.4, 12.5, 12.6
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Test data
const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test.cityvalidation.${Date.now()}@example.com`,
    phone: `01700${Math.floor(Math.random() * 1000000)}`,
    password: 'Test123456',
    address: '123 Test Street'
};

async function testAuthCityCorporationValidation() {
    console.log('🧪 Testing Auth Service City Corporation Validation\n');
    console.log('='.repeat(60));

    try {
        // Test 1: Get active city corporations
        console.log('\n📋 Test 1: Fetching active city corporations...');
        const cityCorporationsResponse = await axios.get(
            `${API_BASE_URL}/city-corporations/active`
        );
        const cityCorporations = cityCorporationsResponse.data.cityCorporations;
        console.log(`✅ Found ${cityCorporations.length} active city corporations`);

        if (cityCorporations.length === 0) {
            console.log('❌ No active city corporations found. Please seed the database first.');
            return;
        }

        const dscc = cityCorporations.find(cc => cc.code === 'DSCC');
        if (!dscc) {
            console.log('❌ DSCC not found. Using first available city corporation.');
            return;
        }
        console.log(`   Using: ${dscc.name} (${dscc.code})`);
        console.log(`   Ward range: ${dscc.minWard} - ${dscc.maxWard}`);

        // Test 2: Get thanas for city corporation
        console.log('\n📋 Test 2: Fetching thanas for city corporation...');
        const thanasResponse = await axios.get(
            `${API_BASE_URL}/city-corporations/${dscc.code}/thanas`
        );
        const thanas = thanasResponse.data.thanas;
        console.log(`✅ Found ${thanas.length} thanas for ${dscc.code}`);

        const testThana = thanas.length > 0 ? thanas[0] : null;
        if (testThana) {
            console.log(`   Using thana: ${testThana.name} (ID: ${testThana.id})`);
        }

        // Test 3: Register with valid city corporation and ward
        console.log('\n📋 Test 3: Register with valid city corporation and ward...');
        try {
            const validRegistration = await axios.post(`${API_BASE_URL}/auth/register`, {
                ...testUser,
                cityCorporationCode: dscc.code,
                ward: dscc.minWard.toString(),
                thanaId: testThana?.id
            });
            console.log('✅ Registration successful with valid city corporation');
            console.log(`   Response: ${validRegistration.data.message}`);
        } catch (error) {
            console.log('❌ Registration failed:', error.response?.data?.message || error.message);
        }

        // Test 4: Register with invalid ward (below range)
        console.log('\n📋 Test 4: Register with invalid ward (below range)...');
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                ...testUser,
                email: `test.invalid1.${Date.now()}@example.com`,
                phone: `01700${Math.floor(Math.random() * 1000000)}`,
                cityCorporationCode: dscc.code,
                ward: (dscc.minWard - 1).toString()
            });
            console.log('❌ Should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected invalid ward (below range)');
                console.log(`   Error: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 5: Register with invalid ward (above range)
        console.log('\n📋 Test 5: Register with invalid ward (above range)...');
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                ...testUser,
                email: `test.invalid2.${Date.now()}@example.com`,
                phone: `01700${Math.floor(Math.random() * 1000000)}`,
                cityCorporationCode: dscc.code,
                ward: (dscc.maxWard + 1).toString()
            });
            console.log('❌ Should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected invalid ward (above range)');
                console.log(`   Error: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 6: Register with non-existent city corporation
        console.log('\n📋 Test 6: Register with non-existent city corporation...');
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                ...testUser,
                email: `test.invalid3.${Date.now()}@example.com`,
                phone: `01700${Math.floor(Math.random() * 1000000)}`,
                cityCorporationCode: 'INVALID',
                ward: '10'
            });
            console.log('❌ Should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected non-existent city corporation');
                console.log(`   Error: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        // Test 7: Register with thana from different city corporation
        if (thanas.length > 0) {
            console.log('\n📋 Test 7: Register with thana from different city corporation...');

            // Get DNCC if it exists
            const dncc = cityCorporations.find(cc => cc.code === 'DNCC');
            if (dncc) {
                try {
                    await axios.post(`${API_BASE_URL}/auth/register`, {
                        ...testUser,
                        email: `test.invalid4.${Date.now()}@example.com`,
                        phone: `01700${Math.floor(Math.random() * 1000000)}`,
                        cityCorporationCode: dncc.code,
                        ward: dncc.minWard.toString(),
                        thanaId: testThana.id // Using DSCC thana with DNCC
                    });
                    console.log('❌ Should have failed but succeeded');
                } catch (error) {
                    if (error.response?.status === 400) {
                        console.log('✅ Correctly rejected thana from different city corporation');
                        console.log(`   Error: ${error.response.data.message}`);
                    } else {
                        console.log('❌ Unexpected error:', error.message);
                    }
                }
            } else {
                console.log('⏭️  Skipped: DNCC not found');
            }
        }

        // Test 8: Register with invalid ward format
        console.log('\n📋 Test 8: Register with invalid ward format (non-numeric)...');
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                ...testUser,
                email: `test.invalid5.${Date.now()}@example.com`,
                phone: `01700${Math.floor(Math.random() * 1000000)}`,
                cityCorporationCode: dscc.code,
                ward: 'invalid'
            });
            console.log('❌ Should have failed but succeeded');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected invalid ward format');
                console.log(`   Error: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All auth city corporation validation tests completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run tests
testAuthCityCorporationValidation();
