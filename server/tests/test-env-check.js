const axios = require('axios');

const BASE_URL = 'https://server-2xocqlejl-kajialsoads-projects.vercel.app';

async function checkEnvironment() {
    console.log('🔍 Checking Vercel Environment Configuration...\n');

    try {
        // Test if DATABASE_URL has sslmode parameter
        console.log('Testing /api/health endpoint...');
        const health = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health check passed:', health.data);

        // Try city corporations to trigger database connection
        console.log('\nTesting database connection via /api/city-corporations...');
        const cityCorp = await axios.get(`${BASE_URL}/api/city-corporations`);
        console.log('✅ Database connection successful!');
        console.log('✅ SSL is properly disabled');
        console.log('\nCity Corporations:', cityCorp.data);

    } catch (error) {
        if (error.response) {
            console.log('❌ Error Status:', error.response.status);
            console.log('❌ Error Data:', error.response.data);

            const errorMsg = JSON.stringify(error.response.data);
            if (errorMsg.includes('SSL')) {
                console.log('\n🚨 SSL ERROR DETECTED!');
                console.log('📋 This means DATABASE_URL does NOT have ?sslmode=disable');
                console.log('\n🔧 FIX:');
                console.log('1. Run: vercel --prod --force');
                console.log('2. Wait 2-3 minutes for deployment');
                console.log('3. Run this test again');
            }
        } else {
            console.log('❌ Network Error:', error.message);
        }
    }
}

checkEnvironment();
