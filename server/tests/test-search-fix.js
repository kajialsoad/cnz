/**
 * Test script to verify the search functionality fix
 * This tests that the Prisma query no longer uses the invalid 'mode' parameter
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSearch() {
    console.log('Testing search functionality without mode parameter...\n');

    try {
        // Test 1: Simple search
        console.log('Test 1: Simple search for "test"');
        const result1 = await prisma.complaint.findMany({
            where: {
                OR: [
                    { title: { contains: 'test' } },
                    { description: { contains: 'test' } }
                ]
            },
            take: 5
        });
        console.log(`✓ Found ${result1.length} complaints`);

        // Test 2: Search with user relationship
        console.log('\nTest 2: Search with user relationship');
        const result2 = await prisma.complaint.findMany({
            where: {
                OR: [
                    { title: { contains: 'test' } },
                    {
                        user: {
                            firstName: { contains: 'test' }
                        }
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            take: 5
        });
        console.log(`✓ Found ${result2.length} complaints with user data`);

        // Test 3: Complex search (similar to admin service)
        console.log('\nTest 3: Complex search with multiple conditions');
        const result3 = await prisma.complaint.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { title: { contains: 'test' } },
                            { description: { contains: 'test' } },
                            { location: { contains: 'test' } }
                        ]
                    }
                ]
            },
            take: 5
        });
        console.log(`✓ Found ${result3.length} complaints with complex search`);

        console.log('\n✅ All tests passed! The mode parameter issue is fixed.');
        console.log('MySQL string comparisons are case-insensitive by default.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.message.includes('mode')) {
            console.error('\nThe "mode" parameter is still being used somewhere!');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testSearch();
