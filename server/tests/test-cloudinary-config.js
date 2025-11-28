/**
 * Test Cloudinary Configuration
 * 
 * This script tests the Cloudinary configuration to ensure:
 * 1. Environment variables are loaded correctly
 * 2. Cloudinary SDK is initialized properly
 * 3. Connection to Cloudinary is working
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

async function testCloudinaryConfig() {
    console.log('🧪 Testing Cloudinary Configuration...\n');

    // Test 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    const requiredVars = {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    };

    let allVarsPresent = true;
    for (const [key, value] of Object.entries(requiredVars)) {
        if (value) {
            console.log(`   ✅ ${key}: ${key === 'CLOUDINARY_API_SECRET' ? '***' + value.slice(-4) : value}`);
        } else {
            console.log(`   ❌ ${key}: Missing!`);
            allVarsPresent = false;
        }
    }

    if (!allVarsPresent) {
        console.log('\n❌ Some environment variables are missing!');
        process.exit(1);
    }

    console.log('\n2️⃣ Initializing Cloudinary SDK...');
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });

        console.log('   ✅ Cloudinary SDK initialized successfully');
    } catch (error) {
        console.log('   ❌ Failed to initialize Cloudinary SDK');
        console.error('   Error:', error.message);
        process.exit(1);
    }

    console.log('\n3️⃣ Testing Cloudinary API connection...');
    try {
        // Test API by getting account details
        const result = await cloudinary.api.ping();

        if (result.status === 'ok') {
            console.log('   ✅ Successfully connected to Cloudinary API');
            console.log(`   📊 Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        }
    } catch (error) {
        console.log('   ❌ Failed to connect to Cloudinary API');
        console.error('   Error:', error.message);

        if (error.http_code === 401) {
            console.log('\n   💡 Tip: Check if your API credentials are correct');
        }

        process.exit(1);
    }

    console.log('\n✅ All Cloudinary configuration tests passed!');
    console.log('\n📝 Configuration Summary:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
    console.log(`   Folder: ${process.env.CLOUDINARY_FOLDER || 'clean-care'}`);
    console.log(`   Enabled: ${process.env.CLOUDINARY_ENABLED !== 'false' ? 'Yes' : 'No'}`);
    console.log('\n🎉 Cloudinary is ready to use!');
}

// Run the test
testCloudinaryConfig().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
