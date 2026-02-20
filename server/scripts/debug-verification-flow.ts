
import axios from 'axios';

const API_URL = 'http://localhost:4000/api'; // Adjust port if needed

async function debugVerification() {
    console.log('Debugging Verification Process...');

    const testUser = {
        firstName: 'Test',
        lastName: 'User',
        phone: '01639038994', // Using the number from screenshot
        email: 'test.user.debug@example.com',
        password: 'password123',
        ward: '1',
        zone: '1',
        cityCorporationCode: 'DSCC', // Assuming Dhaka South
        zoneId: 1,
        wardId: 1
    };

    try {
        // 1. Register User (Expect Pending)
        console.log('\n1. Registering User...');
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, testUser);
            console.log('Registration Response:', regRes.data);
        } catch (e: any) {
            console.log('Registration Error (Expected if already exists):', e.response?.data?.message || e.message);
        }

        // 2. Simulate OTP Verification (You need the real code, but we can check if the API hits)
        console.log('\n2. Attempting Verification (with dummy code 123456)...');
        try {
            const verifyRes = await axios.post(`${API_URL}/auth/verify-registration`, {
                phone: testUser.phone,
                code: '123456' 
            });
            console.log('Verification Response:', verifyRes.data);
        } catch (e: any) {
            console.log('Verification Error:', e.response?.data?.message || e.message);
            // If error is "Invalid verification code", it means the endpoint is reachable and logic is working up to code check.
        }

    } catch (error: any) {
        console.error('Unexpected Error:', error.message);
    }
}

debugVerification();
