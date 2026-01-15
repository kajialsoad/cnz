
import { PrismaClient } from '@prisma/client'

async function main() {
    console.log('--- Final Verification ---');
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));

    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log('✅ SUCCESS: Connected to database!');
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('Query result:', result);
    } catch (e) {
        console.log('❌ FAILED:', (e as any).message || e);
        console.log('Error code:', (e as any).errorCode);
    } finally {
        await prisma.$disconnect();
    }
}

main()
