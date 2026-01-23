const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
    try {
        console.log('Searching for user with ID 445 or name containing "Pall"...\n');

        // Search by ID 445 (from screenshot)
        const userById = await prisma.user.findUnique({
            where: { id: 445 },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                role: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true,
                status: true,
                ward: { select: { id: true, wardNumber: true } },
                zone: { select: { id: true, name: true } }
            }
        });

        if (userById) {
            console.log('✅ Found user by ID 445:');
            console.log(JSON.stringify(userById, null, 2));
        } else {
            console.log('❌ No user found with ID 445');
        }

        // Also search by name
        console.log('\n\nSearching by name containing "Pall"...\n');
        const usersByName = await prisma.user.findMany({
            where: {
                role: 'CUSTOMER',
                OR: [
                    { firstName: { contains: 'Pall' } },
                    { firstName: { contains: 'pall' } },
                    { lastName: { contains: 'Roy' } },
                    { lastName: { contains: 'roy' } }
                ]
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                wardId: true,
                zoneId: true,
                status: true
            },
            take: 10
        });

        if (usersByName.length > 0) {
            console.log(`✅ Found ${usersByName.length} users:`);
            usersByName.forEach(u => {
                console.log(`  - ID: ${u.id}, Name: ${u.firstName} ${u.lastName}, Phone: ${u.phone}`);
            });
        } else {
            console.log('❌ No users found with name containing "Pall" or "Roy"');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findUser();
