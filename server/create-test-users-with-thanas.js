/**
 * Script to create 10 test users with different thanas in DSCC and DNCC
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
    console.log('Creating 10 test users with different thanas...\n');

    try {
        // Get DSCC and DNCC city corporations
        const dscc = await prisma.cityCorporation.findUnique({
            where: { code: 'DSCC' },
            include: { thanas: true }
        });

        const dncc = await prisma.cityCorporation.findUnique({
            where: { code: 'DNCC' },
            include: { thanas: true }
        });

        if (!dscc || !dncc) {
            throw new Error('DSCC or DNCC not found in database');
        }

        console.log(`Found ${dscc.thanas.length} thanas in DSCC`);
        console.log(`Found ${dncc.thanas.length} thanas in DNCC\n`);

        // Hash password for all test users
        const hashedPassword = await bcrypt.hash('Test@123', 10);

        // Create 5 users in DSCC with different thanas
        const dsccUsers = [];
        for (let i = 0; i < 5 && i < dscc.thanas.length; i++) {
            const thana = dscc.thanas[i];
            const ward = Math.floor(Math.random() * (dscc.maxWard - dscc.minWard + 1)) + dscc.minWard;

            const user = await prisma.user.create({
                data: {
                    firstName: `DSCC User ${i + 1}`,
                    lastName: `Thana ${thana.name}`,
                    email: `dscc.user${i + 1}@test.com`,
                    phone: `01700${String(i + 1).padStart(6, '0')}`,
                    passwordHash: hashedPassword,
                    role: 'CUSTOMER',
                    isActive: true,
                    isEmailVerified: true,
                    cityCorporationCode: 'DSCC',
                    thanaId: thana.id,
                    ward: ward.toString(),
                    zone: String.fromCharCode(65 + (i % 5)), // A, B, C, D, E
                    address: `Test Address ${i + 1}, Ward ${ward}, ${thana.name}`,
                }
            });

            dsccUsers.push(user);
            console.log(`✓ Created DSCC user: ${user.email} - Thana: ${thana.name}, Ward: ${ward}`);
        }

        // Create 5 users in DNCC with different thanas
        const dnccUsers = [];
        for (let i = 0; i < 5 && i < dncc.thanas.length; i++) {
            const thana = dncc.thanas[i];
            const ward = Math.floor(Math.random() * (dncc.maxWard - dncc.minWard + 1)) + dncc.minWard;

            const user = await prisma.user.create({
                data: {
                    firstName: `DNCC User ${i + 1}`,
                    lastName: `Thana ${thana.name}`,
                    email: `dncc.user${i + 1}@test.com`,
                    phone: `01800${String(i + 1).padStart(6, '0')}`,
                    passwordHash: hashedPassword,
                    role: 'CUSTOMER',
                    isActive: true,
                    isEmailVerified: true,
                    cityCorporationCode: 'DNCC',
                    thanaId: thana.id,
                    ward: ward.toString(),
                    zone: String.fromCharCode(65 + (i % 5)), // A, B, C, D, E
                    address: `Test Address ${i + 1}, Ward ${ward}, ${thana.name}`,
                }
            });

            dnccUsers.push(user);
            console.log(`✓ Created DNCC user: ${user.email} - Thana: ${thana.name}, Ward: ${ward}`);
        }

        console.log('\n✅ Successfully created 10 test users!');
        console.log('\nTest user credentials:');
        console.log('Email: dscc.user1@test.com to dscc.user5@test.com');
        console.log('Email: dncc.user1@test.com to dncc.user5@test.com');
        console.log('Password: Test@123');

        // Create some test complaints for these users
        console.log('\n\nCreating test complaints for users...');

        const allUsers = [...dsccUsers, ...dnccUsers];
        const categories = ['home', 'road_environment', 'business', 'office'];
        const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

        for (let i = 0; i < allUsers.length; i++) {
            const user = allUsers[i];
            const category = categories[i % categories.length];
            const status = statuses[i % statuses.length];

            const complaint = await prisma.complaint.create({
                data: {
                    userId: user.id,
                    title: `Test complaint from ${user.firstName} ${user.lastName}`,
                    description: `This is a test complaint from ${user.cityCorporationCode} - ${user.thana?.name || 'Unknown Thana'}`,
                    location: `${user.address}, Ward: ${user.ward}, Zone: ${user.zone}`,
                    category: category,
                    subcategory: 'general',
                    status: status,
                    priority: 'MEDIUM',
                }
            });

            console.log(`✓ Created complaint C${String(complaint.id).padStart(6, '0')} for ${user.email}`);
        }

        console.log('\n✅ Test data creation complete!');

    } catch (error) {
        console.error('Error creating test users:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestUsers();
