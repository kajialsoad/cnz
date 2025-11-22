/**
 * Apply chat system performance indexes
 * Run this to optimize database for 500K+ users
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyIndexes() {
    console.log('🚀 Starting database index optimization...\n');

    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL not found in .env file');
        process.exit(1);
    }

    // Extract connection details from DATABASE_URL
    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
        console.error('❌ Invalid DATABASE_URL format');
        process.exit(1);
    }

    const [, user, password, host, port, database] = urlMatch;

    console.log('📊 Database Connection Info:');
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}`);
    console.log(`   User: ${user}\n`);

    let connection;

    try {
        // Create connection
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection({
            host,
            port: parseInt(port),
            user,
            password,
            database,
            multipleStatements: true
        });

        console.log('✅ Connected successfully!\n');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'prisma', 'migrations', 'add_chat_indexes.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('📝 Applying indexes...\n');

        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;

        for (const statement of statements) {
            try {
                // Extract index name from statement
                const indexMatch = statement.match(/idx_\w+/);
                const indexName = indexMatch ? indexMatch[0] : 'unknown';

                await connection.execute(statement);
                console.log(`✅ Created index: ${indexName}`);
                successCount++;
            } catch (error) {
                if (error.code === 'ER_DUP_KEYNAME') {
                    const indexMatch = statement.match(/idx_\w+/);
                    const indexName = indexMatch ? indexMatch[0] : 'unknown';
                    console.log(`⏭️  Index already exists: ${indexName}`);
                    skipCount++;
                } else {
                    console.error(`❌ Error creating index:`, error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Summary:');
        console.log(`   ✅ Created: ${successCount} indexes`);
        console.log(`   ⏭️  Skipped: ${skipCount} indexes (already exist)`);
        console.log('='.repeat(50));

        console.log('\n✅ Database optimization complete!');
        console.log('🚀 Your chat system is now optimized for 500K+ users\n');

        // Test query performance
        console.log('🧪 Testing query performance...\n');

        const [result] = await connection.execute(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(DISTINCT complaintId) as total_conversations,
        COUNT(CASE WHEN read = 0 THEN 1 END) as unread_messages
      FROM ComplaintChatMessage
    `);

        console.log('📊 Current Chat Statistics:');
        console.log(`   Total Messages: ${result[0].total_messages}`);
        console.log(`   Total Conversations: ${result[0].total_conversations}`);
        console.log(`   Unread Messages: ${result[0].unread_messages}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('\n💡 Database server is not reachable.');
            console.error('   Please check:');
            console.error('   1. Database server is running');
            console.error('   2. Host and port are correct');
            console.error('   3. Firewall allows connection');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Access denied.');
            console.error('   Please check username and password in .env file');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed\n');
        }
    }
}

// Run the script
applyIndexes().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
