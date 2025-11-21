const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkThanas() {
    try {
        console.log('🔍 Checking Thanas in Database...\n');

        // Get all city corporations
        const cityCorporations = await prisma.cityCorporation.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                status: true
            }
        });

        console.log('📍 City Corporations:');
        cityCorporations.forEach(cc => {
            console.log(`  - ${cc.name} (${cc.code}) - ${cc.status} - ID: ${cc.id}`);
        });
        console.log('');

        // Get all thanas
        const allThanas = await prisma.thana.findMany({
            include: {
                cityCorporation: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            }
        });

        console.log(`📋 Total Thanas: ${allThanas.length}\n`);

        if (allThanas.length === 0) {
            console.log('⚠️  No thanas found in database!\n');
        } else {
            // Group by city corporation
            const dsccThanas = allThanas.filter(t => t.cityCorporation.code === 'DSCC');
            const dnccThanas = allThanas.filter(t => t.cityCorporation.code === 'DNCC');

            console.log(`DSCC Thanas (${dsccThanas.length}):`);
            dsccThanas.forEach(t => {
                console.log(`  - ${t.name} (ID: ${t.id}, Status: ${t.status})`);
            });
            console.log('');

            console.log(`DNCC Thanas (${dnccThanas.length}):`);
            dnccThanas.forEach(t => {
                console.log(`  - ${t.name} (ID: ${t.id}, Status: ${t.status})`);
            });
            console.log('');
        }

        // Check the schema
        console.log('🔍 Checking Thana table structure...');
        const thanaFields = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'Thana'
            ORDER BY ordinal_position;
        `;
        console.log('Thana table columns:', thanaFields);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkThanas();
