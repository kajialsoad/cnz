const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingComplaints() {
    try {
        console.log('Updating existing complaints with default subcategory...');

        // Update all complaints with NULL subcategory to 'general'
        const result = await prisma.complaint.updateMany({
            where: {
                subcategory: null
            },
            data: {
                subcategory: 'general' // Default subcategory for existing complaints
            }
        });

        console.log(`✅ Updated ${result.count} complaints with default subcategory 'general'`);

        // Verify the update
        const nullSubcategoryCount = await prisma.complaint.count({
            where: {
                subcategory: null
            }
        });

        console.log(`Remaining complaints with NULL subcategory: ${nullSubcategoryCount}`);

        // Show sample of updated complaints
        const sampleComplaints = await prisma.complaint.findMany({
            take: 3,
            select: {
                id: true,
                title: true,
                category: true,
                subcategory: true
            }
        });

        console.log('\nSample complaints after update:');
        sampleComplaints.forEach(c => {
            console.log(`  ID ${c.id}: ${c.title} - Category: ${c.category}, Subcategory: ${c.subcategory}`);
        });

    } catch (error) {
        console.error('Error updating complaints:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingComplaints()
    .then(() => {
        console.log('\nMigration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
