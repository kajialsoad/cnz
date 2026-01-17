"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function main() {
    console.log('--- Final Verification ---');
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
    const prisma = new client_1.PrismaClient();
    try {
        await prisma.$connect();
        console.log('✅ SUCCESS: Connected to database!');
        const result = await prisma.$queryRaw `SELECT 1 as result`;
        console.log('Query result:', result);
    }
    catch (e) {
        console.log('❌ FAILED:', e.message || e);
        console.log('Error code:', e.errorCode);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
