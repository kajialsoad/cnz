/**
 * Check users with city corporation data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: 'CUSTOMER',
                status: 'ACTIVE'
            },
            include: {
                cityCorporation: true,
                thana: true
            },
            take: 5
        });

        console.log('Users with city corporation data:');
        console.log(JSON.stringify(users.map(u => ({
            id: u.id,
            phone: u.phone,
            firstName: u.firstName,
            lastName: u.lastName,
            cityCorporation: u.cityCorporation?.name,
            thana: u.thana?.name,
            ward: u.ward
        })), null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
