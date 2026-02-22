const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const BACKUP_FILE_PATH = path.join(__dirname, 'beckupserversql file', 'full_backup.sql');

async function importBackup() {
    console.log('🚀 Starting database import...');
    console.log(`📂 Backup file: ${BACKUP_FILE_PATH}`);

    if (!fs.existsSync(BACKUP_FILE_PATH)) {
        console.error('❌ Backup file not found!');
        process.exit(1);
    }

    // Create connection with multipleStatements enabled
    const connection = await mysql.createConnection({
        uri: process.env.DATABASE_URL,
        multipleStatements: true
    });

    console.log('✅ Connected to database.');

    try {
        console.log('📖 Reading backup file...');
        const sql = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');

        console.log('🔄 Executing SQL script (this might take a moment)...');
        
        // Execute the entire script
        // Note: For very large files, streaming is better, but for typical backups readFileSync is often fine.
        // If the file is huge (hundreds of MBs), we might need a stream-based approach, 
        // but mysql2 driver usually handles the query string.
        
        await connection.query(sql);

        console.log('✅ Import completed successfully!');
    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        await connection.end();
        console.log('🔌 Disconnected.');
    }
}

importBackup();