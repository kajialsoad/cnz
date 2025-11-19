/**
 * Apply Category Migration: Make category and subcategory fields optional
 * 
 * This script manually applies the migration to make category and subcategory
 * fields optional in the Complaint table. This is necessary for backward
 * compatibility with existing complaints.
 * 
 * Usage:
 *   node apply-category-migration.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('\n🔄 Applying Category Migration');
    console.log('═'.repeat(60));
    console.log('Making category and subcategory fields optional...\n');

    try {
        // Execute the migration SQL
        await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Complaint\` MODIFY \`category\` VARCHAR(191) NULL;
    `);
        console.log('✓ Made category field optional');

        await prisma.$executeRawUnsafe(`
      ALTER TABLE \`Complaint\` MODIFY \`subcategory\` VARCHAR(191) NULL;
    `);
        console.log('✓ Made subcategory field optional');

        // Verify the changes
        const result = await prisma.$queryRawUnsafe(`
      SHOW COLUMNS FROM \`Complaint\` WHERE Field IN ('category', 'subcategory');
    `);

        console.log('\n📋 Current field definitions:');
        console.log(result);

        console.log('\n✅ Migration applied successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npx prisma generate');
        console.log('2. Run: node migrate-null-categories.js --strategy=null');
        console.log('3. Deploy admin panel updates');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nPossible reasons:');
        console.error('- Database connection issue');
        console.error('- Insufficient permissions');
        console.error('- Migration already applied');
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
