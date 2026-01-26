/**
 * Apply Composite Index to UserZone Table
 * 
 * This script adds the missing composite index (userId, zoneId) to the user_zones table
 * for optimal query performance in multi-zone Super Admin management.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyCompositeIndex() {
    let connection;

    try {
        console.log('🔍 Connecting to database...\n');

        // Parse DATABASE_URL
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL not found in environment variables');
        }

        // Parse mysql://username:password@host:port/database
        const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (!urlMatch) {
            throw new Error('Invalid DATABASE_URL format');
        }

        const [, user, password, host, port, database] = urlMatch;

        connection = await mysql.createConnection({
            host,
            port: parseInt(port),
            user,
            password,
            database,
            multipleStatements: true,
        });

        console.log('✅ Connected to database\n');

        // Check if index already exists
        console.log('🔍 Checking if composite index exists...\n');

        const [existingIndexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'user_zones' 
        AND INDEX_NAME = 'user_zones_userId_zoneId_idx'
    `);

        if (existingIndexes.length > 0) {
            console.log('✅ Composite index already exists!\n');
            console.log('Index: user_zones_userId_zoneId_idx');
            console.log('Columns: userId, zoneId');
            console.log('\nNo action needed.');
            return;
        }

        console.log('📝 Composite index not found. Creating...\n');

        // Read migration SQL
        const migrationPath = path.join(__dirname, 'prisma', 'migrations', 'add_user_zones_composite_index.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute migration
        await connection.query(migrationSQL);

        console.log('✅ Composite index created successfully!\n');

        // Verify the index was created
        const [newIndexes] = await connection.execute(`
      SHOW INDEX FROM user_zones WHERE Key_name = 'user_zones_userId_zoneId_idx'
    `);

        if (newIndexes.length > 0) {
            console.log('✅ Verification successful!\n');
            console.log('Index Details:');
            console.log('═══════════════════════════════════════════════════════════');
            newIndexes.forEach(idx => {
                console.log(`Column: ${idx.Column_name}`);
                console.log(`Sequence: ${idx.Seq_in_index}`);
                console.log(`Index Type: ${idx.Index_type}`);
                console.log(`Cardinality: ${idx.Cardinality}`);
                console.log('');
            });
            console.log('═══════════════════════════════════════════════════════════\n');

            console.log('🎉 SUCCESS: Composite index is now active!\n');
            console.log('This index will optimize queries that filter by both userId and zoneId,');
            console.log('improving performance for multi-zone Super Admin operations.');
        } else {
            throw new Error('Index creation verification failed');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the script
applyCompositeIndex();
