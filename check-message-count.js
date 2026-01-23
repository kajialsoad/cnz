/**
 * Check Message Count - MongoDB Migration Decision Helper
 * 
 * This script checks your current chat message volume to help decide
 * whether MongoDB migration is needed.
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './server/.env' });

// Parse DATABASE_URL
function parseDatabaseUrl(url) {
    // Format: mysql://username:password@host:port/database?params
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        host: match[3],
        port: parseInt(match[4]),
        user: match[1],
        password: match[2],
        database: match[5]
    };
}

async function checkMessageCount() {
    let connection;

    try {
        console.log('🔍 Checking chat message volume...\n');

        // Parse connection details
        const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

        // Create connection
        connection = await mysql.createConnection(dbConfig);

        console.log('✅ Connected to database\n');

        // Get Live Chat message count
        const [liveChatRows] = await connection.query(
            'SELECT COUNT(*) as count FROM chat_messages'
        );
        const liveChatCount = liveChatRows[0].count;

        // Get Complaint Chat message count
        const [complaintChatRows] = await connection.query(
            'SELECT COUNT(*) as count FROM complaint_chat_messages'
        );
        const complaintChatCount = complaintChatRows[0].count;

        // Calculate total
        const totalMessages = liveChatCount + complaintChatCount;

        // Get table sizes
        const [liveChatSize] = await connection.query(`
            SELECT 
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.TABLES 
            WHERE table_schema = ? AND table_name = 'chat_messages'
        `, [dbConfig.database]);

        const [complaintChatSize] = await connection.query(`
            SELECT 
                ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
            FROM information_schema.TABLES 
            WHERE table_schema = ? AND table_name = 'complaint_chat_messages'
        `, [dbConfig.database]);

        const liveChatSizeMB = liveChatSize[0]?.size_mb || 0;
        const complaintChatSizeMB = complaintChatSize[0]?.size_mb || 0;
        const totalSizeMB = liveChatSizeMB + complaintChatSizeMB;

        // Display results
        console.log('📊 MESSAGE VOLUME REPORT');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('📱 Live Chat Messages:');
        console.log(`   Count: ${liveChatCount.toLocaleString()}`);
        console.log(`   Size:  ${liveChatSizeMB} MB\n`);

        console.log('💬 Complaint Chat Messages:');
        console.log(`   Count: ${complaintChatCount.toLocaleString()}`);
        console.log(`   Size:  ${complaintChatSizeMB} MB\n`);

        console.log('📈 TOTAL:');
        console.log(`   Messages: ${totalMessages.toLocaleString()}`);
        console.log(`   Size:     ${totalSizeMB} MB\n`);

        console.log('═══════════════════════════════════════════════════\n');

        // Provide recommendation
        console.log('💡 RECOMMENDATION:\n');

        if (totalMessages < 50000) {
            console.log('✅ KEEP MYSQL');
            console.log('   Your message volume is low.');
            console.log('   Current MySQL setup is perfect.');
            console.log('   No action needed.\n');
            console.log('   Next check: When you reach 50K messages');
        } else if (totalMessages < 100000) {
            console.log('⚠️  MONITOR CLOSELY');
            console.log('   Your message volume is moderate.');
            console.log('   MySQL is still fine, but monitor performance.');
            console.log('   Check query times and user experience.\n');
            console.log('   Next check: Monthly');
        } else if (totalMessages < 500000) {
            console.log('🔄 START PLANNING MIGRATION');
            console.log('   Your message volume is growing.');
            console.log('   Consider MongoDB migration soon.');
            console.log('   Start testing MongoDB in parallel.\n');
            console.log('   Timeline: 1-2 months');
        } else {
            console.log('🚀 MIGRATE TO MONGODB NOW');
            console.log('   Your message volume is high!');
            console.log('   MongoDB migration recommended immediately.');
            console.log('   Current MySQL may be slow.\n');
            console.log('   Timeline: Start this week');
        }

        console.log('═══════════════════════════════════════════════════\n');

        // Cost estimate
        console.log('💰 MONGODB COST ESTIMATE:\n');

        if (totalSizeMB < 512) {
            console.log('   MongoDB Atlas Free Tier: $0/month');
            console.log('   (512MB storage - sufficient for your data)');
        } else if (totalSizeMB < 2048) {
            console.log('   MongoDB Atlas M2: $9/month');
            console.log('   (2GB storage - recommended)');
        } else if (totalSizeMB < 10240) {
            console.log('   MongoDB Atlas M10: $25/month');
            console.log('   (10GB storage - recommended)');
        } else {
            console.log('   MongoDB Atlas M20: $57/month');
            console.log('   (20GB storage - recommended)');
        }

        console.log('\n═══════════════════════════════════════════════════\n');

        // Growth projection
        const [oldestMessage] = await connection.query(`
            SELECT MIN(createdAt) as oldest FROM (
                SELECT createdAt FROM chat_messages
                UNION ALL
                SELECT createdAt FROM complaint_chat_messages
            ) as all_messages
        `);

        if (oldestMessage[0].oldest) {
            const oldestDate = new Date(oldestMessage[0].oldest);
            const now = new Date();
            const daysSinceStart = Math.floor((now - oldestDate) / (1000 * 60 * 60 * 24));
            const messagesPerDay = totalMessages / daysSinceStart;

            console.log('📈 GROWTH PROJECTION:\n');
            console.log(`   Data collection started: ${oldestDate.toLocaleDateString()}`);
            console.log(`   Days of data: ${daysSinceStart}`);
            console.log(`   Average messages/day: ${Math.round(messagesPerDay).toLocaleString()}\n`);

            // Project future
            const daysTo100K = Math.ceil((100000 - totalMessages) / messagesPerDay);
            const daysTo500K = Math.ceil((500000 - totalMessages) / messagesPerDay);

            if (totalMessages < 100000 && daysTo100K > 0) {
                console.log(`   Will reach 100K in: ~${daysTo100K} days (${Math.ceil(daysTo100K / 30)} months)`);
            }
            if (totalMessages < 500000 && daysTo500K > 0) {
                console.log(`   Will reach 500K in: ~${daysTo500K} days (${Math.ceil(daysTo500K / 30)} months)`);
            }

            console.log('\n═══════════════════════════════════════════════════\n');
        }

        // Action items
        console.log('✅ NEXT STEPS:\n');

        if (totalMessages < 100000) {
            console.log('   1. Continue using MySQL');
            console.log('   2. Run this script monthly');
            console.log('   3. Monitor query performance');
            console.log('   4. Keep MongoDB guide for future reference');
        } else if (totalMessages < 500000) {
            console.log('   1. Read: MONGODB_CHAT_MIGRATION_GUIDE_BANGLA.md');
            console.log('   2. Setup MongoDB Atlas free tier for testing');
            console.log('   3. Test migration with sample data');
            console.log('   4. Plan migration timeline (1-2 months)');
        } else {
            console.log('   1. Read: MONGODB_CHAT_MIGRATION_GUIDE_BANGLA.md');
            console.log('   2. Setup MongoDB Atlas (M2 or M10 tier)');
            console.log('   3. Start migration immediately');
            console.log('   4. Timeline: 2-3 weeks');
        }

        console.log('\n═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the check
checkMessageCount();

