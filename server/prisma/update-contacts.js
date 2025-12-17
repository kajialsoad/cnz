
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const jsonPath = path.join(__dirname, '../scripts/parsed-contacts.json');

async function main() {
    try {
        if (!fs.existsSync(jsonPath)) {
            console.error("JSON file not found:", jsonPath);
            return;
        }

        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const zonesData = JSON.parse(rawData);

        console.log(`Processing ${zonesData.length} zones from parsed data...`);

        // Find DSCC City Corporation
        const cityCorp = await prisma.cityCorporation.findFirst({
            where: {
                OR: [
                    { code: 'DSCC' },
                    { name: { contains: 'Dhaka South' } }
                ]
            }
        });

        if (!cityCorp) {
            console.error("DSCC City Corporation not found!");
            return;
        }
        console.log("Found City Corporation:", cityCorp.name, "(Total Zones in DB: " + (await prisma.zone.count({ where: { cityCorporationId: cityCorp.id } })) + ")");

        for (const zData of zonesData) {
            const { zoneId, officerPhones, wards } = zData;

            // Find Zone
            const zone = await prisma.zone.findFirst({
                where: {
                    zoneNumber: zoneId,
                    cityCorporationId: cityCorp.id
                }
            });

            if (zone) {
                // Update Officer Phone
                const phone = officerPhones.length > 0 ? officerPhones[0] : null;
                if (phone) {
                    await prisma.zone.update({
                        where: { id: zone.id },
                        data: { officerPhone: phone }
                    });
                    console.log(`Zone ${zoneId}: Updated Officer Phone to ${phone}`);
                } else {
                    console.log(`Zone ${zoneId}: No officer phone in PDF.`);
                }

                // Update Wards
                const wardKeys = Object.keys(wards);
                if (wardKeys.length > 0) {
                    console.log(`  Processing ${wardKeys.length} wards for Zone ${zoneId}...`);
                }

                for (const wardNumStr of wardKeys) {
                    const wardNum = parseInt(wardNumStr);
                    const ph = wards[wardNumStr];

                    const ward = await prisma.ward.findFirst({
                        where: {
                            wardNumber: wardNum,
                            zoneId: zone.id
                        }
                    });

                    if (ward) {
                        await prisma.ward.update({
                            where: { id: ward.id },
                            data: { inspectorPhone: ph }
                        });
                        console.log(`    Ward ${wardNum}: Updated Inspector Phone to ${ph}`);
                    } else {
                        console.warn(`    Ward ${wardNum} not found in Zone ${zoneId} (DB Zone ID: ${zone.id})`);
                        // Maybe check if it exists in another zone of same City Corp?
                        const existingWard = await prisma.ward.findFirst({
                            where: {
                                wardNumber: wardNum,
                                cityCorporationId: cityCorp.id
                            },
                            include: { zone: true }
                        });
                        if (existingWard) {
                            console.warn(`      Ward ${wardNum} actually belongs to Zone ${existingWard.zone.zoneNumber} in DB.`);
                            // Optional: Update it anyway? No, stick to structure.
                        }
                    }
                }
            } else {
                console.warn(`Zone ${zoneId} not found in DSCC database.`);
            }
        }

    } catch (e) {
        console.error("Error updating contacts:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
