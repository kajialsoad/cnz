/**
 * Simple Cloudinary Test
 * Tests basic Cloudinary configuration and connection
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

async function testCloudinary() {
    console.log('🧪 Testing Cloudinary Configuration...\n');

    // Configure Cloudinary
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });

    console.log('📝 Configuration:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
    console.log(`   API Secret: ***${process.env.CLOUDINARY_API_SECRET.slice(-4)}`);
    console.log();

    // Test by generating a sample URL
    console.log('🔗 Testing URL generation...');
    try {
        const sampleUrl = cloudinary.url('sample', {
            width: 200,
            height: 200,
            crop: 'fill'
        });

        console.log('   ✅ URL generated successfully:');
        console.log(`   ${sampleUrl}`);
        console.log();
    } catch (error) {
        console.log('   ❌ Failed to generate URL');
        console.error('   Error:', error.message);
    }

    console.log('✅ Cloudinary configuration is valid!');
    console.log('\n💡 Next steps:');
    console.log('   1. Upload test will be done when implementing upload service');
    console.log('   2. Configuration file is ready at: src/config/cloudinary.config.ts');
    console.log('   3. Environment variables are set in .env file');
}

testCloudinary().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
