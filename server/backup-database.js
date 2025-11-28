#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a backup of the database before running migrations.
 * This script exports the database schema and data to a SQL file.
 * 
 * Usage:
 *   node backup-database.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Parse DATABASE_URL to extract connection details
 */
function parseDatabaseUrl(url) {
    // Format: mysql://username:password@host:port/database
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('Invalid DATABASE_URL format');
    }

    return {
        username: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        database: match[5]
    };
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDirectory() {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    return `backup-${timestamp}-${time}.sql`;
}

/**
 * Create database backup using mysqldump
 */
async function createBackup() {
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE BACKUP SCRIPT');
    console.log('='.repeat(80));
    console.log('');

    try {
        // Parse database URL
        const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🖥️  Host: ${dbConfig.host}:${dbConfig.port}`);
        console.log('');

        // Ensure backup directory exists
        const backupDir = ensureBackupDirectory();
        const backupFilename = generateBackupFilename();
        const backupPath = path.join(backupDir, backupFilename);

        console.log('🔄 Creating backup...');
        console.log(`📁 Backup location: ${backupPath}`);
        console.log('');

        // Build mysqldump command
        const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} > "${backupPath}"`;

        // Execute backup
        await new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });

        // Verify backup file was created
        if (fs.existsSync(backupPath)) {
            const stats = fs.statSync(backupPath);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            console.log('✅ Backup created successfully!');
            console.log(`📦 File size: ${fileSizeMB} MB`);
            console.log(`📄 File: ${backupFilename}`);
            console.log('');
            console.log('='.repeat(80));
            console.log('');
            console.log('⚠️  IMPORTANT: Keep this backup safe until migration is verified!');
            console.log('');

            return backupPath;
        } else {
            throw new Error('Backup file was not created');
        }

    } catch (error) {
        console.error('\n❌ Backup failed:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('  1. Ensure mysqldump is installed and in your PATH');
        console.error('  2. Verify DATABASE_URL is correct in .env file');
        console.error('  3. Check database connection and credentials');
        console.error('  4. Ensure you have read permissions on the database');
        console.error('');
        throw error;
    }
}

/**
 * Alternative: Create Prisma-based backup
 */
async function createPrismaBackup() {
    console.log('\n' + '='.repeat(80));
    console.log('PRISMA DATABASE BACKUP');
    console.log('='.repeat(80));
    console.log('');
    console.log('⚠️  Note: This creates a JSON export of data, not a SQL dump.');
    console.log('');

    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Ensure backup directory exists
        const backupDir = ensureBackupDirectory();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `backup-prisma-${timestamp}.json`;
        const backupPath = path.join(backupDir, backupFilename);

        console.log('🔄 Exporting data...');

        // Export all relevant tables
        const data = {
            complaints: await prisma.complaint.findMany(),
            chatMessages: await prisma.complaintChatMessage.findMany(),
            users: await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            timestamp: new Date().toISOString()
        };

        // Save to file
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf8');

        const stats = fs.statSync(backupPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('✅ Prisma backup created successfully!');
        console.log(`📦 File size: ${fileSizeMB} MB`);
        console.log(`📄 File: ${backupFilename}`);
        console.log(`📊 Records exported:`);
        console.log(`   - Complaints: ${data.complaints.length}`);
        console.log(`   - Chat Messages: ${data.chatMessages.length}`);
        console.log(`   - Users: ${data.users.length}`);
        console.log('');
        console.log('='.repeat(80));
        console.log('');

        await prisma.$disconnect();

        return backupPath;

    } catch (error) {
        console.error('\n❌ Prisma backup failed:', error.message);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        // Check if DATABASE_URL is configured
        if (!process.env.DATABASE_URL) {
            console.error('❌ DATABASE_URL not configured in .env file');
            process.exit(1);
        }

        // Try mysqldump first, fall back to Prisma backup
        try {
            await createBackup();
        } catch (mysqldumpError) {
            console.log('⚠️  mysqldump not available, using Prisma backup instead...\n');
            await createPrismaBackup();
        }

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run main function
main();
