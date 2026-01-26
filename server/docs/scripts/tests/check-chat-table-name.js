const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTableName() {
    try {
        // Try to query the table
        const result = await prisma.$queryRaw`SHOW TABLES LIKE 'ChatMessage'`;
        console.log('ChatMessage table:', result);

        const result2 = await prisma.$queryRaw`SHOW TABLES LIKE 'chat_messages'`;
        console.log('chat_messages table:', result2);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTableName();
