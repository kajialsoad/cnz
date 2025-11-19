/**
 * Migration Script: Handle Existing Complaints Without Categories
 * 
 * This script handles complaints that were created before the category system was implemented.
 * 
 * Strategy Options:
 * 1. Set to NULL (default) - Keep as NULL, admin panel will handle display
 * 2. Set to default category - Assign a default "uncategorized" category
 * 3. Manual categorization - Export list for manual review
 * 
 * Usage:
 *   node migrate-null-categories.js [--strategy=null|default|export]
 *   node migrate-null-categories.js --strategy=null     # Keep as NULL (default)
 *   node migrate-null-categories.js --strategy=default  # Set to default category
 *   node migrate-null-categories.js --strategy=export   # Export for manual review
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Default category for uncategorized complaints
const DEFAULT_CATEGORY = 'home';
const DEFAULT_SUBCATEGORY = 'not_collecting_waste';

/**
 * Get command line arguments
 */
function getStrategy() {
    const args = process.argv.slice(2);
    const strategyArg = args.find(arg => arg.startsWith('--strategy='));

    if (strategyArg) {
        const strategy = strategyArg.split('=')[1];
        if (['null', 'default', 'export'].includes(strategy)) {
            return strategy;
        }
    }

    return 'null'; // Default strategy
}

/**
 * Find all complaints without categories
 */
