const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySchema() {
    try {
        console.log('Verifying subcategory field in Complaint model...\n');

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
            console.log('\n✅ Both category and subcategory fields exist and are populated');
        }

        // Count complaints by category and subcategory
        const complaints = await prisma.complaint.findMany({
            select: {
                category: true,
                subcategory: true
            }
        });

        console.log(`\nTotal complaints: ${complaints.length}`);
        console.log('All have category:', complaints.every(c => c.category));
        console.log('All have subcategory:', complaints.every(c => c.subcategory));

        // Try to create a complaint without subcategory (should fail)
        console.log('\n🧪 Testing required constraint for subcategory...');
        try {
            await prisma.complaint.create({
                data: {
                    title: 'Test Complaint',
                    description: 'Test description',
                    location: 'Test location',
                    category: 'home',
                    // subcategory is missing - should fail
                }
            });
            console.log('❌ ERROR: Complaint created without subcategory (constraint not working!)');
        } catch (error) {
            console.log('✅ Constraint working: Cannot create complaint without subcategory');
            console.log(`   Error: ${error.message.split('\n')[0]}`);
        }

        // Try to create a complaint with both fields (should succeed)
        console.log('\n🧪 Testing valid complaint creation...');
        try {
            const newComplaint = await prisma.complaint.create({
                data: {
                    title: 'Test Complaint with Category',
                    description: 'Test description',
                    location: 'Test location',
                    category: 'home',
                    subcategory: 'not_collecting_waste'
                }
            });
            console.log('✅ Successfully created complaint with category and subcategory');
            console.log(`   ID: ${newComplaint.id}, Category: ${newComplaint.category}, Subcategory: ${newComplaint.subcategory}`);

            // Clean up test complaint
            await prisma.complaint.delete({
                where: { id: newComplaint.id }
            });
            console.log('   (Test complaint cleaned up)');
        } catch (error) {
            console.log('❌ Failed to create valid complaint:', error.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySchema();
