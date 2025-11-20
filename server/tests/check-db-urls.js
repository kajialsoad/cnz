const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUrls() {
    const complaint = await prisma.complaint.findUnique({ where: { id: 11 } });
    console.log('imageUrl:', complaint.imageUrl);
    console.log('audioUrl:', complaint.audioUrl);
    await prisma.$disconnect();
}

checkUrls();
