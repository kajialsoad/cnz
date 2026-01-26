/**
 * Verification Script: UserZone Table Indexes
 * 
 * This script verifies that all required indexes exist on the user_zones table
 * for optimal query performance in multi-zone Super Admin management.
 * 
 * Required Indexes:
 * 1. userId - for filtering zones by user
 * 2. zoneId - for filtering users by zone
 * 3. assignedBy - for audit trail queries
 * 4. userId + zoneId (unique) - for preventing duplicate assignments
 * 5. userId + zoneId (composite) - for performance optimization
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyIndexes() {
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
        });

        console.log('✅ Connected to database\n');
        console.log('📊 Checking indexes on user_zones table...\n');

        // Get all indexes on user_zones table
        const [indexes] = await connection.execute(`
      SHOW INDEX FROM user_zones
    `);

        console.log('Found indexes:');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Group indexes by key name
        const indexGroups = {};
        indexes.forEach(index => {
            if (!indexGroups[index.Key_name]) {
                indexGroups[index.Key_name] = [];
            }
            indexGroups[index.Key_name].push(index);
        });

        // Display all indexes
        Object.entries(indexGroups).forEach(([keyName, columns]) => {
            const columnNames = columns
                .sort((a, b) => a.Seq_in_index - b.Seq_in_index)
                .map(col => col.Column_name)
                .join(', ');

            const isUnique = columns[0].Non_unique === 0 ? '🔒 UNIQUE' : '📑 INDEX';
            const indexType = columns[0].Index_type;

            console.log(`${isUnique} - ${keyName}`);
            console.log(`  Columns: ${columnNames}`);
            console.log(`  Type: ${indexType}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════\n');

        // Verify required indexes
        const requiredIndexes = [
            { name: 'user_zones_userId_idx', columns: ['userId'], type: 'INDEX' },
            { name: 'user_zones_zoneId_idx', columns: ['zoneId'], type: 'INDEX' },
            { name: 'user_zones_assignedBy_idx', columns: ['assignedBy'], type: 'INDEX' },
            { name: 'user_zones_userId_zoneId_key', columns: ['userId', 'zoneId'], type: 'UNIQUE' },
            { name: 'user_zones_userId_zoneId_idx', columns: ['userId', 'zoneId'], type: 'INDEX' },
        ];

        console.log('✓ Verification Results:\n');

        let allIndexesPresent = true;
        requiredIndexes.forEach(required => {
            const found = indexGroups[required.name];

            if (found) {
                const foundColumns = found
                    .sort((a, b) => a.Seq_in_index - b.Seq_in_index)
                    .map(col => col.Column_name);

                const columnsMatch = JSON.stringify(foundColumns) === JSON.stringify(required.columns);
                const isUnique = found[0].Non_unique === 0;
                const typeMatch = required.type === 'UNIQUE' ? isUnique : !isUnique;

                if (columnsMatch && typeMatch) {
                    console.log(`✅ ${required.name}`);
                    console.log(`   Type: ${required.type}`);
                    console.log(`   Columns: ${required.columns.join(', ')}`);
                } else {
                    console.log(`⚠️  ${required.name} - MISMATCH`);
                    console.log(`   Expected: ${required.type} on [${required.columns.join(', ')}]`);
                    console.log(`   Found: ${isUnique ? 'UNIQUE' : 'INDEX'} on [${foundColumns.join(', ')}]`);
                    allIndexesPresent = false;
                }
            } else {
                console.log(`❌ ${required.name} - MISSING`);
                console.log(`   Expected: ${required.type} on [${required.columns.join(', ')}]`);
                allIndexesPresent = false;
            }
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════════════\n');

        // Performance analysis
        console.log('📈 Performance Analysis:\n');

        // Check table statistics
        const [tableStats] = await connection.execute(`
      SELECT 
        TABLE_ROWS as row_count,
        AVG_ROW_LENGTH as avg_row_length,
        DATA_LENGTH as data_size,
        INDEX_LENGTH as index_size
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_zones'
    `);

        if (tableStats.length > 0) {
            const stats = tableStats[0];
            console.log(`Rows: ${stats.row_count || 0}`);
            console.log(`Data Size: ${(stats.data_size / 1024).toFixed(2)} KB`);
            console.log(`Index Size: ${(stats.index_size / 1024).toFixed(2)} KB`);
            console.log(`Avg Row Length: ${stats.avg_row_length || 0} bytes`);
        }

        console.log('\n═══════════════════════════════════════════════════════════\n');

        if (allIndexesPresent) {
            console.log('🎉 SUCCESS: All required indexes are present and correctly configured!\n');
            console.log('The user_zones table is optimized for:');
            console.log('  • Fast user-to-zones lookups (userId index)');
            console.log('  • Fast zone-to-users lookups (zoneId index)');
            console.log('  • Audit trail queries (assignedBy index)');
            console.log('  • Duplicate prevention (unique constraint)');
            console.log('  • Composite queries (userId + zoneId index)');
            console.log('');
            process.exit(0);
        } else {
            console.log('⚠️  WARNING: Some required indexes are missing or misconfigured.\n');
            console.log('Please run the migration again or manually create the missing indexes.');
            console.log('');
            process.exit(1);
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

// Run verification
verifyIndexes();
