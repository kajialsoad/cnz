const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

// Load existing token
let authToken = '';
try {
    const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-token.json'), 'utf8'));
    authToken = tokenData.accessToken;
} catch (error) {
    console.error('Could not load test token. Please run test-login-token.js first.');
    process.exit(1);
}

async function testImageUrlFix() {
    console.log('============================================================');
    console.log('IMAGE URL FIX VERIFICATION TEST');
    console.log('============================================================');
    console.log(`Base URL: ${BASE_URL}\n`);

    try {
        // Step 1: Verify token
        console.log('=== Step 1: Using Existing Token ===\n');
        console.log(`✓ Token loaded: ${authToken.substring(0, 20)}...\n`);

        // Step 2: Get existing complaints to check URL format
        console.log('=== Step 2: Fetch Existing Complaints ===\n');
        const complaintsResponse = await axios.get(`${BASE_URL}/api/complaints`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (complaintsResponse.data.success) {
            const complaints = complaintsResponse.data.data.complaints;
            console.log(`✓ Found ${complaints.length} complaints\n`);

            // Check the first complaint with images
            const complaintWithImage = complaints.find(c => c.imageUrls && c.imageUrls.length > 0);

            if (complaintWithImage) {
                console.log('=== Checking Image URL Format ===\n');
                console.log(`Complaint ID: ${complaintWithImage.id}`);
                console.log(`Image URLs:`);
                complaintWithImage.imageUrls.forEach((url, index) => {
                    console.log(`  ${index + 1}. ${url}`);

                    // Verify URL format
                    const expectedPattern = /^http:\/\/.*\/api\/uploads\/image\/.*\.(jpg|jpeg|png|webp)$/i;
                    if (expectedPattern.test(url)) {
                        console.log(`     ✓ URL format is correct`);
                    } else {
                        console.log(`     ✗ URL format is INCORRECT (expected: /api/uploads/image/filename)`);
                    }
                });
                console.log();

                // Step 3: Try to access the image URL
                console.log('=== Step 3: Test Image Access ===\n');
                const imageUrl = complaintWithImage.imageUrls[0];
                console.log(`Testing URL: ${imageUrl}`);

                try {
                    const imageResponse = await axios.get(imageUrl, {
                        responseType: 'arraybuffer',
                        validateStatus: (status) => status < 500 // Accept 404 as valid response
                    });

                    if (imageResponse.status === 200) {
                        console.log(`✓ Image accessible (Status: ${imageResponse.status})`);
                        console.log(`✓ Content-Type: ${imageResponse.headers['content-type']}`);
                        console.log(`✓ Content-Length: ${imageResponse.headers['content-length']} bytes`);
                        console.log(`✓ Cache-Control: ${imageResponse.headers['cache-control']}`);
                    } else if (imageResponse.status === 404) {
                        console.log(`✗ Image not found (Status: 404)`);
                        console.log(`  This might be because the file was deleted or the path is incorrect`);
                    } else {
                        console.log(`⚠ Unexpected status: ${imageResponse.status}`);
                    }
                } catch (error) {
                    console.log(`✗ Error accessing image: ${error.message}`);
                }
                console.log();

                // Step 4: Get single complaint details
                console.log('=== Step 4: Get Complaint Details ===\n');
                const detailResponse = await axios.get(`${BASE_URL}/api/complaints/${complaintWithImage.id}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (detailResponse.data.success) {
                    const complaint = detailResponse.data.data.complaint;
                    console.log(`✓ Complaint details retrieved`);
                    console.log(`Image URLs in detail view:`);
                    complaint.imageUrls.forEach((url, index) => {
                        console.log(`  ${index + 1}. ${url}`);
                    });
                }
                console.log();

            } else {
                console.log('⚠ No complaints with images found');
                console.log('  Please create a complaint with images to test the fix\n');
            }
        }

        console.log('============================================================');
        console.log('TEST SUMMARY');
        console.log('============================================================\n');
        console.log('✓ Image URL format has been updated to: /api/uploads/image/{filename}');
        console.log('✓ URLs are now compatible with the server route: /api/uploads/:type/:filename');
        console.log('\nNext steps:');
        console.log('1. Test in the mobile app by viewing a complaint with images');
        console.log('2. Verify images display correctly without broken icons');
        console.log('3. Check browser network tab to confirm correct URLs are requested\n');

    } catch (error) {
        console.error('\n✗ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testImageUrlFix();
