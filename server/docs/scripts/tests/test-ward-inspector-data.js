/**
 * Test script to check ward inspector data in the database
 * 
 * This script will:
 * 1. Connect to the database
 * 2. Fetch all wards
 * 3. Show which wards have inspector information
 * 4. Show which wards are missing inspector information
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWardInspectorData() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Checking Ward Inspector Data in Database');
    console.log('='.repeat(60) + '\n');

    try {
        // Fetch all wards
        const wards = await prisma.ward.findMany({
            include: {
                zone: {
                    select: {
                        zoneNumber: true,
                        cityCorporation: {
                            select: {
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { wardNumber: 'asc' }
            ],
            take: 50 // Limit to first 50 for readability
        });

        console.log(`📊 Total Wards Found (showing first 50): ${wards.length}\n`);

        // Categorize wards
        const wardsWithInspectors = wards.filter(w => w.inspectorName || w.inspectorSerialNumber);
        const wardsWithoutInspectors = wards.filter(w => !w.inspectorName && !w.inspectorSerialNumber);

        console.log('✅ Wards WITH Inspector Information:');
        console.log('='.repeat(60));
        if (wardsWithInspectors.length === 0) {
            console.log('   ❌ No wards have inspector information assigned\n');
        } else {
            wardsWithInspectors.slice(0, 10).forEach(ward => {
                console.log(`   Ward ${ward.wardNumber} (Zone ${ward.zone.zoneNumber})`);
                console.log(`   City: ${ward.zone.cityCorporation.name}`);
                console.log(`   Inspector Name: ${ward.inspectorName || 'N/A'}`);
                console.log(`   Inspector Serial: ${ward.inspectorSerialNumber || 'N/A'}`);
                console.log(`   Status: ${ward.status}`);
                console.log('   ' + '-'.repeat(50));
            });
            console.log(`   Total: ${wardsWithInspectors.length} wards\n`);
        }

        console.log('❌ Wards WITHOUT Inspector Information (first 10):');
        console.log('='.repeat(60));
        if (wardsWithoutInspectors.length === 0) {
            console.log('   ✅ All wards have inspector information assigned\n');
        } else {
            wardsWithoutInspectors.slice(0, 10).forEach(ward => {
                console.log(`   Ward ${ward.wardNumber} (Zone ${ward.zone.zoneNumber}) - ${ward.zone.cityCorporation.name} - Status: ${ward.status}`);
            });
            console.log(`\n   Total: ${wardsWithoutInspectors.length} wards without inspectors\n`);
        }

        // Summary
        console.log('='.repeat(60));
        console.log('📈 Summary:');
        console.log('='.repeat(60));
        console.log(`   Total Wards Checked: ${wards.length}`);
        console.log(`   With Inspectors: ${wardsWithInspectors.length} (${((wardsWithInspectors.length / wards.length) * 100).toFixed(1)}%)`);
        console.log(`   Without Inspectors: ${wardsWithoutInspectors.length} (${((wardsWithoutInspectors.length / wards.length) * 100).toFixed(1)}%)`);
        console.log('='.repeat(60) + '\n');

        // Recommendations
        console.log('💡 Recommendations:');
        console.log('='.repeat(60));
        if (wardsWithoutInspectors.length > 0) {
            console.log('   1. Use the admin panel to assign inspectors to wards');
            console.log('   2. Navigate to: City Corporation Management > Select City > Select Zone');
            console.log('   3. Click Edit button next to each ward');
            console.log('   4. Fill in Inspector Name and Inspector Serial Number');
            console.log('   5. Click "Update Ward" to save');
            console.log('\n   The UI will show "Not Assigned" chips until you add this data.');
        } else {
            console.log('   ✅ All wards have inspector information assigned!');
        }
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error checking ward data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the check
checkWardInspectorData();
