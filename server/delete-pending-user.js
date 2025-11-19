const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deletePendingUser() {
    const phone = '01639038994'; // Change this to your phone number

    try {
        console.log(`Looking for user with phone: ${phone}...`);

        const user = await prisma.user.findUnique({
            where: { phone }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found:', {
            id: user.id,
            phone: user.phone,
            email: user.email,
            status: user.status,
            emailVerified: user.emailVerified
        });

        // Delete the user
        await prisma.user.delete({
            where: { phone }
        });

        console.log('✅ User deleted successfully!');
        console.log('Now you can signup again with the same phone number');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

deletePendingUser();
