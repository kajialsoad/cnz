const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({
    where: { thanaId: { not: null } },
    include: { cityCorporation: true, thana: true }
}).then(u => {
    console.log(JSON.stringify(u, null, 2));
    prisma.$disconnect();
});
