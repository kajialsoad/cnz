/**
 * Test script for category analytics endpoints
 * Tests the new category statistics and trends endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api/admin/analytics';

// Test admin credentials
const ADMIN_EMAIL = 'admin@demo.com';
const ADMIN_PASSWORD = 'Demo123!@#';

let authToken = '';

/**
 * Login as admin to get auth token
 */
async function loginAsAdmin() {
    try {
        console.log('\n🔐 Logging in as admin...');
        const response = await axios.post('http://localhost:4000/api/admin/auth/login', {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (response.data.accessToken) {
            authToken = response.data.accessToken;
            console.log('✅ Login successful');
            return true;
        } else {
            console.error('❌ Login failed: No token received');
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test GET /api/admin/analytics/categories
 */
async function testGetCategoryStatistics() {
    try {
        console.log('\n📊 Testing GET /api/admin/analytics/categories...');

        const response = await axios.get(`${BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        console.log('✅ Category statistics retrieved successfully');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Validate response structure
        if (response.data.success && response.data.data.statistics) {
            const stats = response.data.data.statistics;
            console.log(`\n📈 Summary:`);
            console.log(`   Total Categories: ${response.data.data.totalCategories}`);
            console.log(`   Total Complaints: ${response.data.data.totalComplaints}`);

            stats.forEach(cat => {
                console.log(`\n   ${cat.categoryNameEn} (${cat.categoryNameBn}):`);
                console.log(`      Total: ${cat.totalCount} (${cat.percentage}%)`);
                console.log(`      Color: ${cat.categoryColor}`);
                console.log(`      Subcategories:`);
                cat.subcategories.forEach(sub => {
                    console.log(`         - ${sub.subcategoryNameEn}: ${sub.count} (${sub.percentage}%)`);
                });
            });

            return true;
        } else {
            console.error('❌ Invalid response structure');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test GET /api/admin/analytics/categories with date filter
 */
async function testGetCategoryStatisticsWithDateFilter() {
    try {
        console.log('\n📊 Testing GET /api/admin/analytics/categories with date filter...');

        const endDate = new Date().toISOString();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days

        const response = await axios.get(`${BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                startDate,
                endDate
            }
        });

        console.log('✅ Category statistics with date filter retrieved successfully');
        console.log(`   Date Range: ${startDate.split('T')[0]} to ${endDate.split('T')[0]}`);
        console.log(`   Total Categories: ${response.data.data.totalCategories}`);
        console.log(`   Total Complaints: ${response.data.data.totalComplaints}`);

        return true;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test GET /api/admin/analytics/categories/trends
 */
async function testGetCategoryTrends() {
    try {
        console.log('\n📈 Testing GET /api/admin/analytics/categories/trends...');

        const response = await axios.get(`${BASE_URL}/categories/trends`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                period: 'week'
            }
        });

        console.log('✅ Category trends retrieved successfully');

        if (response.data.success && response.data.data) {
            const { trends, categories } = response.data.data;

            console.log(`\n📊 Trend Data:`);
            console.log(`   Categories: ${categories.length}`);
            console.log(`   Data Points: ${trends.length}`);

            console.log(`\n   Available Categories:`);
            categories.forEach(cat => {
                console.log(`      - ${cat.nameEn} (${cat.nameBn}) - ${cat.color}`);
            });

            console.log(`\n   Sample Trend Data (first 3 points):`);
            trends.slice(0, 3).forEach(point => {
                console.log(`      ${point.date}: Total = ${point.total}`);
                categories.forEach(cat => {
                    if (point[cat.id] > 0) {
                        console.log(`         ${cat.nameEn}: ${point[cat.id]}`);
                    }
                });
            });

            return true;
        } else {
            console.error('❌ Invalid response structure');
            return false;
        }
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Test GET /api/admin/analytics/categories/trends with different periods
 */
async function testGetCategoryTrendsWithPeriods() {
    try {
        console.log('\n📈 Testing category trends with different periods...');

        const periods = ['day', 'week', 'month'];

        for (const period of periods) {
            console.log(`\n   Testing period: ${period}`);

            const response = await axios.get(`${BASE_URL}/categories/trends`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                params: {
                    period
                }
            });

            if (response.data.success) {
                const { trends } = response.data.data;
                console.log(`   ✅ ${period}: ${trends.length} data points`);
            } else {
                console.log(`   ❌ ${period}: Failed`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('🧪 Starting Category Analytics Tests...');
    console.log('=====================================');

    // Login first
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
        console.error('\n❌ Cannot proceed without authentication');
        process.exit(1);
    }

    // Run tests
    const results = {
        categoryStatistics: await testGetCategoryStatistics(),
        categoryStatisticsWithDate: await testGetCategoryStatisticsWithDateFilter(),
        categoryTrends: await testGetCategoryTrends(),
        categoryTrendsWithPeriods: await testGetCategoryTrendsWithPeriods()
    };

    // Summary
    console.log('\n=====================================');
    console.log('📋 Test Summary:');
    console.log('=====================================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests();
