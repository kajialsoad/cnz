
import axios from 'axios';

const API_URL = 'http://127.0.0.1:4000/api';

async function testCityWards() {
    try {
        // 1. Get active city corporations to find a valid code
        console.log('Fetching active city corporations...');
        const cityRes = await axios.get(`${API_URL}/city-corporations/active`);
        const cities = cityRes.data.cityCorporations;

        if (!cities || cities.length === 0) {
            console.log('No active city corporations found.');
            return;
        }

        const testCityCode = cities[0].code;
        console.log(`Testing with City Code: ${testCityCode}`);

        // 2. Fetch wards for this city
        console.log(`Fetching wards for city code: ${testCityCode}...`);
        const wardsRes = await axios.get(`${API_URL}/city-corporations/${testCityCode}/wards`);

        if (wardsRes.data.success) {
            console.log('Successfully fetched wards!');
            const wards = wardsRes.data.data;
            console.log(`Found ${wards.length} wards.`);

            if (wards.length > 0) {
                const firstWard = wards[0];
                console.log('Sample Ward:', JSON.stringify(firstWard, null, 2));

                // Verify Zone info is present
                if (firstWard.zone && firstWard.zone.id && firstWard.zone.name) {
                    console.log('PASS: Ward contains Zone information.');
                } else {
                    console.error('FAIL: Ward is missing Zone information.');
                }
            } else {
                console.log('No wards found for this city to verify structure.');
            }

        } else {
            console.error('Failed to fetch wards:', wardsRes.data.message);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        console.error('Error Code:', error.code);
        if (error.stack) console.error('Stack:', error.stack);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testCityWards();
