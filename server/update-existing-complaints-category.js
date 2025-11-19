const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExistingComplaints() {
    try {
        console.log('Updating existing complaints with default category...');

        // Update all complaints with NULL category to 'other'
        const result = await prisma.complaint.updateMany({
            where: {
                category: null
            },
            data: {
                category: 'other' // Default category for existing complaints
            }
        });

        console.log(`✅ Updated ${result.count} complaints with default category 'other'`);

        // Verify the update
        const nullCategoryCount = await prisma.complaint.count({
            where: {
                category: null
            }
        });

        console.log(`Remaining complaints with NULL category: ${nullCategoryCount}`);

    } catch (error) {
        console.error('Error updating complaints:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateExistingComplaints()
    .then(() => {
        console.log('Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
