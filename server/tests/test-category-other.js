/**
 * Test script to check complaints with 'other' category
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testOtherCategory() {
    console.log('Checking complaints with "other" category...\n');

    try {
        // Find complaints with 'other' category
        const complaintsWithOther = await prisma.complaint.findMany({
            where: {
                category: 'other'
            },
            select: {
                id: true,
                title: true,
                category: true,
                subcategory: true,
                status: true
            },
            take: 10
        });

        console.log(`Found ${complaintsWithOther.length} complaints with 'other' category:`);
        complaintsWithOther.forEach(c => {
            console.log(`  - ID: ${c.id}, Title: ${c.title}, Subcategory: ${c.subcategory || 'null'}`);
        });

        // Find complaints with null category
        const complaintsWithNull = await prisma.complaint.findMany({
            where: {
                OR: [
                    { category: null },
                    { category: '' }
                ]
            },
            select: {
                id: true,
                title: true,
                category: true,
                subcategory: true
            },
            take: 10
        });

        console.log(`\nFound ${complaintsWithNull.length} complaints with null/empty category:`);
        complaintsWithNull.forEach(c => {
            console.log(`  - ID: ${c.id}, Title: ${c.title}`);
        });

        // Get all unique categories
        const allCategories = await prisma.complaint.groupBy({
            by: ['category'],
            _count: {
                category: true
            }
        });

        console.log('\nAll unique categories in database:');
        allCategories.forEach(cat => {
            console.log(`  - ${cat.category || 'null'}: ${cat._count.category} complaints`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testOtherCategory();
