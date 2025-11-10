const http = require('http');

// First login to get token
const loginData = JSON.stringify({
    phone: '01712345678',
    password: 'Demo123!@#'
});

const loginOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('Step 1: Logging in...');

const loginReq = http.request(loginOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Login Response:', data);
        try {
            const json = JSON.parse(data);
            if (json.success && json.data && json.data.accessToken) {
                const token = json.data.accessToken;
                console.log('\nStep 2: Getting user profile...');

                // Now get user profile
                const profileOptions = {
                    hostname: 'localhost',
                    port: 4000,
                    path: '/api/users/me',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                };

                const profileReq = http.request(profileOptions, (profileRes) => {
                    let profileData = '';

                    profileRes.on('data', (chunk) => {
                        profileData += chunk;
                    });

                    profileRes.on('end', () => {
                        console.log('Profile Response Status:', profileRes.statusCode);
                        console.log('Profile Response:', profileData);
                        try {
                            const profileJson = JSON.parse(profileData);
                            console.log('\nParsed Profile:', JSON.stringify(profileJson, null, 2));
                        } catch (e) {
                            console.log('Could not parse profile JSON');
                        }
                    });
                });

                profileReq.on('error', (error) => {
                    console.error('Profile Error:', error.message);
                });

                profileReq.end();
            }
        } catch (e) {
            console.log('Could not parse login JSON');
        }
    });
});

loginReq.on('error', (error) => {
    console.error('Login Error:', error.message);
});

loginReq.write(loginData);
loginReq.end();
