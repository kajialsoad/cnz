/**
 * Test Script for Status Update API with Resolution Documentation
 * 
 * This script tests the enhanced status update endpoint that supports
 * multipart/form-data with resolution images and notes.
 * 
 * Usage: node server/test-status-update-api.js
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

// Test credentials (update these with valid credentials)
const TEST_ADMIN = {
    email: 'admin@cleancare.com',
    password: 'Admin@123'
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to create a test image file
function createTestImage(filename) {
    const testImagePath = path.join(__dirname, 'test-images', filename);

    // Create test-images directory if it doesn't exist
    const testImagesDir = path.join(__dirname, 'test-images');
    if (!fs.existsSync(testImagesDir)) {
        fs.mkdirSync(testImagesDir, { recursive: true });
    }

    // Create a simple test image (1x1 pixel PNG)
    const pngData = Buffer.from([
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

    fs.writeFileSync(testImagePath, pngData);
    return testImagePath;
}

// Helper function to clean up test images
function cleanupTestImages() {
    const testImagesDir = path.join(__dirname, 'test-images');
    if (fs.existsSync(testImagesDir)) {
        fs.rmSync(testImagesDir, { recursive: true, force: true });
    }
}

// Test 1: Admin Login
async function testAdminLogin() {
    log('\n📝 Test 1: Admin Login', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        const response = await axios.post(`${API_URL}/auth/admin/login`, TEST_ADMIN);

        if (response.data.success && response.data.data.token) {
            log('✅ Login successful', 'green');
            log(`   Token: ${response.data.data.token.substring(0, 20)}...`, 'blue');
            return response.data.data.token;
        } else {
            log('❌ Login failed: Invalid response', 'red');
            return null;
        }
    } catch (error) {
        log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
        return null;
    }
}

// Test 2: Create a test complaint
async function createTestComplaint(token) {
    log('\n📝 Test 2: Create Test Complaint', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        const complaintData = {
            title: 'Test Complaint for Status Update',
            description: 'This is a test complaint to test status update with resolution documentation',
            category: 'WASTE_MANAGEMENT',
            subcategory: 'GARBAGE_COLLECTION',
            location: {
                address: 'Test Address',
                latitude: 23.8103,
                longitude: 90.4125
            },
            cityCorporationCode: 'DSCC',
            zoneId: 1,
            wardId: 1
        };

        const response = await axios.post(`${API_URL}/complaints`, complaintData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success && response.data.data.id) {
            log('✅ Test complaint created', 'green');
            log(`   Complaint ID: ${response.data.data.id}`, 'blue');
            return response.data.data.id;
        } else {
            log('❌ Failed to create test complaint', 'red');
            return null;
        }
    } catch (error) {
        log(`❌ Failed to create test complaint: ${error.response?.data?.message || error.message}`, 'red');
        return null;
    }
}

// Test 3: Update status to RESOLVED with images and note
async function testResolvedWithImages(token, complaintId) {
    log('\n📝 Test 3: Mark as RESOLVED with Images and Note', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        // Create test images
        const image1Path = createTestImage('resolution1.png');
        const image2Path = createTestImage('resolution2.png');

        const formData = new FormData();
        formData.append('status', 'RESOLVED');
        formData.append('resolutionNote', 'The garbage has been collected and the area has been cleaned thoroughly. Our team completed the work successfully.');
        formData.append('note', 'Resolved by cleaning team');
        formData.append('resolutionImages', fs.createReadStream(image1Path));
        formData.append('resolutionImages', fs.createReadStream(image2Path));

        const response = await axios.patch(
            `${API_URL}/admin/complaints/${complaintId}/status`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        if (response.data.success) {
            log('✅ Status updated to RESOLVED successfully', 'green');
            log(`   Status: ${response.data.data.complaint.status}`, 'blue');
            log(`   Resolution Note: ${response.data.data.complaint.resolutionNote}`, 'blue');
            log(`   Resolution Images: ${response.data.data.resolutionImages.length} images`, 'blue');
            response.data.data.resolutionImages.forEach((url, index) => {
                log(`     ${index + 1}. ${url}`, 'blue');
            });
            return true;
        } else {
            log('❌ Failed to update status', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Failed to update status: ${error.response?.data?.message || error.message}`, 'red');
        if (error.response?.data) {
            log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
        }
        return false;
    }
}

// Test 4: Update status to IN_PROGRESS with optional images
async function testInProgressWithImages(token, complaintId) {
    log('\n📝 Test 4: Mark as IN_PROGRESS with Optional Images', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        // Create test image
        const imagePath = createTestImage('progress.png');

        const formData = new FormData();
        formData.append('status', 'IN_PROGRESS');
        formData.append('resolutionNote', 'Our team is currently working on this issue. Expected completion by tomorrow.');
        formData.append('note', 'Assigned to cleaning team');
        formData.append('resolutionImages', fs.createReadStream(imagePath));

        const response = await axios.patch(
            `${API_URL}/admin/complaints/${complaintId}/status`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        if (response.data.success) {
            log('✅ Status updated to IN_PROGRESS successfully', 'green');
            log(`   Status: ${response.data.data.complaint.status}`, 'blue');
            log(`   Resolution Note: ${response.data.data.complaint.resolutionNote}`, 'blue');
            log(`   Resolution Images: ${response.data.data.resolutionImages.length} images`, 'blue');
            return true;
        } else {
            log('❌ Failed to update status', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Failed to update status: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// Test 5: Update status to IN_PROGRESS without images
async function testInProgressWithoutImages(token, complaintId) {
    log('\n📝 Test 5: Mark as IN_PROGRESS without Images', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        const formData = new FormData();
        formData.append('status', 'IN_PROGRESS');
        formData.append('note', 'Assigned to team');

        const response = await axios.patch(
            `${API_URL}/admin/complaints/${complaintId}/status`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        if (response.data.success) {
            log('✅ Status updated to IN_PROGRESS successfully', 'green');
            log(`   Status: ${response.data.data.complaint.status}`, 'blue');
            log(`   Resolution Note: ${response.data.data.complaint.resolutionNote || 'None'}`, 'blue');
            log(`   Resolution Images: ${response.data.data.resolutionImages.length} images`, 'blue');
            return true;
        } else {
            log('❌ Failed to update status', 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Failed to update status: ${error.response?.data?.message || error.message}`, 'red');
        return false;
    }
}

// Test 6: Validation - Missing resolution note for RESOLVED
async function testValidationMissingNote(token, complaintId) {
    log('\n📝 Test 6: Validation - Missing Resolution Note for RESOLVED', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        const imagePath = createTestImage('test.png');

        const formData = new FormData();
        formData.append('status', 'RESOLVED');
        formData.append('resolutionImages', fs.createReadStream(imagePath));

        const response = await axios.patch(
            `${API_URL}/admin/complaints/${complaintId}/status`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        log('❌ Validation failed: Should have rejected missing resolution note', 'red');
        return false;
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message.includes('Resolution note is required')) {
            log('✅ Validation passed: Correctly rejected missing resolution note', 'green');
            log(`   Error: ${error.response.data.message}`, 'blue');
            return true;
        } else {
            log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
            return false;
        }
    }
}

// Test 7: Validation - Missing resolution images for RESOLVED
async function testValidationMissingImages(token, complaintId) {
    log('\n📝 Test 7: Validation - Missing Resolution Images for RESOLVED', 'cyan');
    log('━'.repeat(50), 'cyan');

    try {
        const formData = new FormData();
        formData.append('status', 'RESOLVED');
        formData.append('resolutionNote', 'This is a test resolution note with sufficient length to pass validation.');

        const response = await axios.patch(
            `${API_URL}/admin/complaints/${complaintId}/status`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...formData.getHeaders()
                }
            }
        );

        log('❌ Validation failed: Should have rejected missing resolution images', 'red');
        return false;
    } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message.includes('resolution image')) {
            log('✅ Validation passed: Correctly rejected missing resolution images', 'green');
            log(`   Error: ${error.response.data.message}`, 'blue');
            return true;
        } else {
            log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
            return false;
        }
    }
}

// Main test runner
async function runTests() {
    log('\n╔════════════════════════════════════════════════╗', 'cyan');
    log('║   Status Update API Test Suite                ║', 'cyan');
    log('║   Testing Resolution Documentation Support    ║', 'cyan');
    log('╚════════════════════════════════════════════════╝', 'cyan');

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    try {
        // Test 1: Login
        const token = await testAdminLogin();
        if (!token) {
            log('\n❌ Cannot proceed without authentication token', 'red');
            return;
        }
        results.passed++;
        results.total++;

        // Test 2: Create test complaint
        const complaintId = await createTestComplaint(token);
        if (!complaintId) {
            log('\n❌ Cannot proceed without test complaint', 'red');
            return;
        }
        results.passed++;
        results.total++;

        // Test 3: RESOLVED with images
        results.total++;
        if (await testResolvedWithImages(token, complaintId)) {
            results.passed++;
        } else {
            results.failed++;
        }

        // Create new complaint for next test
        const complaintId2 = await createTestComplaint(token);
        if (complaintId2) {
            // Test 4: IN_PROGRESS with images
            results.total++;
            if (await testInProgressWithImages(token, complaintId2)) {
                results.passed++;
            } else {
                results.failed++;
            }
        }

        // Create new complaint for next test
        const complaintId3 = await createTestComplaint(token);
        if (complaintId3) {
            // Test 5: IN_PROGRESS without images
            results.total++;
            if (await testInProgressWithoutImages(token, complaintId3)) {
                results.passed++;
            } else {
                results.failed++;
            }
        }

        // Create new complaint for validation tests
        const complaintId4 = await createTestComplaint(token);
        if (complaintId4) {
            // Test 6: Validation - Missing note
            results.total++;
            if (await testValidationMissingNote(token, complaintId4)) {
                results.passed++;
            } else {
                results.failed++;
            }

            // Test 7: Validation - Missing images
            results.total++;
            if (await testValidationMissingImages(token, complaintId4)) {
                results.passed++;
            } else {
                results.failed++;
            }
        }

    } catch (error) {
        log(`\n❌ Test suite error: ${error.message}`, 'red');
    } finally {
        // Cleanup test images
        cleanupTestImages();

        // Print summary
        log('\n╔════════════════════════════════════════════════╗', 'cyan');
        log('║   Test Summary                                 ║', 'cyan');
        log('╚════════════════════════════════════════════════╝', 'cyan');
        log(`\nTotal Tests: ${results.total}`, 'blue');
        log(`Passed: ${results.passed}`, 'green');
        log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
        log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`,
            results.failed === 0 ? 'green' : 'yellow');
    }
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});
