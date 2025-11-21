const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCityCorporations() {
    console.log('🌱 Seeding City Corporations and Thanas...');

    try {
        // Create DSCC (Dhaka South City Corporation)
        const dscc = await prisma.cityCorporation.upsert({
            where: { code: 'DSCC' },
            update: {},
            create: {
                code: 'DSCC',
                name: 'Dhaka South City Corporation',
                minWard: 1,
                maxWard: 75,
                status: 'ACTIVE',
            },
        });
        console.log('✅ Created DSCC:', dscc);

        // Create DNCC (Dhaka North City Corporation)
        const dncc = await prisma.cityCorporation.upsert({
            where: { code: 'DNCC' },
            update: {},
            create: {
                code: 'DNCC',
                name: 'Dhaka North City Corporation',
                minWard: 1,
                maxWard: 54,
                status: 'ACTIVE',
            },
        });
        console.log('✅ Created DNCC:', dncc);

        // Create Thanas for DSCC
        const dsccThanas = [
            'Dhanmondi',
            'Hazaribagh',
            'Kalabagan',
            'Mohammadpur',
            'New Market',
            'Ramna',
            'Shahbagh',
            'Tejgaon',
            'Motijheel',
            'Paltan',
            'Sutrapur',
            'Kotwali',
            'Lalbagh',
            'Kamrangirchar',
            'Demra',
            'Jatrabari',
            'Sabujbagh',
            'Khilgaon',
            'Shyampur',
            'Kadamtali',
        ];

        for (const thanaName of dsccThanas) {
            const thana = await prisma.thana.upsert({
                where: {
                    name_cityCorporationId: {
                        name: thanaName,
                        cityCorporationId: dscc.id,
                    },
                },
                update: {},
                create: {
                    name: thanaName,
                    cityCorporationId: dscc.id,
                    status: 'ACTIVE',
                },
            });
            console.log(`  ✅ Created DSCC Thana: ${thana.name}`);
        }

        // Create Thanas for DNCC
        const dnccThanas = [
            'Gulshan',
            'Banani',
            'Baridhara',
            'Cantonment',
            'Kafrul',
            'Mirpur',
            'Pallabi',
            'Uttara',
            'Badda',
            'Vatara',
            'Mohakhali',
            'Tejgaon Industrial Area',
            'Sher-e-Bangla Nagar',
            'Adabor',
            'Turag',
            'Dakshinkhan',
            'Khilkhet',
            'Airport',
        ];

        for (const thanaName of dnccThanas) {
            const thana = await prisma.thana.upsert({
                where: {
                    name_cityCorporationId: {
                        name: thanaName,
                        cityCorporationId: dncc.id,
                    },
                },
                update: {},
                create: {
                    name: thanaName,
                    cityCorporationId: dncc.id,
                    status: 'ACTIVE',
                },
            });
            console.log(`  ✅ Created DNCC Thana: ${thana.name}`);
        }

        console.log('\n✅ City Corporations and Thanas seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedCityCorporations()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
