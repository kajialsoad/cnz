/**
 * Test Login and Get Access Token
 * 
 * This script tests the login endpoint and retrieves an access token
 * that can be used for authenticated API requests.
 */

const http = require('http');

// Test user credentials
const testUsers = [
    {
        name: 'Demo User (Phone)',
        credentials: {
            phone: '01712345678',
            password: 'Demo123!@#'
        }
    },
    {
        name: 'Demo User (Email)',
        credentials: {
            email: 'customer1@demo.com',
            password: 'Demo123!@#'
        }
    }
];

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testLogin(user) {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify(user.credentials);

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        log(`\n${'='.repeat(60)}`, 'blue');
        log(`Testing: ${user.name}`, 'bold');
        log(`Credentials: ${JSON.stringify(user.credentials, null, 2)}`, 'yellow');
        log('='.repeat(60), 'blue');

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                log(`\nStatus Code: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');

                try {
                    const json = JSON.parse(data);

                    if (json.success && json.data && json.data.accessToken) {
                        log('\n✅ LOGIN SUCCESSFUL!', 'green');
                        log('\n📋 Response Data:', 'bold');
                        console.log(JSON.stringify(json, null, 2));

                        log('\n🔑 Access Token:', 'bold');
                        log(json.data.accessToken, 'green');

                        log('\n🔄 Refresh Token:', 'bold');
                        log(json.data.refreshToken, 'green');

                        if (json.data.user) {
                            log('\n👤 User Info:', 'bold');
                            console.log(JSON.stringify(json.data.user, null, 2));
                        }

                        resolve({
                            success: true,
                            user: user.name,
                            token: json.data.accessToken,
                            refreshToken: json.data.refreshToken,
                            userData: json.data.user
                        });
                    } else {
                        log('\n❌ LOGIN FAILED!', 'red');
                        log('Response:', 'yellow');
                        console.log(JSON.stringify(json, null, 2));
                        resolve({
                            success: false,
                            user: user.name,
                            error: json.message || 'Unknown error'
                        });
                    }
                } catch (e) {
                    log('\n❌ ERROR: Could not parse JSON response', 'red');
                    log('Raw Response:', 'yellow');
                    console.log(data);
                    resolve({
                        success: false,
                        user: user.name,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });

        req.on('error', (error) => {
            log(`\n❌ REQUEST ERROR: ${error.message}`, 'red');
            log('Make sure the backend server is running on port 4000', 'yellow');
            resolve({
                success: false,
                user: user.name,
                error: error.message
            });
        });

        req.write(loginData);
        req.end();
    });
}

// Test authenticated endpoint with token
function testAuthenticatedEndpoint(token) {
    return new Promise((resolve, reject) => {
        log(`\n${'='.repeat(60)}`, 'blue');
        log('Testing Authenticated Endpoint: /api/users/me', 'bold');
        log('='.repeat(60), 'blue');

        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/users/me',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                log(`\nStatus Code: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'red');

                try {
                    const json = JSON.parse(data);

                    if (res.statusCode === 200) {
                        log('\n✅ AUTHENTICATED REQUEST SUCCESSFUL!', 'green');
                        log('\n👤 User Profile:', 'bold');
                        console.log(JSON.stringify(json, null, 2));
                        resolve({ success: true, data: json });
                    } else {
                        log('\n❌ AUTHENTICATED REQUEST FAILED!', 'red');
                        log('Response:', 'yellow');
                        console.log(JSON.stringify(json, null, 2));
                        resolve({ success: false, error: json.message });
                    }
                } catch (e) {
                    log('\n❌ ERROR: Could not parse JSON response', 'red');
                    log('Raw Response:', 'yellow');
                    console.log(data);
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', (error) => {
            log(`\n❌ REQUEST ERROR: ${error.message}`, 'red');
            resolve({ success: false, error: error.message });
        });

        req.end();
    });
}

// Main test execution
async function runTests() {
    log('\n' + '='.repeat(60), 'blue');
    log('🧪 LOGIN AND TOKEN TEST SUITE', 'bold');
    log('='.repeat(60), 'blue');
    log('\nTesting backend server at: http://localhost:4000', 'yellow');

    const results = [];

    // Test all users
    for (const user of testUsers) {
        const result = await testLogin(user);
        results.push(result);

        // If login successful, test authenticated endpoint
        if (result.success && result.token) {
            await testAuthenticatedEndpoint(result.token);
        }

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('📊 TEST SUMMARY', 'bold');
    log('='.repeat(60), 'blue');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    log(`\nTotal Tests: ${results.length}`, 'yellow');
    log(`✅ Successful: ${successful}`, 'green');
    log(`❌ Failed: ${failed}`, 'red');

    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const color = result.success ? 'green' : 'red';
        log(`\n${status} ${result.user}`, color);
        if (!result.success) {
            log(`   Error: ${result.error}`, 'red');
        }
    });

    // Save token to file for easy access
    const successfulResult = results.find(r => r.success);
    if (successfulResult) {
        const fs = require('fs');
        const tokenData = {
            accessToken: successfulResult.token,
            refreshToken: successfulResult.refreshToken,
            user: successfulResult.userData,
            timestamp: new Date().toISOString(),
            expiresIn: '24h'
        };

        fs.writeFileSync(
            'test-token.json',
            JSON.stringify(tokenData, null, 2)
        );

        log('\n💾 Token saved to: test-token.json', 'green');
        log('You can use this token for testing authenticated endpoints', 'yellow');
    }

    log('\n' + '='.repeat(60), 'blue');
}

// Run the tests
runTests().catch(error => {
    log(`\n❌ FATAL ERROR: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
