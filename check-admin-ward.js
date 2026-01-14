const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUsers() {
    try {
        console.log('🔍 Checking ADMIN users...\n');

        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                wardId: true,
                zoneId: true,
                cityCorporationCode: true,
                ward: {
                    select: {
                        id: true,
                        wardNumber: true,
                        inspectorName: true
                    }
                },
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true
                    }
                }
            }
        });

        if (adminUsers.length === 0) {
            console.log('❌ No ADMIN users found');
            return;
        }

        console.log(`✅ Found ${adminUsers.length} ADMIN user(s):\n`);

        adminUsers.forEach(user => {
            console.log(`👤 User ID: ${user.id}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Ward ID: ${user.wardId || '❌ NULL'}`);
            console.log(`   Zone ID: ${user.zoneId || '❌ NULL'}`);
            console.log(`   City Corp: ${user.cityCorporationCode || '❌ NULL'}`);

            if (user.ward) {
                console.log(`   ✅ Ward Details: Ward ${user.ward.wardNumber} (ID: ${user.ward.id})`);
            } else {
                console.log(`   ❌ No ward assigned`);
            }

            if (user.zone) {
                console.log(`   ✅ Zone Details: Zone ${user.zone.zoneNumber} - ${user.zone.name} (ID: ${user.zone.id})`);
            } else {
                console.log(`   ❌ No zone assigned`);
            }
            console.log('');
        });

        // Get available wards
        console.log('\n📋 Available Active Wards:\n');
        const wards = await prisma.ward.findMany({
            where: { status: 'ACTIVE' },
            select: {
                id: true,
                wardNumber: true,
                zoneId: true,
                inspectorName: true,
                zone: {
                    select: {
                        id: true,
                        zoneNumber: true,
                        name: true,
                        cityCorporationId: true
                    }
                }
            },
            orderBy: { wardNumber: 'asc' },
            take: 10
        });

        wards.forEach(ward => {
            console.log(`Ward ${ward.wardNumber} (ID: ${ward.id})`);
            console.log(`  Zone: ${ward.zone?.zoneNumber} - ${ward.zone?.name} (ID: ${ward.zoneId})`);
            console.log(`  Inspector: ${ward.inspectorName || 'N/A'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminUsers();
