/**
 * Apply Language Preference Migration
 * ভাষা প্রেফারেন্স মাইগ্রেশন প্রয়োগ করুন
 * 
 * This script adds preferredLanguage field to users table
 * এই স্ক্রিপ্ট ইউজার টেবিলে preferredLanguage ফিল্ড যোগ করে
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
    try {
        console.log('🚀 Starting language preference migration...');
        console.log('🚀 ভাষা প্রেফারেন্স মাইগ্রেশন শুরু হচ্ছে...\n');

        // Read migration SQL
        const migrationPath = path.join(
            __dirname,
            'prisma/migrations/20260125_add_user_language_preference/migration.sql'
        );

        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        console.log(`📝 ${statements.length}টি SQL স্টেটমেন্ট পাওয়া গেছে\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`\n⚙️  Executing statement ${i + 1}/${statements.length}...`);
            console.log(`⚙️  স্টেটমেন্ট ${i + 1}/${statements.length} চলছে...`);

            try {
                await prisma.$executeRawUnsafe(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
                console.log(`✅ স্টেটমেন্ট ${i + 1} সফলভাবে সম্পন্ন হয়েছে`);
            } catch (error) {
                // Check if column already exists
                if (error.message.includes('Duplicate column name')) {
                    console.log(`⚠️  Column already exists, skipping...`);
                    console.log(`⚠️  কলাম ইতিমধ্যে আছে, এড়িয়ে যাওয়া হচ্ছে...`);
                } else {
                    throw error;
                }
            }
        }

        // Verify migration
        console.log('\n🔍 Verifying migration...');
        console.log('🔍 মাইগ্রেশন যাচাই করা হচ্ছে...\n');

        const result = await prisma.$queryRaw`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'preferredLanguage'
        `;

        if (result && result.length > 0) {
            console.log('✅ Migration verified successfully!');
            console.log('✅ মাইগ্রেশন সফলভাবে যাচাই হয়েছে!');
            console.log('\nColumn details / কলামের বিবরণ:');
            console.log(result[0]);
        } else {
            throw new Error('Migration verification failed - column not found');
        }

        // Check user count
        const userCount = await prisma.user.count();
        const usersWithLanguage = await prisma.user.count({
            where: {
                preferredLanguage: {
                    not: null
                }
            }
        });

        console.log(`\n📊 Total users / মোট ইউজার: ${userCount}`);
        console.log(`📊 Users with language preference / ভাষা প্রেফারেন্স সহ ইউজার: ${usersWithLanguage}`);

        console.log('\n✅ Migration completed successfully!');
        console.log('✅ মাইগ্রেশন সফলভাবে সম্পন্ন হয়েছে!');

    } catch (error) {
        console.error('\n❌ Migration failed / মাইগ্রেশন ব্যর্থ হয়েছে:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
applyMigration();
