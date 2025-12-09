const http = require('http');

async function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testLoginFlow() {
    console.log('🧪 Testing Login Flow\n');

    // Step 1: Login
    console.log('1️⃣ Testing Login API...');
    const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 4000,
        path: '/api/admin/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        email: 'master01@cc.app',
        password: '123456'
    });

    console.log('   Status:', loginResponse.status);
    if (loginResponse.status === 200) {
        console.log('   ✅ Login successful');
        console.log('   Access Token:', loginResponse.data.accessToken ? 'Present' : 'Missing');
        console.log('   Refresh Token:', loginResponse.data.refreshToken ? 'Present' : 'Missing');

        const accessToken = loginResponse.data.accessToken;

        // Step 2: Get Profile
        console.log('\n2️⃣ Testing Profile API...');
        const profileResponse = await makeRequest({
            hostname: 'localhost',
            port: 4000,
            path: '/api/admin/auth/me',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('   Status:', profileResponse.status);
        if (profileResponse.status === 200) {
            console.log('   ✅ Profile fetch successful');
            console.log('   Response format:', JSON.stringify(profileResponse.data, null, 2));
        } else {
            console.log('   ❌ Profile fetch failed');
            console.log('   Response:', profileResponse.data);
        }
    } else {
        console.log('   ❌ Login failed');
        console.log('   Response:', loginResponse.data);
    }
}

testLoginFlow().catch(console.error);
