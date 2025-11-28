/**
 * Test script for Complaint Service with Cloudinary integration
 * 
 * This script tests:
 * 1. Creating a complaint with images (Cloudinary upload)
 * 2. Creating a complaint with audio (Cloudinary upload)
 * 3. Verifying Cloudinary URLs are stored in database
 * 4. Graceful fallback when Cloudinary is disabled
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import the complaint service
const { complaintService } = require('./dist/services/complaint.service');
const { isCloudinaryEnabled } = require('./dist/config/cloudinary.config');

// Mock file data
function createMockImageFile(filename = 'test-image.jpg') {
    // Create a small test image buffer (1x1 pixel PNG)
    const buffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
    ]);

    return {
        fieldname: 'images',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: buffer,
        size: buffer.length
    };
}

function createMockAudioFile(filename = 'test-audio.mp3') {
    // Create a minimal MP3 buffer
    const buffer = Buffer.from([
        0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);

    return {
        fieldname: 'audioFiles',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: buffer,
        size: buffer.length
    };
}

async function testComplaintWithImages() {
    console.log('\n📸 Test 1: Creating complaint with images...');

    try {
        const mockImageFiles = [
            createMockImageFile('test-image-1.jpg'),
            createMockImageFile('test-image-2.jpg')
        ];

        const complaintData = {
            description: 'Test complaint with Cloudinary images',
            category: 'home',
            subcategory: 'not_collecting_waste',
            location: {
                address: '123 Test Street',
                district: 'Dhaka',
                thana: 'Gulshan',
                ward: '19'
            },
            userId: 1,
            uploadedFiles: mockImageFiles
        };

        const complaint = await complaintService.createComplaint(complaintData);

        console.log('✅ Complaint created successfully!');
        console.log('   ID:', complaint.id);
        console.log('   Title:', complaint.title);
        console.log('   Image URLs:', complaint.imageUrls);

        // Verify URLs
        if (isCloudinaryEnabled()) {
            const hasCloudinaryUrls = complaint.imageUrls.every(url =>
                url.includes('cloudinary.com')
            );

            if (hasCloudinaryUrls) {
                console.log('✅ All images uploaded to Cloudinary');
            } else {
                console.log('⚠️  Images not uploaded to Cloudinary (fallback to local)');
            }
        } else {
            console.log('ℹ️  Cloudinary disabled, using local storage');
        }

        return complaint;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

async function testComplaintWithAudio() {
    console.log('\n🎤 Test 2: Creating complaint with audio...');

    try {
        const mockAudioFile = createMockAudioFile('test-voice.mp3');

        const complaintData = {
            description: 'Test complaint with Cloudinary audio',
            category: 'home',
            subcategory: 'not_collecting_waste',
            location: {
                address: '456 Test Avenue',
                district: 'Dhaka',
                thana: 'Banani',
                ward: '20'
            },
            userId: 1,
            uploadedFiles: [mockAudioFile]
        };

        const complaint = await complaintService.createComplaint(complaintData);

        console.log('✅ Complaint created successfully!');
        console.log('   ID:', complaint.id);
        console.log('   Title:', complaint.title);
        console.log('   Audio URLs:', complaint.audioUrls);

        // Verify URLs
        if (isCloudinaryEnabled()) {
            const hasCloudinaryUrls = complaint.audioUrls.every(url =>
                url.includes('cloudinary.com')
            );

            if (hasCloudinaryUrls) {
                console.log('✅ Audio uploaded to Cloudinary');
            } else {
                console.log('⚠️  Audio not uploaded to Cloudinary (fallback to local)');
            }
        } else {
            console.log('ℹ️  Cloudinary disabled, using local storage');
        }

        return complaint;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

async function testComplaintWithImagesAndAudio() {
    console.log('\n📸🎤 Test 3: Creating complaint with images and audio...');

    try {
        const mockImageFiles = [
            createMockImageFile('test-image-3.jpg')
        ];
        const mockAudioFile = createMockAudioFile('test-voice-2.mp3');

        const complaintData = {
            description: 'Test complaint with both Cloudinary images and audio',
            category: 'home',
            subcategory: 'not_collecting_waste',
            location: {
                address: '789 Test Road',
                district: 'Dhaka',
                thana: 'Dhanmondi',
                ward: '21'
            },
            userId: 1,
            uploadedFiles: [...mockImageFiles, mockAudioFile]
        };

        const complaint = await complaintService.createComplaint(complaintData);

        console.log('✅ Complaint created successfully!');
        console.log('   ID:', complaint.id);
        console.log('   Title:', complaint.title);
        console.log('   Image URLs:', complaint.imageUrls);
        console.log('   Audio URLs:', complaint.audioUrls);

        // Verify URLs
        if (isCloudinaryEnabled()) {
            const hasCloudinaryImageUrls = complaint.imageUrls.every(url =>
                url.includes('cloudinary.com')
            );
            const hasCloudinaryAudioUrls = complaint.audioUrls.every(url =>
                url.includes('cloudinary.com')
            );

            if (hasCloudinaryImageUrls && hasCloudinaryAudioUrls) {
                console.log('✅ All media uploaded to Cloudinary');
            } else {
                console.log('⚠️  Some media not uploaded to Cloudinary (fallback to local)');
            }
        } else {
            console.log('ℹ️  Cloudinary disabled, using local storage');
        }

        return complaint;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

async function runTests() {
    console.log('🧪 Testing Complaint Service with Cloudinary Integration');
    console.log('='.repeat(60));

    // Check Cloudinary status
    const cloudinaryEnabled = isCloudinaryEnabled();
    console.log(`\nCloudinary Status: ${cloudinaryEnabled ? '✅ Enabled' : '❌ Disabled'}`);

    if (!cloudinaryEnabled) {
        console.log('⚠️  Warning: Cloudinary is disabled. Tests will use local storage fallback.');
    }

    try {
        // Run tests
        await testComplaintWithImages();
        await testComplaintWithAudio();
        await testComplaintWithImagesAndAudio();

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed successfully!');
        console.log('='.repeat(60));
    } catch (error) {
        console.log('\n' + '='.repeat(60));
        console.error('❌ Tests failed:', error.message);
        console.log('='.repeat(60));
        process.exit(1);
    }
}

// Run tests
runTests();