async function findComplaintsWithoutCategories() {
    try {
        const complaints = await prisma.complaint.findMany({
            where: {
                OR: [
                    { category: null },
                    { category: '' },
                    { subcategory: null },
                    { subcategory: '' },
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return complaints;
    } catch (error) {
        console.error('Error finding complaints:', error);
        throw error;
    }
}

/**
 * Strategy 1: Keep as NULL
 * This is the safest option - no data modification
 */
async function strategyKeepNull(complaints) {
    console.log('\n📋 Strategy: Keep as NULL');
    console.log('─'.repeat(60));
    console.log(`Found ${complaints.length} complaints without categories`);
    console.log('These complaints will remain as NULL.');
    console.log('The admin panel has been updated to handle NULL categories.');
    console.log('\nNo database changes will be made.');

    return {
        strategy: 'null',
        complaintsFound: complaints.length,
        complaintsUpdated: 0,
        message: 'No changes made. Admin panel will handle NULL categories.'
    };
}

/**
 * Strategy 2: Set to default category
 * Assigns a default category to all uncategorized complaints
 */
async function strategySetDefault(complaints) {
    console.log('\n📋 Strategy: Set to Default Category');
    console.log('─'.repeat(60));
    console.log(`Found ${complaints.length} complaints without categories`);
    console.log(`Will set to: ${DEFAULT_CATEGORY} / ${DEFAULT_SUBCATEGORY}`);

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will modify the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    let updated = 0;
    let failed = 0;

    for (const complaint of complaints) {
        try {
            await prisma.complaint.update({
                where: { id: complaint.id },
                data: {
                    category: DEFAULT_CATEGORY,
                    subcategory: DEFAULT_SUBCATEGORY,
                }
            });
            updated++;
            console.log(`✓ Updated complaint #${complaint.id}`);
        } catch (error) {
            failed++;
            console.error(`✗ Failed to update complaint #${complaint.id}:`, error.message);
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`✓ Successfully updated: ${updated}`);
    console.log(`✗ Failed: ${failed}`);

    return {
        strategy: 'default',
        complaintsFound: complaints.length,
        complaintsUpdated: updated,
        complaintsFailed: failed,
        defaultCategory: DEFAULT_CATEGORY,
        defaultSubcategory: DEFAULT_SUBCATEGORY,
    };
}

/**
 * Strategy 3: Export for manual review
 * Creates a CSV file with all uncategorized complaints for manual review
 */
async function strategyExport(complaints) {
    console.log('\n📋 Strategy: Export for Manual Review');
    console.log('─'.repeat(60));
    console.log(`Found ${complaints.length} complaints without categories`);

    if (complaints.length === 0) {
        console.log('No complaints to export.');
        return {
            strategy: 'export',
            complaintsFound: 0,
            complaintsExported: 0,
        };
    }

    // Create CSV content
    const csvHeader = 'ID,Title,Description,Location,Status,Citizen Name,Citizen Phone,Created At,Suggested Category,Suggested Subcategory\n';

    const csvRows = complaints.map(complaint => {
        // Suggest category based on description keywords
        const suggestedCategory = suggestCategory(complaint.description, complaint.title);

        return [
            complaint.id,
            `"${(complaint.title || '').replace(/"/g, '""')}"`,
            `"${(complaint.description || '').replace(/"/g, '""')}"`,
            `"${(complaint.location || '').replace(/"/g, '""')}"`,
            complaint.status,
            `"${complaint.user ? `${complaint.user.firstName} ${complaint.user.lastName}` : 'N/A'}"`,
            complaint.user?.phone || 'N/A',
            complaint.createdAt.toISOString(),
            suggestedCategory.category,
            suggestedCategory.subcategory,
        ].join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // Save to file
    const filename = `uncategorized-complaints-${Date.now()}.csv`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, csvContent, 'utf8');

    console.log(`\n✓ Exported ${complaints.length} complaints to: ${filename}`);
    console.log('\nYou can now:');
    console.log('1. Open the CSV file in Excel or Google Sheets');
    console.log('2. Review and assign categories manually');
    console.log('3. Use the admin panel to update categories one by one');

    return {
        strategy: 'export',
        complaintsFound: complaints.length,
        complaintsExported: complaints.length,
        exportFile: filename,
    };
}

/**
 * Suggest category based on description keywords
 */
function suggestCategory(description, title) {
    const text = `${description} ${title}`.toLowerCase();

    // Keywords for each category
    const categoryKeywords = {
        home: ['বাসা', 'বাড়ি', 'home', 'house', 'household', 'ময়লা নিচ্ছে না'],
        road_environment: ['রাস্তা', 'road', 'street', 'পানি জমে', 'water logging', 'ম্যানহোল', 'manhole'],
        business: ['ব্যবসা', 'business', 'shop', 'দোকান'],
        office: ['অফিস', 'office'],
        education: ['শিক্ষা', 'education', 'school', 'college', 'university', 'স্কুল'],
        hospital: ['হাসপাতাল', 'hospital', 'clinic', 'medical'],
        religious: ['ধর্মীয়', 'religious', 'মসজিদ', 'mosque', 'temple', 'church'],
        events: ['মেলা', 'event', 'celebration', 'festival', 'উৎসব'],
    };

    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            // Suggest subcategory based on additional keywords
            if (text.includes('billing') || text.includes('বিল')) {
                return { category, subcategory: 'billing_issue' };
            } else if (text.includes('behavior') || text.includes('ব্যবহার')) {
                return { category, subcategory: 'worker_behavior' };
            } else if (category === 'road_environment') {
                if (text.includes('পানি') || text.includes('water')) {
                    return { category, subcategory: 'water_logging' };
                } else if (text.includes('ম্যানহোল') || text.includes('manhole')) {
                    return { category, subcategory: 'manhole_issue' };
                } else {
                    return { category, subcategory: 'road_waste' };
                }
            } else if (category === 'events') {
                return { category, subcategory: 'event_description' };
            } else {
                return { category, subcategory: 'not_collecting' };
            }
        }
    }

    // Default suggestion
    return { category: 'home', subcategory: 'not_collecting_waste' };
}

/**
 * Main migration function
 */
async function main() {
    console.log('\n🔄 Complaint Category Migration Script');
    console.log('═'.repeat(60));

    const strategy = getStrategy();
    console.log(`Strategy: ${strategy.toUpperCase()}`);

    try {
        // Find complaints without categories
        console.log('\n🔍 Searching for complaints without categories...');
        const complaints = await findComplaintsWithoutCategories();

        // Execute strategy
        let result;
        switch (strategy) {
            case 'null':
                result = await strategyKeepNull(complaints);
                break;
            case 'default':
                result = await strategySetDefault(complaints);
                break;
            case 'export':
                result = await strategyExport(complaints);
                break;
            default:
                throw new Error(`Unknown strategy: ${strategy}`);
        }

        // Save migration log
        const logFilename = `migration-log-${Date.now()}.json`;
        const logFilepath = path.join(__dirname, logFilename);
        fs.writeFileSync(logFilepath, JSON.stringify({
            timestamp: new Date().toISOString(),
            ...result,
        }, null, 2), 'utf8');

        console.log(`\n📝 Migration log saved to: ${logFilename}`);
        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
main();
