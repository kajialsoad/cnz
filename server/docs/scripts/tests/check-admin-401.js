const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
    const admin = await prisma.user.findUnique({
        where: { id: 401 },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            wardId: true,
            zoneId: true,
            permissions: true
        }
    });

    console.log('Admin 401 (Md Rayhan Chowdhury):');
    console.log(JSON.stringify(admin, null, 2));

    await prisma.$disconnect();
}

checkAdmin();
