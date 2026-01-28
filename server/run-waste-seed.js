const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runSeed() {
    try {
        console.log('🚀 Starting waste management posts seed...\n');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'seed-waste-management-posts.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolon and filter out comments and empty lines
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s.length > 10);

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        // Execute each INSERT statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.toUpperCase().includes('INSERT INTO')) {
                try {
                    await prisma.$executeRawUnsafe(statement);
                    console.log(`✅ Post ${i + 1} created successfully`);
                } catch (error) {
                    console.error(`❌ Error creating post ${i + 1}:`, error.message);
                }
            }
        }

        console.log('\n🎉 Seed completed! Check your mobile app to see the posts.\n');
    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runSeed();
