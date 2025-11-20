const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
    try {
        console.log('Verifying category field in Complaint model...\n');

        // Get a sample complaint to check the schema
        const sampleComplaint = await prisma.complaint.findFirst();

        if (sampleComplaint) {
            console.log('Sample complaint:');
            console.log({
                id: sampleComplaint.id,
                title: sampleComplaint.title,
                category: sampleComplaint.category,
                subcategory: sampleComplaint.subcategory,
                status: sampleComplaint.status
            });
            console.log('\n✅ Category field exists and is populated');
        }

        // Count complaints by category
        const categoryCounts = await prisma.complaint.groupBy({
            by: ['category'],
            _count: {
                category: true
            }
        });

        console.log('\nComplaints by category:');
        categoryCounts.forEach(item => {
            console.log(`  ${item.category}: ${item._count.category} complaints`);
        });

        // Try to create a complaint without category (should fail)
        console.log('\n🧪 Testing required constraint...');
        try {
            await prisma.complaint.create({
                data: {
                    title: 'Test Complaint',
                    description: 'Test description',
                    location: 'Test location',
                    // category is missing - should fail
                }
            });
            console.log('❌ ERROR: Complaint created without category (constraint not working!)');
        } catch (error) {
            console.log('✅ Constraint working: Cannot create complaint without category');
            console.log(`   Error: ${error.message.split('\n')[0]}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchema();
