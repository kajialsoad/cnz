import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log('Testing database connection...');

    // Find user by phone
    const user = await prisma.user.findUnique({
        where: { phone: '01712345678' }
    });

    console.log('User found:', JSON.stringify(user, null, 2));

    await prisma.$disconnect();
}

test().catch(console.error);
