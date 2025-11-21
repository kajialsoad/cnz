const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getAdminPhone() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                phone: true,
                email: true,
                role: true
            }
        });

        console.log(JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getAdminPhone();
