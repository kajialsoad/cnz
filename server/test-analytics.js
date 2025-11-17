/**
 * Test script for Analytics Service
 * This script tests the analytics service methods
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

// Test credentials (use your admin credentials)
const ADMIN_CREDENTIALS = {
    email: 'admin@demo.com',
    password: 'Demo123!@#'
};

let authToken = '';

async function login() {
    try {
        console.log('🔐 Logging in as admin...');
        const response = await axios.post(`${BASE_URL}/api/admin/auth/login`, ADMIN_CREDENTIALS);

        if (response.data.accessToken) {
            authToken = response.data.accessToken;
            console.log('✅ Login successful');
            return true;
        } else {
            console.error('❌ Login failed:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message);
        return false;
    }
}

async function testGetComplaintAnalytics() {
    try {
        console.log('\n📊 Testing getComplaintAnalytics...');

        const response = await axios.get(`${BASE_URL}/api/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                period: 'month'
            }
        });

        if (response.data.success) {
            console.log('✅ Analytics retrieved successfully');
            console.log('📈 Total Complaints:', response.data.data.totalComplaints);
            console.log('📊 Status Breakdown:', response.data.data.statusBreakdown);
            console.log('📋 Category Breakdown:', response.data.data.categoryBreakdown);
            console.log('🗺️  Ward Breakdown:', response.data.data.wardBreakdown);
            console.log('⏱️  Average Resolution Time:', response.data.data.averageResolutionTime, 'hours');
            console.log('✔️  Resolution Rate:', response.data.data.resolutionRate, '%');
            return true;
        } else {
            console.error('❌ Failed to get analytics:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error getting analytics:', error.response?.data || error.message);
        return false;
    }
}

async function testGetComplaintTrends() {
    try {
        console.log('\n📈 Testing getComplaintTrends...');

        const response = await axios.get(`${BASE_URL}/api/admin/analytics/trends`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                period: 'week'
            }
        });

        if (response.data.success) {
            console.log('✅ Trends retrieved successfully');
            console.log('📊 Trend Data Points:', response.data.data.trends.length);

            // Show first few data points
            const sampleData = response.data.data.trends.slice(0, 5);
            console.log('📅 Sample Trend Data:');
            sampleData.forEach(point => {
                console.log(`  ${point.date}: ${point.count} total (${point.resolved} resolved, ${point.pending} pending, ${point.inProgress} in progress)`);
            });

            return true;
        } else {
            console.error('❌ Failed to get trends:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error getting trends:', error.response?.data || error.message);
        return false;
    }
}

async function testAnalyticsWithDateRange() {
    try {
        console.log('\n📅 Testing analytics with date range...');

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // Last 3 months

        const response = await axios.get(`${BASE_URL}/api/admin/analytics`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });

        if (response.data.success) {
            console.log('✅ Analytics with date range retrieved successfully');
            console.log('📈 Total Complaints (last 3 months):', response.data.data.totalComplaints);
            console.log('📊 Status Breakdown:', response.data.data.statusBreakdown);
            return true;
        } else {
            console.error('❌ Failed to get analytics with date range:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error getting analytics with date range:', error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Starting Analytics Service Tests\n');
    console.log('='.repeat(50));

    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('\n❌ Cannot proceed without authentication');
        return;
    }

    // Run tests
    const results = {
        analytics: await testGetComplaintAnalytics(),
        trends: await testGetComplaintTrends(),
        dateRange: await testAnalyticsWithDateRange()
    };

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 Test Summary:');
    console.log('  - Get Analytics:', results.analytics ? '✅ PASS' : '❌ FAIL');
    console.log('  - Get Trends:', results.trends ? '✅ PASS' : '❌ FAIL');
    console.log('  - Date Range Filter:', results.dateRange ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(r => r === true);
    console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));
    console.log('='.repeat(50));
}

// Run the tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
