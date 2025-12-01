/**
 * Check Chat Images in Database
 * 
 * This script checks the database for chat messages with images
 * and verifies if they are using Cloudinary URLs or local URLs.
 */

const { PrismaClient } = require('@prisma/client');

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

async function checkChatImages() {
    try {
        logSection('🔍 Checking Chat Images in Database');

        // Get all chat messages with images
        const messagesWithImages = await prisma.complaintChatMessage.findMany({
            where: {
                imageUrl: {
                    not: null
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20,
            include: {
                complaint: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        log(`Found ${messagesWithImages.length} chat messages with images`, 'blue');

        if (messagesWithImages.length === 0) {
            log('⚠️  No chat messages with images found', 'yellow');
            log('   Try uploading an image in the admin chat to test', 'yellow');
            return;
        }

        // Analyze image URLs
        let cloudinaryCount = 0;
        let localCount = 0;
        let otherCount = 0;

        log('\nRecent chat messages with images:', 'cyan');

        for (const message of messagesWithImages) {
            const imageUrl = message.imageUrl;
            const isCloudinary = imageUrl.includes('res.cloudinary.com');
            const isLocal = imageUrl.includes('/api/uploads/') || imageUrl.includes('localhost');

            let storageType = '❓ Unknown';
            let color = 'yellow';

            if (isCloudinary) {
                storageType = '☁️  Cloudinary';
                color = 'green';
                cloudinaryCount++;
            } else if (isLocal) {
                storageType = '💾 Local';
                color = 'yellow';
                localCount++;
            } else {
                otherCount++;
            }

            log(`\n${storageType}`, color);
            log(`  Complaint: #${message.complaintId} - ${message.complaint.title}`, 'cyan');
            log(`  Message ID: ${message.id}`, 'cyan');
            log(`  Sender: ${message.senderType}`, 'cyan');
            log(`  Created: ${message.createdAt.toLocaleString()}`, 'cyan');
            log(`  Image URL: ${imageUrl}`, 'cyan');
        }

        // Summary
        logSection('📊 Summary');
        log(`Total messages with images: ${messagesWithImages.length}`, 'cyan');
        log(`☁️  Cloudinary images: ${cloudinaryCount}`, cloudinaryCount > 0 ? 'green' : 'yellow');
        log(`💾 Local images: ${localCount}`, localCount > 0 ? 'yellow' : 'green');
        log(`❓ Other images: ${otherCount}`, otherCount > 0 ? 'yellow' : 'green');

        if (cloudinaryCount === 0 && localCount > 0) {
            log('\n⚠️  All images are stored locally', 'yellow');
            log('   Cloudinary might not be properly configured or enabled', 'yellow');
            log('   Check your .env file for:', 'yellow');
            log('   - CLOUDINARY_ENABLED=true', 'yellow');
            log('   - CLOUDINARY_CLOUD_NAME', 'yellow');
            log('   - CLOUDINARY_API_KEY', 'yellow');
            log('   - CLOUDINARY_API_SECRET', 'yellow');
        } else if (cloudinaryCount > 0) {
            log('\n✅ Cloudinary is working correctly!', 'green');
        }

    } catch (error) {
        log(`❌ Error checking chat images: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run check
checkChatImages().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
