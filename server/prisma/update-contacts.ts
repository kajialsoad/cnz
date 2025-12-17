
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

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

        console.log(`Processing ${zonesData.length} zones...`);

        // Find DSCC ID (Assuming it exists, or find by code/name)
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
        console.log("Found City Corporation:", cityCorp.name);

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
                    console.log(`Updated Zone ${zoneId} officer phone: ${phone}`);
                }

                // Update Wards
                for (const [wardNumStr, ph] of Object.entries(wards)) {
                    const wardNum = parseInt(wardNumStr);
                    const ward = await prisma.ward.findFirst({
                        where: {
                            wardNumber: wardNum,
                            zoneId: zone.id
                        }
                    });

                    if (ward) {
                        await prisma.ward.update({
                            where: { id: ward.id },
                            data: { inspectorPhone: ph as string }
                        });
                        console.log(`  Updated Ward ${wardNum} inspector phone: ${ph}`);
                    } else {
                        console.warn(`  Ward ${wardNum} not found in Zone ${zoneId}`);
                    }
                }
            } else {
                console.warn(`Zone ${zoneId} not found in DSCC`);
            }
        }

    } catch (e) {
        console.error("Error updating contacts:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
