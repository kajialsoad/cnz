import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkComplaintImages() {
    try {
        console.log('=== Checking Complaint Images ===\n');

        // Get a few complaints with images
        const complaints = await prisma.complaint.findMany({
            where: {
                imageUrl: {
                    not: null
                }
            },
            take: 5,
            select: {
                id: true,
                title: true,
                imageUrl: true,
                audioUrl: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Found ${complaints.length} complaints with images:\n`);

        complaints.forEach((complaint, index) => {
            console.log(`${index + 1}. Complaint ID: ${complaint.id}`);
            console.log(`   Title: ${complaint.title}`);
            console.log(`   Image URL (raw): ${complaint.imageUrl}`);

            // Try to parse
            try {
                const parsed = JSON.parse(complaint.imageUrl);
                console.log(`   Parsed URLs:`, parsed);
            } catch (e) {
                console.log(`   Not JSON, treating as comma-separated`);
                const urls = complaint.imageUrl.split(',').map(u => u.trim());
                console.log(`   URLs:`, urls);
            }

            console.log('');
        });

        // Check if URLs are absolute or relative
        if (complaints.length > 0) {
            const firstImageUrl = complaints[0].imageUrl;
            console.log('\n=== URL Analysis ===');
            console.log('First image URL:', firstImageUrl);

            if (firstImageUrl.includes('http://') || firstImageUrl.includes('https://')) {
                console.log('✓ URLs are absolute (include protocol)');
            } else if (firstImageUrl.startsWith('/')) {
                console.log('⚠ URLs are relative (start with /)');
                console.log('  Need to prepend server URL');
            } else {
                console.log('⚠ URLs are relative (no leading /)');
                console.log('  Need to prepend server URL and /');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkComplaintImages();
