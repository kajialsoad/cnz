const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: ['ADMIN', 'SUPER_ADMIN']
                }
            },
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                emailVerified: true,
            }
        });

        console.log('Admin users found:', JSON.stringify(users, null, 2));

        if (users.length === 0) {
            console.log('\n⚠️  No admin users found in database!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUsers();
