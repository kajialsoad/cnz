const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUserZonesTable() {
    try {
        console.log('🚀 Creating user_zones table...\n');

        // Create the table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`user_zones\` (
        \`id\` INTEGER NOT NULL AUTO_INCREMENT,
        \`userId\` INTEGER NOT NULL,
        \`zoneId\` INTEGER NOT NULL,
        \`assignedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`assignedBy\` INTEGER NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`user_zones_userId_zoneId_key\`(\`userId\`, \`zoneId\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
        console.log('✅ Table created');

        // Add indexes
        console.log('\n📊 Creating indexes...');

        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX \`user_zones_userId_idx\` ON \`user_zones\`(\`userId\`)`);
            console.log('✅ userId index created');
        } catch (e) {
            if (e.message.includes('Duplicate key name')) {
                console.log('⚠️  userId index already exists');
            } else {
                throw e;
            }
        }

        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX \`user_zones_zoneId_idx\` ON \`user_zones\`(\`zoneId\`)`);
            console.log('✅ zoneId index created');
        } catch (e) {
            if (e.message.includes('Duplicate key name')) {
                console.log('⚠️  zoneId index already exists');
            } else {
                throw e;
            }
        }

        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX \`user_zones_assignedBy_idx\` ON \`user_zones\`(\`assignedBy\`)`);
            console.log('✅ assignedBy index created');
        } catch (e) {
            if (e.message.includes('Duplicate key name')) {
                console.log('⚠️  assignedBy index already exists');
            } else {
                throw e;
            }
        }

        // Add foreign keys
        console.log('\n🔗 Creating foreign keys...');

        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE \`user_zones\` 
        ADD CONSTRAINT \`user_zones_userId_fkey\` 
        FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ userId foreign key created');
        } catch (e) {
            if (e.message.includes('Duplicate foreign key')) {
                console.log('⚠️  userId foreign key already exists');
            } else {
                throw e;
            }
        }

        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE \`user_zones\` 
        ADD CONSTRAINT \`user_zones_zoneId_fkey\` 
        FOREIGN KEY (\`zoneId\`) REFERENCES \`zones\`(\`id\`) 
        ON DELETE CASCADE ON UPDATE CASCADE
      `);
            console.log('✅ zoneId foreign key created');
        } catch (e) {
            if (e.message.includes('Duplicate foreign key')) {
                console.log('⚠️  zoneId foreign key already exists');
            } else {
                throw e;
            }
        }

        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE \`user_zones\` 
        ADD CONSTRAINT \`user_zones_assignedBy_fkey\` 
        FOREIGN KEY (\`assignedBy\`) REFERENCES \`users\`(\`id\`) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
            console.log('✅ assignedBy foreign key created');
        } catch (e) {
            if (e.message.includes('Duplicate foreign key')) {
                console.log('⚠️  assignedBy foreign key already exists');
            } else {
                throw e;
            }
        }

        // Migrate existing data
        console.log('\n📦 Migrating existing Super Admin zone assignments...');
        const result = await prisma.$executeRawUnsafe(`
      INSERT INTO \`user_zones\` (\`userId\`, \`zoneId\`, \`assignedAt\`, \`assignedBy\`, \`createdAt\`, \`updatedAt\`)
      SELECT 
        \`id\` as \`userId\`,
        \`zoneId\`,
        \`createdAt\` as \`assignedAt\`,
        NULL as \`assignedBy\`,
        NOW() as \`createdAt\`,
        NOW() as \`updatedAt\`
      FROM \`users\`
      WHERE \`role\` = 'SUPER_ADMIN' 
        AND \`zoneId\` IS NOT NULL
      ON DUPLICATE KEY UPDATE \`updatedAt\` = NOW()
    `);
        console.log(`✅ Migrated ${result} existing zone assignments`);

        console.log('\n✅ user_zones table created successfully!');

        // Verify
        const count = await prisma.userZone.count();
        console.log(`\n📊 Total records in user_zones: ${count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createUserZonesTable();
