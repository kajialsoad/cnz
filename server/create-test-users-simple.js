/**
 * Simplified script to create 10 test users with different thanas
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
    console.log('Creating 10 test users with different thanas...\n');

    try {
        // Get DSCC and DNCC with thanas
        const dscc = await prisma.cityCorporation.findUnique({
            where: { code: 'DSCC' },
            include: { thanas: { where: { status: 'ACTIVE' } } }
        });

        const dncc = await prisma.cityCorporation.findUnique({
            where: { code: 'DNCC' },
            include: { thanas: { where: { status: 'ACTIVE' } } }
        });

        if (!dscc || !dncc) {
            throw new Error('DSCC or DNCC not found');
        }

        console.log(`Found ${dscc.thanas.length} thanas in DSCC`);
        console.log(`Found ${dncc.thanas.length} thanas in DNCC\n`);

        const hashedPassword = await bcrypt.hash('Test@123', 10);

        // Create 5 DSCC users
        for (let i = 0; i < 5 && i < dscc.thanas.length; i++) {
            const thana = dscc.thanas[i];
            const ward = Math.floor(Math.random() * (dscc.maxWard - dscc.minWard + 1)) + dscc.minWard;

            const user = await prisma.user.create({
                data: {
                    firstName: `DSCC User ${i + 1}`,
                    lastName: `${thana.name}`,
                    email: `dscc.user${i + 1}@test.com`,
                    phone: `01700${String(i + 1).padStart(6, '0')}`,
                    passwordHash: hashedPassword,
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: true,
                    cityCorporationCode: 'DSCC',
                    thanaId: thana.id,
                    ward: ward.toString(),
                    zone: String.fromCharCode(65 + (i % 5)),
                    address: `Test Address ${i + 1}, Ward ${ward}, ${thana.name}`,
                }
            });

            console.log(`✓ DSCC: ${user.email} - ${thana.name}, Ward ${ward}`);
        }

        // Create 5 DNCC users
        for (let i = 0; i < 5 && i < dncc.thanas.length; i++) {
            const thana = dncc.thanas[i];
            const ward = Math.floor(Math.random() * (dncc.maxWard - dncc.minWard + 1)) + dncc.minWard;

            const user = await prisma.user.create({
                data: {
                    firstName: `DNCC User ${i + 1}`,
                    lastName: `${thana.name}`,
                    email: `dncc.user${i + 1}@test.com`,
                    phone: `01800${String(i + 1).padStart(6, '0')}`,
                    passwordHash: hashedPassword,
                    role: 'CUSTOMER',
                    status: 'ACTIVE',
                    emailVerified: true,
                    phoneVerified: true,
                    cityCorporationCode: 'DNCC',
                    thanaId: thana.id,
                    ward: ward.toString(),
                    zone: String.fromCharCode(65 + (i % 5)),
                    address: `Test Address ${i + 1}, Ward ${ward}, ${thana.name}`,
                }
            });

            console.log(`✓ DNCC: ${user.email} - ${thana.name}, Ward ${ward}`);
        }

        console.log('\n✅ Successfully created 10 test users!');
        console.log('\nLogin credentials:');
        console.log('Emails: dscc.user1@test.com to dscc.user5@test.com');
        console.log('Emails: dncc.user1@test.com to dncc.user5@test.com');
        console.log('Password: Test@123');

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers();
