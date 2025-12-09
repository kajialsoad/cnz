const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRole() {
    const user = await prisma.user.findUnique({
        where: { email: 'master01@cc.app' }
    });
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Status:', user.status);
    await prisma.$disconnect();
}

checkRole();
