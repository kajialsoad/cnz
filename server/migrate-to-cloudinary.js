#!/usr/bin/env node

/**
 * Cloudinary Migration Script
 * 
 * This script migrates existing local files (complaint images, chat images, voice files)
 * to Cloudinary cloud storage.
 * 
 * Usage:
 *   node migrate-to-cloudinary.js [options]
 * 
 * Options:
 *   --dry-run          Simulate migration without making changes
 *   --type <type>      Migrate specific type only (complaints|chat|voice|all)
 *   --help             Show help message
 * 
 * Examples:
 *   node migrate-to-cloudinary.js
 *   node migrate-to-cloudinary.js --dry-run
 *   node migrate-to-cloudinary.js --type complaints
 *   node migrate-to-cloudinary.js --type chat --dry-run
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
    dryRun: args.includes('--dry-run'),
    type: 'all',
    help: args.includes('--help') || args.includes('-h')
};

// Parse --type option
const typeIndex = args.indexOf('--type');
if (typeIndex !== -1 && args[typeIndex + 1]) {
    const typeValue = args[typeIndex + 1].toLowerCase();
    if (['complaints', 'chat', 'voice', 'all'].includes(typeValue)) {
        options.type = typeValue;
    } else {
        console.error(`❌ Invalid type: ${typeValue}`);
        console.error('   Valid types: complaints, chat, voice, all');
        process.exit(1);
    }
}

// Show help
if (options.help) {
    console.log(`
Cloudinary Migration Script
============================

This script migrates existing local files to Cloudinary cloud storage.

Usage:
  node migrate-to-cloudinary.js [options]

Options:
  --dry-run          Simulate migration without making changes
  --type <type>      Migrate specific type only (complaints|chat|voice|all)
  --help, -h         Show this help message

Examples:
  node migrate-to-cloudinary.js
  node migrate-to-cloudinary.js --dry-run
  node migrate-to-cloudinary.js --type complaints
  node migrate-to-cloudinary.js --type chat --dry-run

Migration Types:
  complaints         Migrate complaint images only
  chat              Migrate chat images only
  voice             Migrate voice files only
  all               Migrate all files (default)
`);
    process.exit(0);
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Ask user for confirmation
 */
function askConfirmation(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
}

/**
 * Display banner
 */
function displayBanner() {
    console.log('\n' + '='.repeat(80));
    console.log('CLOUDINARY MIGRATION SCRIPT');
    console.log('='.repeat(80));
    console.log('');
    console.log('This script will migrate local files to Cloudinary cloud storage.');
    console.log('');
    console.log('Configuration:');
    console.log(`  Mode: ${options.dryRun ? '🔍 DRY RUN (no changes will be made)' : '🚀 LIVE MIGRATION'}`);
    console.log(`  Type: ${options.type === 'all' ? '📦 All files' : `📁 ${options.type} only`}`);
    console.log('');
    console.log('⚠️  IMPORTANT:');
    console.log('  - Ensure you have a database backup before proceeding');
    console.log('  - Ensure Cloudinary credentials are configured in .env');
    console.log('  - This process may take several minutes depending on file count');
    console.log('');
    console.log('='.repeat(80));
    console.log('');
}

/**
 * Save migration report to file
 */
function saveReport(result, reportContent) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `migration-report-${timestamp}.txt`;
    const filepath = path.join(process.cwd(), filename);

    try {
        fs.writeFileSync(filepath, reportContent, 'utf8');
        console.log(`\n📄 Migration report saved to: ${filename}`);
        return filepath;
    } catch (error) {
        console.error(`\n❌ Failed to save report: ${error.message}`);
        return null;
    }
}

/**
 * Display progress during migration
 */
function displayProgress(current, total, type) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const barLength = 40;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

    process.stdout.write(`\r  Progress: [${bar}] ${percentage}% (${current}/${total}) - ${type}`);
}

/**
 * Run migration in dry-run mode
 */
