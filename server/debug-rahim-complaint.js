const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRahimComplaint() {
    try {
        console.log('🔍 Debugging Rahim Ahmed\'s complaint...\n');

        // Find Rahim Ahmed
        const rahim = await prisma.user.findFirst({
            where: {
                OR: [
                    { firstName: { contains: 'Rahim' } },
                    { phone: '01712345678' }
                ]
            },
            include: {
                complaints: {
                    include: {
                        chatMessages: true
                    }
                }
            }
        });

        if (!rahim) {
            console.log('❌ Rahim Ahmed not found in database');
            return;
        }

        console.log('✅ Found user:');
        console.log(`   ID: ${rahim.id}`);
        console.log(`   Name: ${rahim.firstName} ${rahim.lastName}`);
        console.log(`   Phone: ${rahim.phone}`);
        console.log(`   Email: ${rahim.email}`);
        console.log(`   Role: ${rahim.role}`);

        console.log(`\n📋 Complaints (${rahim.complaints.length}):`);

        if (rahim.complaints.length === 0) {
            console.log('   No complaints found for this user');
        } else {
            rahim.complaints.forEach((complaint, index) => {
                console.log(`\n   ${index + 1}. Complaint ID: ${complaint.id}`);
                console.log(`      Title: ${complaint.title}`);
                console.log(`      Status: ${complaint.status}`);
                console.log(`      Created: ${complaint.createdAt}`);
                console.log(`      User ID: ${complaint.userId}`);
                console.log(`      Chat Messages: ${complaint.chatMessages.length}`);

                if (complaint.chatMessages.length > 0) {
                    console.log(`      Recent messages:`);
                    complaint.chatMessages.slice(-3).forEach((msg, msgIdx) => {
                        console.log(`         ${msgIdx + 1}. [${msg.senderType}] ${msg.message.substring(0, 50)}...`);
                    });
                }
            });
        }

        // Check if there are any complaints with chat messages that don't belong to Rahim
        console.log('\n🔍 Checking for complaints with chat messages...');
        const complaintsWithChat = await prisma.complaint.findMany({
            where: {
                chatMessages: {
                    some: {}
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true
                    }
                },
                chatMessages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        console.log(`\n📊 Total complaints with chat: ${complaintsWithChat.length}`);
        complaintsWithChat.forEach((complaint, index) => {
            console.log(`\n   ${index + 1}. Complaint ID: ${complaint.id}`);
            console.log(`      Title: ${complaint.title}`);
            console.log(`      Owner: ${complaint.user.firstName} ${complaint.user.lastName} (ID: ${complaint.user.id})`);
            console.log(`      Phone: ${complaint.user.phone}`);
            console.log(`      Last message: ${complaint.chatMessages[0]?.message.substring(0, 50)}...`);
        });

        await prisma.$disconnect();

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await prisma.$disconnect();
    }
}

debugRahimComplaint();
