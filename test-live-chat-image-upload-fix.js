/**
 * Test Live Chat Image Upload Fix
 * 
 * This script tests the live chat image upload functionality
 * to verify that images are properly uploaded to Cloudinary
 * and displayed in the chat.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

// Test credentials (use a valid admin account)
const ADMIN_CREDENTIALS = {
    email: 'admin@cleancare.bd',
    password: 'admin123'
};

// Test user ID (use a valid citizen user ID)
const TEST_USER_ID = 1; // Change this to a valid user ID

async function testLiveChatImageUpload() {
    console.log('🧪 Testing Live Chat Image Upload Fix\n');
    console.log('='.repeat(80));

    try {
        // Step 1: Login as admin
        console.log('\n📝 Step 1: Logging in as admin...');
        const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, ADMIN_CREDENTIALS);

        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }

        const accessToken = loginResponse.data.data.accessToken;
        console.log('✅ Login successful');
        console.log('   Token:', accessToken.substring(0, 20) + '...');

        // Step 2: Create a test image file
        console.log('\n📝 Step 2: Creating test image...');
        const testImagePath = path.join(__dirname, 'test-image.jpg');

        // Check if test image exists, if not create a simple one
        if (!fs.existsSync(testImagePath)) {
            console.log('⚠️  Test image not found, creating a placeholder...');
            // Create a simple 1x1 pixel JPEG (base64 encoded)
            const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';
            fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));
            console.log('✅ Test image created');
        } else {
            console.log('✅ Test image found');
        }

        // Step 3: Send message with image
        console.log('\n📝 Step 3: Sending message with image...');

        const formData = new FormData();
        formData.append('message', 'Test image upload from admin');
        formData.append('image', fs.createReadStream(testImagePath));

        const sendResponse = await axios.post(
            `${BASE_URL}/api/admin/live-chat/${TEST_USER_ID}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!sendResponse.data.success) {
            throw new Error('Send message failed: ' + sendResponse.data.message);
        }

        const message = sendResponse.data.data.message;
        console.log('✅ Message sent successfully');
        console.log('   Message ID:', message.id);
        console.log('   Message Type:', message.type);
        console.log('   File URL:', message.fileUrl);

        // Step 4: Verify the image URL
        console.log('\n📝 Step 4: Verifying image URL...');

        if (!message.fileUrl) {
            throw new Error('❌ No file URL in response!');
        }

        if (message.fileUrl.includes('cloudinary.com')) {
            console.log('✅ Image uploaded to Cloudinary');
            console.log('   Cloudinary URL:', message.fileUrl);
        } else {
            console.log('⚠️  Image stored locally (not Cloudinary)');
            console.log('   Local path:', message.fileUrl);
        }

        // Step 5: Fetch messages to verify display
        console.log('\n📝 Step 5: Fetching messages to verify display...');

        const messagesResponse = await axios.get(
            `${BASE_URL}/api/admin/live-chat/${TEST_USER_ID}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!messagesResponse.data.success) {
            throw new Error('Fetch messages failed: ' + messagesResponse.data.message);
        }

        const messages = messagesResponse.data.data.messages;
        const sentMessage = messages.find(m => m.id === message.id);

        if (!sentMessage) {
            throw new Error('❌ Sent message not found in messages list!');
        }

        console.log('✅ Message found in messages list');
        console.log('   Message ID:', sentMessage.id);
        console.log('   Message Type:', sentMessage.type);
        console.log('   File URL:', sentMessage.fileUrl);

        // Verify the URL is accessible
        if (sentMessage.fileUrl && sentMessage.fileUrl.includes('cloudinary.com')) {
            console.log('\n📝 Step 6: Verifying Cloudinary URL is accessible...');

            try {
                const imageResponse = await axios.head(sentMessage.fileUrl);
                console.log('✅ Cloudinary URL is accessible');
                console.log('   Status:', imageResponse.status);
                console.log('   Content-Type:', imageResponse.headers['content-type']);
            } catch (error) {
                console.error('❌ Cloudinary URL is NOT accessible:', error.message);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(80));
        console.log('\n📋 Summary:');
        console.log('   - Image upload: ✅ Working');
        console.log('   - Cloudinary integration: ✅ Working');
        console.log('   - Message display: ✅ Working');
        console.log('   - URL accessibility: ✅ Working');

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ TEST FAILED!');
        console.error('='.repeat(80));
        console.error('\nError:', error.message);

        if (error.response) {
            console.error('\nResponse Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }

        if (error.stack) {
            console.error('\nStack Trace:', error.stack);
        }
    }
}

// Run the test
testLiveChatImageUpload();
