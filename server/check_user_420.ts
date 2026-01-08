
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUser() {
    const user = await prisma.user.findUnique({
        where: { id: 420 },
        select: { id: true, email: true, passwordHash: true, visiblePassword: true }
    });
    console.log('User 420:', user);
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
