
import fs from 'fs';
import path from 'path';

const inputPath = path.join(__dirname, 'pdf-output.txt');
const outputPath = path.join(__dirname, 'parsed-contacts.json');

interface ZoneData {
    zoneId: number;
    officerPhones: string[];
    wards: { [wardId: number]: string };
}

function parseText() {
    const text = fs.readFileSync(inputPath, 'utf8');
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const zones: ZoneData[] = [];
    let currentZone: ZoneData | null = null;
    let isParsingWards = false;

    // Pattern for Zone Header: AÂj-X or AÂj - X
    const zoneHeaderRegex = /AÂj\s*[-\s]\s*(\d+)/;

    // Pattern for Phone: 01xxxxxxxxx (11 digits) or with dashes e.g. 01709-946244
    const phoneRegex = /(01\d{3}[-]?\d{6})/g; // Captures simple 11 digit format
    // Better regex to Capture 01XXXX-XXXXXX or 01XXXXXXXXX
    const phoneRegexBetter = /(01\d{3,4}[-]?\d{6,})/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check Zone Header
        const zoneMatch = line.match(zoneHeaderRegex);
        if (zoneMatch) {
            const zoneNum = parseInt(zoneMatch[1]);
            if (!currentZone || currentZone.zoneId !== zoneNum) {
                currentZone = {
                    zoneId: zoneNum,
                    officerPhones: [],
                    wards: {}
                };
                zones.push(currentZone);
                isParsingWards = false;
                continue;
            }
        }

        if (!currentZone) continue;

        // Extract potential phone numbers in this line
        const phonesMatches = line.match(new RegExp(/(01\d{3,}[-]?\d{6,})/g));
        const phones = phonesMatches || [];

        // Check for Ward Header
        if (line.includes('IqvW© bs')) {
            isParsingWards = true;
            continue;
        }

        if (!isParsingWards && phones.length > 0) {
            phones.forEach(p => {
                if (!currentZone!.officerPhones.includes(p)) {
                    currentZone!.officerPhones.push(p);
                }
            });
        }

        if (isParsingWards) {
            // Check for Ward pattern: Start of line has digits (Serial) then WardNum
            // Regex: ^(\d+)[\.\s]+(\d+)
            const serialWardMatch = line.match(/^(\d+)[\.\s]+(\d+)/);
            if (serialWardMatch) {
                const wardNum = parseInt(serialWardMatch[2]);

                // If phone in same line
                if (phones.length > 0) {
                    currentZone.wards[wardNum] = phones[0];
                } else {
                    // Look ahead 1-2 lines
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1];
                        const nextPhones = nextLine.match(new RegExp(/(01\d{3,}[-]?\d{6,})/));
                        if (nextPhones) {
                            currentZone.wards[wardNum] = nextPhones[0];
                        } else if (i + 2 < lines.length) {
                            const nextNextLine = lines[i + 2];
                            const nnPhones = nextNextLine.match(new RegExp(/(01\d{3,}[-]?\d{6,})/));
                            if (nnPhones) {
                                currentZone.wards[wardNum] = nnPhones[0];
                            }
                        }
                    }
                }
            }
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(zones, null, 2));
    console.log("Written JSON to " + outputPath);
}

parseText();
