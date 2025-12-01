const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentMessage() {
    try {
        console.log('\n============================================================');
        console.log('🔍 Checking Most Recent Chat Message');
        console.log('============================================================\n');

        // Get the most recent message with an image
        const recentMessage = await prisma.complaintChatMessage.findFirst({
            where: {
                imageUrl: {
                    not: null
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                complaint: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        if (!recentMessage) {
            console.log('❌ No messages with images found');
            return;
        }

        console.log('📝 Message Details:');
        console.log('  ID:', recentMessage.id);
        console.log('  Complaint:', `#${recentMessage.complaint.id} - ${recentMessage.complaint.title}`);
        console.log('  Sender Type:', recentMessage.senderType);
        console.log('  Message:', recentMessage.message);
        console.log('  Created:', recentMessage.createdAt.toLocaleString());
        console.log('\n📷 Image URL Analysis:');
        console.log('  Full URL:', recentMessage.imageUrl);
        console.log('  URL Length:', recentMessage.imageUrl?.length || 0);
        console.log('  URL Type:',
            recentMessage.imageUrl?.startsWith('data:image/') ? '❌ Base64 Data URL' :
                recentMessage.imageUrl?.startsWith('http') ? '✅ HTTP URL' :
                    '❓ Unknown'
        );

        if (recentMessage.imageUrl?.startsWith('data:image/')) {
            console.log('  Base64 Preview:', recentMessage.imageUrl.substring(0, 100) + '...');
            console.log('\n⚠️  WARNING: This is a base64 data URL!');
            console.log('  Base64 images should be uploaded to Cloudinary instead.');
        } else if (recentMessage.imageUrl?.includes('cloudinary')) {
            console.log('  ✅ Cloudinary URL detected');
        }

        console.log('\n============================================================\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentMessage();
