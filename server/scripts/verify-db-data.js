
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const outputPath = path.join(__dirname, 'verify-output.txt');

async function verify() {
    try {
        let output = "VERIFICATION RESULTS:\n";

        // Check Zones 1-10
        const zones = await prisma.zone.findMany({
            where: {
                cityCorporation: { code: 'DSCC' },
                zoneNumber: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }
            },
            orderBy: { zoneNumber: 'asc' },
            include: {
                wards: {
                    orderBy: { wardNumber: 'asc' }
                }
            }
        });

        output += `Found ${zones.length} matching Zones (1-10) in DSCC.\n`;

        zones.forEach(z => {
            output += `\nZone ${z.zoneNumber}:\n`;
            output += `  Officer Phone: ${z.officerPhone ? '✅ ' + z.officerPhone : '❌ MISSING'}\n`;

            const wardsWithPhone = z.wards.filter(w => w.inspectorPhone).length;
            output += `  Wards: ${wardsWithPhone}/${z.wards.length} have Inspector Phone.\n`;

            if (z.wards.length > 0) {
                z.wards.forEach(w => {
                    if (w.inspectorPhone) {
                        output += `    - Ward ${w.wardNumber}: ${w.inspectorPhone}\n`;
                    } else {
                        output += `    - Ward ${w.wardNumber}: ❌ MISSING\n`;
                    }
                });
            } else {
                output += `    (No wards found in this zone)\n`;
            }
        });

        fs.writeFileSync(outputPath, output);
        console.log("Verification written to " + outputPath);

    } catch (e) {
        console.error("Error verifying:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
