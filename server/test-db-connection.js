const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
    console.log('🔍 Testing Database Connection...\n');

    try {
        // Test 1: Simple query
        console.log('1️⃣ Testing basic connection...');
        await prisma.$connect();
        console.log('✅ Connected to database\n');

        // Test 2: Count city corporations
        console.log('2️⃣ Counting city corporations...');
        const count = await prisma.cityCorporation.count();
        console.log(`✅ Found ${count} city corporations\n`);

        // Test 3: Fetch active city corporations
        console.log('3️⃣ Fetching active city corporations...');
        const cityCorporations = await prisma.cityCorporation.findMany({
            where: { status: 'ACTIVE' },
            select: {
                code: true,
                name: true,
                minWard: true,
                maxWard: true,
            }
        });
        console.log('✅ Active City Corporations:', cityCorporations);

    } catch (error) {
        console.error('❌ Database Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
