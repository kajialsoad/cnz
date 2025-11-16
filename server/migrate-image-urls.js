/**
 * Migration Script: Update Image URLs in Database
 * 
 * This script updates existing complaint image URLs from the old format:
 *   /uploads/complaints/images/filename.jpg
 * to the new format:
 *   http://BASE_URL/api/uploads/image/filename.jpg
 * 
 * Usage: node migrate-image-urls.js [--dry-run]
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

// Get BASE_URL from environment or use default
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Check if this is a dry run
const isDryRun = process.argv.includes('--dry-run');

/**
 * Extract filename from old URL format
 * Examples:
 *   /uploads/filename.jpg -> filename.jpg
 *   /uploads/complaints/images/filename.jpg -> filename.jpg
 */
function extractFilename(url) {
    return path.basename(url);
}

/**
 * Generate new URL format
 */
function generateNewUrl(filename, type = 'image') {
    return `${BASE_URL}/api/uploads/${type}/${filename}`;
}

/**
 * Parse image URLs from database (stored as JSON string)
 */
function parseImageUrls(imageUrlString) {
    if (!imageUrlString) return [];

    try {
        return JSON.parse(imageUrlString);
    } catch (error) {
        // If not JSON, try comma-separated
        return imageUrlString.split(',').map(url => url.trim()).filter(url => url);
    }
}

/**
 * Check if URL needs migration
 */
function needsMigration(url) {
    // Old formats that need migration:
    // - /uploads/filename.jpg
    // - /uploads/complaints/images/filename.jpg
    // - Relative paths without http://

    if (!url) return false;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Check if it's using the old format with full URL
        return url.includes('/uploads/complaints/');
    }
    return true; // All relative paths need migration
}

/**
 * Migrate a single complaint's image URLs
 */
function migrateComplaintUrls(complaint) {
    if (!complaint.imageUrl) return null;

    const oldUrls = parseImageUrls(complaint.imageUrl);
    const newUrls = [];
    let hasChanges = false;

    for (const oldUrl of oldUrls) {
        if (needsMigration(oldUrl)) {
            const filename = extractFilename(oldUrl);
            const newUrl = generateNewUrl(filename, 'image');
            newUrls.push(newUrl);
            hasChanges = true;
        } else {
            newUrls.push(oldUrl);
        }
    }

    if (!hasChanges) return null;

    return {
        id: complaint.id,
        oldUrls,
        newUrls,
        newImageUrl: JSON.stringify(newUrls)
    };
}

/**
 * Migrate audio URLs
 */
function migrateAudioUrls(complaint) {
    if (!complaint.audioUrl) return null;

    const oldUrls = parseImageUrls(complaint.audioUrl);
    const newUrls = [];
    let hasChanges = false;

    for (const oldUrl of oldUrls) {
        if (needsMigration(oldUrl)) {
            const filename = extractFilename(oldUrl);
            const newUrl = generateNewUrl(filename, 'voice');
            newUrls.push(newUrl);
            hasChanges = true;
        } else {
            newUrls.push(oldUrl);
        }
    }

    if (!hasChanges) return null;

    return {
        id: complaint.id,
        oldUrls,
        newUrls,
        newAudioUrl: JSON.stringify(newUrls)
    };
}

/**
 * Main migration function
 */
async function migrateImageUrls() {
    console.log('============================================================');
    console.log('IMAGE URL MIGRATION SCRIPT');
    console.log('============================================================');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (database will be updated)'}`);
    console.log('============================================================\n');

    try {
        // Fetch all complaints
        console.log('Fetching complaints from database...');
        const complaints = await prisma.complaint.findMany({
            where: {
                OR: [
                    { imageUrl: { not: null } },
                    { audioUrl: { not: null } }
                ]
            }
        });

        console.log(`Found ${complaints.length} complaints with media files\n`);

        if (complaints.length === 0) {
            console.log('No complaints to migrate.');
            return;
        }

        // Analyze and migrate
        const migrations = [];

        for (const complaint of complaints) {
            const imageMigration = migrateComplaintUrls(complaint);
            const audioMigration = migrateAudioUrls(complaint);

            if (imageMigration || audioMigration) {
                migrations.push({
                    complaint,
                    imageMigration,
                    audioMigration
                });
            }
        }

        console.log(`Found ${migrations.length} complaints that need migration\n`);

        if (migrations.length === 0) {
            console.log('✓ All URLs are already in the correct format!');
            return;
        }

        // Display migration plan
        console.log('=== Migration Plan ===\n');
        migrations.forEach((migration, index) => {
            console.log(`${index + 1}. Complaint ID: ${migration.complaint.id}`);

            if (migration.imageMigration) {
                console.log('   Image URLs:');
                migration.imageMigration.oldUrls.forEach((oldUrl, i) => {
                    console.log(`     OLD: ${oldUrl}`);
                    console.log(`     NEW: ${migration.imageMigration.newUrls[i]}`);
                });
            }

            if (migration.audioMigration) {
                console.log('   Audio URLs:');
                migration.audioMigration.oldUrls.forEach((oldUrl, i) => {
                    console.log(`     OLD: ${oldUrl}`);
                    console.log(`     NEW: ${migration.audioMigration.newUrls[i]}`);
                });
            }

            console.log();
        });

        // Execute migration
        if (!isDryRun) {
            console.log('=== Executing Migration ===\n');

            let successCount = 0;
            let errorCount = 0;

            for (const migration of migrations) {
                try {
                    const updateData = {};

                    if (migration.imageMigration) {
                        updateData.imageUrl = migration.imageMigration.newImageUrl;
                    }

                    if (migration.audioMigration) {
                        updateData.audioUrl = migration.audioMigration.newAudioUrl;
                    }

                    await prisma.complaint.update({
                        where: { id: migration.complaint.id },
                        data: updateData
                    });

                    console.log(`✓ Updated complaint ${migration.complaint.id}`);
                    successCount++;
                } catch (error) {
                    console.error(`✗ Failed to update complaint ${migration.complaint.id}:`, error.message);
                    errorCount++;
                }
            }

            console.log('\n=== Migration Complete ===\n');
            console.log(`✓ Successfully migrated: ${successCount} complaints`);
            if (errorCount > 0) {
                console.log(`✗ Failed: ${errorCount} complaints`);
            }
        } else {
            console.log('=== Dry Run Complete ===\n');
            console.log('No changes were made to the database.');
            console.log('Run without --dry-run flag to apply changes.');
        }

    } catch (error) {
        console.error('\n✗ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateImageUrls()
    .then(() => {
        console.log('\n✓ Migration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Migration script failed:', error);
        process.exit(1);
    });
