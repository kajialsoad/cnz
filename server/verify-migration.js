const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
    console.log('🔍 Verifying database migration...\n');

    try {
        // Check City Corporations
        const cityCorporations = await prisma.cityCorporation.findMany({
            include: {
                _count: {
                    select: {
                        thanas: true,
                        users: true,
                    },
                },
            },
        });

        console.log('📊 City Corporations:');
        cityCorporations.forEach((cc) => {
            console.log(`  - ${cc.name} (${cc.code})`);
            console.log(`    Ward Range: ${cc.minWard} - ${cc.maxWard}`);
            console.log(`    Status: ${cc.status}`);
            console.log(`    Thanas: ${cc._count.thanas}`);
            console.log(`    Users: ${cc._count.users}`);
            console.log('');
        });

        // Check Thanas
        const thanas = await prisma.thana.findMany({
            include: {
                cityCorporation: true,
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: {
                cityCorporationId: 'asc',
            },
        });

        console.log(`📍 Total Thanas: ${thanas.length}`);
        console.log('');

        // Check Users with city corporation
        const usersWithCC = await prisma.user.count({
            where: {
                cityCorporationCode: {
                    not: null,
                },
            },
        });

        const totalUsers = await prisma.user.count();

        console.log('👥 Users:');
        console.log(`  - Total users: ${totalUsers}`);
        console.log(`  - Users with city corporation: ${usersWithCC}`);
        console.log(`  - Users without city corporation: ${totalUsers - usersWithCC}`);
        console.log('');

        // Sample user data
        const sampleUsers = await prisma.user.findMany({
            where: {
                cityCorporationCode: {
                    not: null,
                },
            },
            include: {
                cityCorporation: true,
                thana: true,
            },
            take: 3,
        });

        console.log('📋 Sample Users:');
        sampleUsers.forEach((user) => {
            console.log(`  - ${user.firstName} ${user.lastName}`);
            console.log(`    City Corporation: ${user.cityCorporation?.name || 'N/A'}`);
            console.log(`    Ward: ${user.ward || 'N/A'}`);
            console.log(`    Thana: ${user.thana?.name || 'N/A'}`);
            console.log('');
        });

        console.log('✅ Migration verification completed successfully!');
    } catch (error) {
        console.error('❌ Error verifying migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifyMigration()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
