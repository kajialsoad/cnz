const { PrismaClient } = require('./server/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function assignWardToAdmin() {
    try {
        console.log('🔍 Finding wards in Zone 10 (ID: 34)...\n');

        // Find wards in Zone 10
        const wardsInZone10 = await prisma.ward.findMany({
            where: {
                zoneId: 34,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                wardNumber: true,
                inspectorName: true,
                zoneId: true
            },
            orderBy: { wardNumber: 'asc' }
        });

        if (wardsInZone10.length === 0) {
            console.log('❌ No active wards found in Zone 10');
            return;
        }

        console.log(`✅ Found ${wardsInZone10.length} ward(s) in Zone 10:\n`);
        wardsInZone10.forEach(ward => {
            console.log(`  Ward ${ward.wardNumber} (ID: ${ward.id}) - Inspector: ${ward.inspectorName || 'N/A'}`);
        });

        // Use the first ward
        const selectedWard = wardsInZone10[0];
        console.log(`\n🎯 Assigning Ward ${selectedWard.wardNumber} (ID: ${selectedWard.id}) to ADMIN user (ID: 421)...\n`);

        // Update the ADMIN user
        const updatedUser = await prisma.user.update({
            where: { id: 421 },
            data: {
                wardId: selectedWard.id
            },
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
                }
            }
        });

        console.log('✅ ADMIN user updated successfully!\n');
        console.log('Updated User Details:');
        console.log(`  User ID: ${updatedUser.id}`);
        console.log(`  Name: ${updatedUser.firstName} ${updatedUser.lastName}`);
        console.log(`  Email: ${updatedUser.email}`);
        console.log(`  Role: ${updatedUser.role}`);
        console.log(`  Ward ID: ${updatedUser.wardId}`);
        console.log(`  Ward Number: ${updatedUser.ward?.wardNumber}`);
        console.log(`  Zone ID: ${updatedUser.zoneId}`);
        console.log(`  City Corp: ${updatedUser.cityCorporationCode}`);
        console.log('\n✅ Ward assignment complete!');
        console.log('\n📝 Next Steps:');
        console.log('  1. Refresh the admin panel in your browser');
        console.log('  2. The ward dropdown should now show the assigned ward');
        console.log('  3. Only complaints from this ward will be visible');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignWardToAdmin();
