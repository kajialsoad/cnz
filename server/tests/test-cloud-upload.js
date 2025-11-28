/**
 * Test Cloud Upload Service
 * 
 * This script tests the cloud upload service with a sample image
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// We'll test with a simple 1x1 pixel PNG image
const createTestImage = () => {
    // 1x1 transparent PNG (base64)
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    return Buffer.from(base64Image, 'base64');
};

async function testCloudUpload() {
    console.log('🧪 Testing Cloud Upload Service...\n');

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.log('❌ Cloudinary is not configured!');
        console.log('   Please add CLOUDINARY_* variables to .env file');
        process.exit(1);
    }

    console.log('✅ Cloudinary configuration found');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log();

    // Import Cloudinary and configure
    const { v2: cloudinary } = require('cloudinary');

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });

    // Create test image
    console.log('📝 Creating test image...');
    const testImageBuffer = createTestImage();
    console.log(`   Size: ${testImageBuffer.length} bytes`);
    console.log();

    // Test upload
    console.log('📤 Testing image upload...');
    try {
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'clean-care/test',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Create readable stream from buffer
            const { Readable } = require('stream');
            const readable = new Readable();
            readable.push(testImageBuffer);
            readable.push(null);
            readable.pipe(uploadStream);
        });

        console.log('✅ Upload successful!');
        console.log(`   URL: ${result.secure_url}`);
        console.log(`   Public ID: ${result.public_id}`);
        console.log(`   Format: ${result.format}`);
        console.log(`   Size: ${result.bytes} bytes`);
        console.log();

        // Test thumbnail URL generation
        console.log('🖼️  Testing thumbnail URL generation...');
        const thumbnailUrl = cloudinary.url(result.public_id, {
            transformation: 'w_200,h_200,c_fill,q_auto,f_auto',
            secure: true,
        });
        console.log(`   Thumbnail URL: ${thumbnailUrl}`);
        console.log();

        // Clean up - delete test image
        console.log('🗑️  Cleaning up test image...');
        await cloudinary.uploader.destroy(result.public_id);
        console.log('✅ Test image deleted');
        console.log();

        console.log('🎉 All tests passed!');
        console.log('\n💡 Cloud Upload Service is ready to use!');
        console.log('   - Image upload: ✅');
        console.log('   - URL generation: ✅');
        console.log('   - File deletion: ✅');
    } catch (error) {
        console.log('❌ Upload test failed!');
        console.error('   Error:', error.message);

        if (error.http_code === 401) {
            console.log('\n💡 Tip: Check if your Cloudinary API credentials are correct');
        }

        process.exit(1);
    }
}

testCloudUpload().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
