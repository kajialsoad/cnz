/**
 * Verification Script: Cascade Delete Configuration for UserZone
 * 
 * This script verifies that cascade delete is properly configured
 * for the UserZone table when a user is deleted.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCascadeDelete() {
    console.log('🔍 Verifying Cascade Delete Configuration for UserZone...\n');

    try {
        // Check if we can query the database structure
        const result = await prisma.$queryRaw`
      SELECT 
        kcu.TABLE_NAME,
        kcu.COLUMN_NAME,
        kcu.CONSTRAINT_NAME,
        kcu.REFERENCED_TABLE_NAME,
        kcu.REFERENCED_COLUMN_NAME,
        rc.DELETE_RULE,
        rc.UPDATE_RULE
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      JOIN 
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
        ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
        AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
      WHERE 
        kcu.TABLE_NAME = 'user_zones'
        AND kcu.COLUMN_NAME = 'userId'
        AND kcu.TABLE_SCHEMA = DATABASE()
    `;

        console.log('📋 Foreign Key Configuration for user_zones.userId:\n');

        if (result && result.length > 0) {
            const fkConfig = result[0];
            console.log(`✅ Constraint Name: ${fkConfig.CONSTRAINT_NAME}`);
            console.log(`✅ References: ${fkConfig.REFERENCED_TABLE_NAME}.${fkConfig.REFERENCED_COLUMN_NAME}`);
            console.log(`✅ ON DELETE: ${fkConfig.DELETE_RULE}`);
            console.log(`✅ ON UPDATE: ${fkConfig.UPDATE_RULE}\n`);

            if (fkConfig.DELETE_RULE === 'CASCADE') {
                console.log('✅ SUCCESS: Cascade delete is properly configured!');
                console.log('   When a user is deleted, all their UserZone records will be automatically deleted.\n');
                return true;
            } else {
                console.log(`❌ ERROR: Delete rule is ${fkConfig.DELETE_RULE}, expected CASCADE`);
                return false;
            }
        } else {
            console.log('❌ ERROR: Could not find foreign key constraint for user_zones.userId');
            return false;
        }

    } catch (error) {
        console.error('❌ Error verifying cascade delete:', error.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

// Run verification
verifyCascadeDelete()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
