/**
 * Manual test script for category statistics API
 * 
 * This script tests the getCategoryStats() method from analyticsService
 * 
 * Usage:
 * 1. Make sure the backend server is running
 * 2. Make sure you have a valid admin token
 * 3. Run: node test-category-stats.js
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Replace with a valid admin token
const ADMIN_TOKEN = 'your-admin-token-here';

async function testCategoryStats() {
    console.log('🧪 Testing Category Statistics API...\n');

    try {
        // Test 1: Get all category statistics
        console.log('Test 1: Get all category statistics');
        const response1 = await axios.get(
            `${API_BASE_URL}/api/admin/analytics/categories`,
            {
                headers: {
                    Authorization: `Bearer ${ADMIN_TOKEN}`,
                },
            }
        );

        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response1.data, null, 2));
        console.log('\n---\n');

        // Test 2: Get category statistics with date range
        console.log('Test 2: Get category statistics with date range');
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';

        const response2 = await axios.get(
            `${API_BASE_URL}/api/admin/analytics/categories`,
            {
                headers: {
                    Authorization: `Bearer ${ADMIN_TOKEN}`,
                },
                params: {
                    startDate,
                    endDate,
                },
            }
        );

        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response2.data, null, 2));
        console.log('\n---\n');

        // Test 3: Get category trends
        console.log('Test 3: Get category trends');
        const response3 = await axios.get(
            `${API_BASE_URL}/api/admin/analytics/categories/trends`,
            {
                headers: {
                    Authorization: `Bearer ${ADMIN_TOKEN}`,
                },
                params: {
                    period: 'week',
                },
            }
        );

        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response3.data, null, 2));
        console.log('\n---\n');

        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

// Run tests
testCategoryStats();
