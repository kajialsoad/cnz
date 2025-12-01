/**
 * Clean Broken Chat Images
 * 
 * This script removes broken base64 image references from chat messages.
 * These images are corrupted (only 0.12 KB) and cannot be displayed.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function cleanBrokenImages() {
    try {
        log('\n🧹 Cleaning Broken Chat Images\n', 'cyan');

        // Find messages with small base64 images (likely corrupted)
        const messages = await prisma.complaintChatMessage.findMany({
            where: {
                imageUrl: {
                    startsWith: 'data:image/'
                }
            }
        });

        log(`Found ${messages.length} messages with base64 images`, 'cyan');

        let brokenCount = 0;
        const brokenIds = [];

        for (const msg of messages) {
            // Calculate base64 size
            const base64Data = msg.imageUrl.replace(/^data:image\/\w+;base64,/, '');
            const sizeKB = (Buffer.from(base64Data, 'base64').length / 1024).toFixed(2);

            // If image is very small (< 1 KB), it's likely broken
            if (parseFloat(sizeKB) < 1) {
                brokenCount++;
                brokenIds.push(msg.id);
                log(`  Message #${msg.id}: ${sizeKB} KB (BROKEN)`, 'yellow');
            }
        }

        if (brokenCount === 0) {
            log('\n✅ No broken images found!', 'green');
            return;
        }

        log(`\n⚠️  Found ${brokenCount} broken images`, 'yellow');
        log('   These images are corrupted and cannot be displayed', 'yellow');
        log('\n   Options:', 'cyan');
        log('   1. Set imageUrl to NULL (keep message, remove image)', 'cyan');
        log('   2. Delete the messages entirely', 'cyan');
        log('   3. Cancel (do nothing)', 'cyan');

        log('\n   Waiting 5 seconds... Press Ctrl+C to cancel', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Option 1: Set imageUrl to NULL (recommended)
        log('\n🔧 Setting imageUrl to NULL for broken images...', 'cyan');

        const result = await prisma.complaintChatMessage.updateMany({
            where: {
                id: {
                    in: brokenIds
                }
            },
            data: {
                imageUrl: null
            }
        });

        log(`\n✅ Cleaned ${result.count} broken images`, 'green');
        log('   Messages are preserved, only broken image URLs removed', 'green');

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, 'red');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanBrokenImages();
