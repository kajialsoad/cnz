const http = require('http');

// Test login
const loginData = JSON.stringify({
    phone: '01712345678',
    password: 'Demo123!@#'
});

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

console.log('Testing login with phone: 01712345678');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:', data);
        try {
            const json = JSON.parse(data);
            console.log('Parsed:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Could not parse JSON');
        }
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(loginData);
req.end();
