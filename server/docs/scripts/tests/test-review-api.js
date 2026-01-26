/**
 * Review API Test Script
 * Tests all review endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

// Test configuration
const TEST_CONFIG = {
    // You'll need to replace these with actual values from your database
    userToken: 'YOUR_USER_TOKEN_HERE',
    adminToken: 'YOUR_ADMIN_TOKEN_HERE',
    resolvedComplaintId: 1, // Replace with actual resolved complaint ID
    userId: 1 // Replace with actual user ID
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

/**
 * Test 1: Submit Review
 */
async function testSubmitReview() {
    logSection('Test 1: Submit Review');

    try {
        logInfo('Submitting review for complaint...');

        const response = await axios.post(
            `${BASE_URL}/complaints/${TEST_CONFIG.resolvedComplaintId}/review`,
            {
                rating: 5,
                comment: 'Excellent service! The issue was resolved quickly and professionally.'
            },
            {
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.userToken}`
                }
            }
        );

        if (response.data.success) {
            logSuccess('Review submitted successfully');
            console.log('Review data:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } else {
            logError('Review submission failed');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        if (error.response?.status === 409) {
            logWarning('Review already exists for this complaint (expected if running test multiple times)');
            console.log('Error:', error.response.data.message);
        } else {
            logError('Error submitting review');
            console.log('Error:', error.response?.data || error.message);
        }
        return null;
    }
}

/**
 * Test 2: Submit Review with Invalid Rating
 */
async function testSubmitReviewInvalidRating() {
    logSection('Test 2: Submit Review with Invalid Rating (Should Fail)');

    try {
        logInfo('Attempting to submit review with rating > 5...');

        await axios.post(
            `${BASE_URL}/complaints/${TEST_CONFIG.resolvedComplaintId}/review`,
            {
                rating: 6, // Invalid - should be 1-5
                comment: 'This should fail'
            },
            {
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.userToken}`
                }
            }
        );

        logError('Validation should have failed but did not!');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess('Validation correctly rejected invalid rating');
            console.log('Error message:', error.response.data.message);
        } else {
            logError('Unexpected error');
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Test 3: Submit Review with Long Comment
 */
async function testSubmitReviewLongComment() {
    logSection('Test 3: Submit Review with Long Comment (Should Fail)');

    try {
        logInfo('Attempting to submit review with comment > 300 chars...');

        const longComment = 'A'.repeat(301); // 301 characters

        await axios.post(
            `${BASE_URL}/complaints/${TEST_CONFIG.resolvedComplaintId}/review`,
            {
                rating: 5,
                comment: longComment
            },
            {
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.userToken}`
                }
            }
        );

        logError('Validation should have failed but did not!');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess('Validation correctly rejected long comment');
            console.log('Error message:', error.response.data.message);
        } else {
            logError('Unexpected error');
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Test 4: Get Complaint Reviews
 */
async function testGetComplaintReviews() {
    logSection('Test 4: Get Complaint Reviews');

    try {
        logInfo('Fetching reviews for complaint...');

        const response = await axios.get(
            `${BASE_URL}/complaints/${TEST_CONFIG.resolvedComplaintId}/reviews`
        );

        if (response.data.success) {
            logSuccess(`Fetched ${response.data.data.length} review(s)`);
            console.log('Reviews:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } else {
            logError('Failed to fetch reviews');
            console.log('Response:', response.data);
            return [];
        }
    } catch (error) {
        logError('Error fetching reviews');
        console.log('Error:', error.response?.data || error.message);
        return [];
    }
}

/**
 * Test 5: Get Review Analytics (Admin)
 */
async function testGetReviewAnalytics() {
    logSection('Test 5: Get Review Analytics (Admin)');

    try {
        logInfo('Fetching review analytics...');

        const response = await axios.get(
            `${BASE_URL}/admin/complaints/analytics/reviews`,
            {
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.adminToken}`
                }
            }
        );

        if (response.data.success) {
            logSuccess('Analytics fetched successfully');
            console.log('Analytics:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } else {
            logError('Failed to fetch analytics');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        logError('Error fetching analytics');
        console.log('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 6: Get Review Analytics with Filters
 */
async function testGetReviewAnalyticsWithFilters() {
    logSection('Test 6: Get Review Analytics with Filters');

    try {
        logInfo('Fetching filtered review analytics...');

        const params = new URLSearchParams({
            cityCorporationCode: 'DSCC',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        });

        const response = await axios.get(
            `${BASE_URL}/admin/complaints/analytics/reviews?${params}`,
            {
                headers: {
                    Authorization: `Bearer ${TEST_CONFIG.adminToken}`
                }
            }
        );

        if (response.data.success) {
            logSuccess('Filtered analytics fetched successfully');
            console.log('Filtered Analytics:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } else {
            logError('Failed to fetch filtered analytics');
            console.log('Response:', response.data);
            return null;
        }
    } catch (error) {
        logError('Error fetching filtered analytics');
        console.log('Error:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 7: Unauthorized Access (No Token)
 */
async function testUnauthorizedAccess() {
    logSection('Test 7: Unauthorized Access (Should Fail)');

    try {
        logInfo('Attempting to submit review without authentication...');

        await axios.post(
            `${BASE_URL}/complaints/${TEST_CONFIG.resolvedComplaintId}/review`,
            {
                rating: 5,
                comment: 'This should fail'
            }
            // No Authorization header
        );

        logError('Should have been rejected but was not!');
    } catch (error) {
        if (error.response?.status === 401) {
            logSuccess('Correctly rejected unauthorized request');
            console.log('Error message:', error.response.data.message);
        } else {
            logError('Unexpected error');
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Test 8: Invalid Complaint ID
 */
async function testInvalidComplaintId() {
    logSection('Test 8: Invalid Complaint ID (Should Fail)');

    try {
        logInfo('Attempting to get reviews for invalid complaint ID...');

        await axios.get(`${BASE_URL}/complaints/invalid/reviews`);

        logError('Should have been rejected but was not!');
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess('Correctly rejected invalid complaint ID');
            console.log('Error message:', error.response.data.message);
        } else {
            logError('Unexpected error');
            console.log('Error:', error.response?.data || error.message);
        }
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    log('\n🧪 Review API Test Suite', 'cyan');
    log('Testing Review API endpoints\n', 'cyan');

    // Check configuration
    if (TEST_CONFIG.userToken === 'YOUR_USER_TOKEN_HERE') {
        logWarning('⚠️  Please update TEST_CONFIG with actual tokens and IDs');
        logInfo('You can get tokens by logging in and checking the response');
        logInfo('You need a resolved complaint ID that belongs to the user');
        return;
    }

    const results = {
        passed: 0,
        failed: 0,
        warnings: 0
    };

    // Run tests
    try {
        await testSubmitReview();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testSubmitReviewInvalidRating();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testSubmitReviewLongComment();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testGetComplaintReviews();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testGetReviewAnalytics();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testGetReviewAnalyticsWithFilters();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testUnauthorizedAccess();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    try {
        await testInvalidComplaintId();
        results.passed++;
    } catch (error) {
        results.failed++;
    }

    // Summary
    logSection('Test Summary');
    log(`Total Tests: ${results.passed + results.failed}`, 'cyan');
    logSuccess(`Passed: ${results.passed}`);
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }
    if (results.warnings > 0) {
        logWarning(`Warnings: ${results.warnings}`);
    }

    console.log('\n');
}

// Run tests
runAllTests().catch(error => {
    logError('Test suite failed');
    console.error(error);
    process.exit(1);
});
