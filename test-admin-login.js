const fetch = require('node-fetch');

async function testLogin() {
    console.log('🔐 Testing Admin Login API...\n');

    const loginData = {
        email: 'superadmin@demo.com',
        password: 'Demo123@#'
    };

    console.log('📤 Sending login request to: http://localhost:4000/api/admin/auth/login');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    console.log('');

    try {
        const response = await fetch('http://localhost:4000/api/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });

        console.log('📊 Response Status:', response.status, response.statusText);

        const data = await response.json();
        console.log('\n📦 Response Data:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ Login Successful!');
            console.log('👤 User:', data.data.user.firstName, data.data.user.lastName);
            console.log('🎭 Role:', data.data.user.role);
            console.log('🎫 Token:', data.data.token.substring(0, 50) + '...');
        } else {
            console.log('\n❌ Login Failed!');
            console.log('Error:', data.message);
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testLogin();
