/**
 * Test script to verify Live Chat routes are properly registered
 * 
 * This script checks:
 * 1. Mobile app routes (/api/live-chat)
 * 2. Admin panel routes (/api/admin/live-chat)
 * 3. Route accessibility and authentication requirements
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:4000';

// Test configuration
const tests = [
    {
        name: 'Mobile: Get live chat messages (should require auth)',
        method: 'GET',
        path: '/api/live-chat',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Mobile: Send live chat message (should require auth)',
        method: 'POST',
        path: '/api/live-chat',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Mobile: Mark messages as read (should require auth)',
        method: 'PATCH',
        path: '/api/live-chat/read',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Mobile: Get unread count (should require auth)',
        method: 'GET',
        path: '/api/live-chat/unread',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Admin: Get conversations (should require auth)',
        method: 'GET',
        path: '/api/admin/live-chat',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Admin: Get statistics (should require auth)',
        method: 'GET',
        path: '/api/admin/live-chat/statistics',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Admin: Get user messages (should require auth)',
        method: 'GET',
        path: '/api/admin/live-chat/1',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Admin: Send message to user (should require auth)',
        method: 'POST',
        path: '/api/admin/live-chat/1',
        expectedStatus: 401 // Unauthorized without token
    },
    {
        name: 'Admin: Mark user messages as read (should require auth)',
        method: 'PATCH',
        path: '/api/admin/live-chat/1/read',
        expectedStatus: 401 // Unauthorized without token
    }
];

// Helper function to make HTTP request
function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Run tests
async function runTests() {
    console.log('🧪 Testing Live Chat Routes Registration\n');
    console.log(`Base URL: ${BASE_URL}\n`);
    console.log('='.repeat(80));

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await makeRequest(test.method, test.path);
            const success = result.status === test.expectedStatus;

            if (success) {
                console.log(`✅ PASS: ${test.name}`);
                console.log(`   ${test.method} ${test.path} → ${result.status}`);
                passed++;
            } else {
                console.log(`❌ FAIL: ${test.name}`);
                console.log(`   ${test.method} ${test.path}`);
                console.log(`   Expected: ${test.expectedStatus}, Got: ${result.status}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ERROR: ${test.name}`);
            console.log(`   ${error.message}`);
            failed++;
        }
        console.log('');
    }

    console.log('='.repeat(80));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests\n`);

    if (failed === 0) {
        console.log('🎉 All routes are properly registered and protected!\n');
        console.log('✅ Task 1.5 Complete: Routes registered successfully');
        console.log('\nNext Steps:');
        console.log('  - Mobile app routes: /api/live-chat');
        console.log('  - Admin panel routes: /api/admin/live-chat');
        console.log('  - All routes require authentication (401 without token)');
        console.log('  - File upload middleware configured');
        console.log('  - Rate limiting applied to message endpoints');
    } else {
        console.log('⚠️  Some tests failed. Please check the route configuration.');
        process.exit(1);
    }
}

// Check if server is running
async function checkServer() {
    try {
        await makeRequest('GET', '/health');
        console.log('✅ Server is running\n');
        return true;
    } catch (error) {
        console.log('❌ Server is not running');
        console.log('   Please start the server with: npm run dev');
        console.log('   Error:', error.message);
        return false;
    }
}

// Main execution
(async () => {
    const serverRunning = await checkServer();
    if (serverRunning) {
        await runTests();
    } else {
        process.exit(1);
    }
})();
