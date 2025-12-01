/**
 * Migrate Chat Base64 Images to Cloudinary
 * 
 * This script converts existing base64 image data URLs in chat messages
 * to proper Cloudinary URLs for better performance and reliability.
 */

const { PrismaClient } = require('@prisma/client');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'cyan');
    console.log('='.repeat(60) + '\n');
}

/**
 * Initialize Cloudinary
 */
function initializeCloudinary() {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        });

        log('✅ Cloudinary initialized', 'green');
        return true;
    } catch (error) {
        log(`❌ Failed to initialize Cloudinary: ${error.message}`, 'red');
        return false;
    }
}

/**
 * Convert base64 to buffer
 */
function base64ToBuffer(base64String) {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

/**
 * Upload buffer to Cloudinary
 */
async function uploadToCloudinary(buffer, messageId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `clean-care/chat/migrated`,
                public_id: `chat-msg-${messageId}-${Date.now()}`,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        // Write buffer to stream
        const readable = require('stream').Readable.from(buffer);
        readable.pipe(uploadStream);
    });
}

/**
 * Migrate a single message
 */
async function migrateMessage(message) {
    try {
        log(`  Processing message #${message.id}...`, 'blue');

        // Convert base64 to buffer
        const buffer = base64ToBuffer(message.imageUrl);
        log(`    Image size: ${(buffer.length / 1024).toFixed(2)} KB`, 'cyan');

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, message.id);
        log(`    ✅ Uploaded to Cloudinary: ${result.secure_url}`, 'green');

        // Update database
        await prisma.complaintChatMessage.update({
            where: { id: message.id },
            data: { imageUrl: result.secure_url }
        });

        log(`    ✅ Database updated`, 'green');

        return {
            success: true,
            messageId: message.id,
            oldSize: buffer.length,
            newUrl: result.secure_url
        };
    } catch (error) {
        log(`    ❌ Failed: ${error.message}`, 'red');
        return {
            success: false,
            messageId: message.id,
            error: error.message
        };
    }
}

/**
 * Main migration function
 */
async function migrateChatImages() {
    logSection('🔄 Chat Base64 to Cloudinary Migration');

    try {
        // Initialize Cloudinary
        if (!initializeCloudinary()) {
            throw new Error('Cloudinary initialization failed');
        }

        // Get all messages with base64 images
        log('📋 Fetching messages with base64 images...', 'blue');
        const messages = await prisma.complaintChatMessage.findMany({
            where: {
                imageUrl: {
                    startsWith: 'data:image/'
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        log(`Found ${messages.length} messages with base64 images`, 'cyan');

        if (messages.length === 0) {
            log('✅ No messages to migrate', 'green');
            return;
        }

        // Ask for confirmation
        log('\n⚠️  This will convert all base64 images to Cloudinary URLs', 'yellow');
        log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Migrate each message
        logSection('🚀 Starting Migration');
        const results = [];

        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            log(`\n[${i + 1}/${messages.length}] Message #${message.id}`, 'cyan');

            const result = await migrateMessage(message);
            results.push(result);

            // Add delay to avoid rate limiting
            if (i < messages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Summary
        logSection('📊 Migration Summary');
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        log(`Total messages: ${messages.length}`, 'cyan');
        log(`✅ Successful: ${successful}`, 'green');
        log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');

        if (successful > 0) {
            const totalOldSize = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.oldSize, 0);
            log(`\nTotal data migrated: ${(totalOldSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
        }

        if (failed > 0) {
            log('\nFailed messages:', 'red');
            results
                .filter(r => !r.success)
                .forEach(r => {
                    log(`  Message #${r.messageId}: ${r.error}`, 'red');
                });
        }

        log('\n✅ Migration completed!', 'green');

    } catch (error) {
        logSection('❌ Migration Failed');
        log(`Error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateChatImages().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