async function runDryRun(migrationService) {
    console.log('🔍 Running in DRY RUN mode...');
    console.log('   No changes will be made to the database or Cloudinary.\n');

    // Import prisma to check database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        let totalFiles = 0;

        if (options.type === 'all' || options.type === 'complaints') {
            const complaints = await prisma.complaint.findMany({
                where: {
                    imageUrl: { not: null }
                },
                select: { id: true, imageUrl: true }
            });

            let imageCount = 0;
            for (const complaint of complaints) {
                try {
                    const parsed = JSON.parse(complaint.imageUrl);
                    if (Array.isArray(parsed)) {
                        imageCount += parsed.filter(url => !url.includes('cloudinary.com')).length;
                    }
                } catch {
                    const urls = complaint.imageUrl.split(',').filter(url => !url.includes('cloudinary.com'));
                    imageCount += urls.length;
                }
            }

            console.log(`📸 Complaint images: ${imageCount} files to migrate`);
            totalFiles += imageCount;
        }

        if (options.type === 'all' || options.type === 'chat') {
            const chatMessages = await prisma.complaintChatMessage.findMany({
                where: {
                    imageUrl: { not: null }
                },
                select: { id: true, imageUrl: true }
            });

            const chatImageCount = chatMessages.filter(
                msg => msg.imageUrl && !msg.imageUrl.includes('cloudinary.com')
            ).length;

            console.log(`💬 Chat images: ${chatImageCount} files to migrate`);
            totalFiles += chatImageCount;
        }

        if (options.type === 'all' || options.type === 'voice') {
            const voiceComplaints = await prisma.complaint.findMany({
                where: {
                    audioUrl: { not: null }
                },
                select: { id: true, audioUrl: true }
            });

            let voiceCount = 0;
            for (const complaint of voiceComplaints) {
                try {
                    const parsed = JSON.parse(complaint.audioUrl);
                    if (Array.isArray(parsed)) {
                        voiceCount += parsed.filter(url => !url.includes('cloudinary.com')).length;
                    }
                } catch {
                    const urls = complaint.audioUrl.split(',').filter(url => !url.includes('cloudinary.com'));
                    voiceCount += urls.length;
                }
            }

            console.log(`🎤 Voice files: ${voiceCount} files to migrate`);
            totalFiles += voiceCount;
        }

        console.log('');
        console.log('='.repeat(80));
        console.log(`📊 Total files to migrate: ${totalFiles}`);
        console.log('='.repeat(80));
        console.log('\n✅ Dry run completed. Run without --dry-run to perform actual migration.\n');

    } catch (error) {
        console.error(`\n❌ Dry run failed: ${error.message}`);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Run actual migration
 */
async function runMigration(migrationService) {
    console.log('🚀 Starting migration...\n');

    let result;

    try {
        switch (options.type) {
            case 'complaints':
                result = await migrationService.migrateComplaintImages();
                break;
            case 'chat':
                result = await migrationService.migrateChatImages();
                break;
            case 'voice':
                result = await migrationService.migrateVoiceFiles();
                break;
            case 'all':
            default:
                result = await migrationService.migrateAll();
                break;
        }

        // Generate and save report
        const reportContent = migrationService.generateReport(result);
        saveReport(result, reportContent);

        // Display final summary
        console.log('\n' + '='.repeat(80));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total files processed: ${result.totalFiles}`);
        console.log(`✅ Successfully migrated: ${result.successCount}`);
        console.log(`❌ Failed: ${result.failureCount}`);

        if (result.totalFiles > 0) {
            const successRate = ((result.successCount / result.totalFiles) * 100).toFixed(2);
            console.log(`📈 Success rate: ${successRate}%`);
        }

        console.log('='.repeat(80));

        if (result.failureCount > 0) {
            console.log('\n⚠️  Some files failed to migrate. Check the report for details.');
        } else if (result.successCount > 0) {
            console.log('\n✅ All files migrated successfully!');
        } else {
            console.log('\n📭 No files needed migration (all already on Cloudinary).');
        }

        return result;

    } catch (error) {
        console.error(`\n❌ Migration failed: ${error.message}`);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Display banner
        displayBanner();

        // Check if Cloudinary is configured
        require('dotenv').config();

        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            console.error('❌ Cloudinary credentials not configured!');
            console.error('   Please set the following environment variables in .env:');
            console.error('   - CLOUDINARY_CLOUD_NAME');
            console.error('   - CLOUDINARY_API_KEY');
            console.error('   - CLOUDINARY_API_SECRET');
            console.error('');
            process.exit(1);
        }

        // Ask for confirmation (skip in dry-run mode)
        if (!options.dryRun) {
            const answer = await askConfirmation(
                '⚠️  Are you sure you want to proceed with the migration? (yes/no): '
            );

            if (answer !== 'yes' && answer !== 'y') {
                console.log('\n❌ Migration cancelled by user.\n');
                rl.close();
                process.exit(0);
            }

            console.log('');
        }

        // Import migration service (after env is loaded)
        const { migrationService } = require('./dist/services/migration.service.js');

        // Run migration or dry-run
        if (options.dryRun) {
            await runDryRun(migrationService);
        } else {
            await runMigration(migrationService);
        }

        // Close readline interface
        rl.close();

        console.log('');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        console.error(error.stack);
        rl.close();
        process.exit(1);
    }
}

// Run main function
main();
