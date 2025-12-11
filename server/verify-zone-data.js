/**
 * Verify Zone Data Structure
 * Checks if all DSCC zones and wards are properly defined in migration script
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying DSCC Zone Data Structure...\n');

// Read the migration script
const migrationScript = fs.readFileSync(
    path.join(__dirname, 'migrate-thana-to-zone-ward.js'),
    'utf8'
);

// Extract ZONE_DATA
const zoneDataMatch = migrationScript.match(/const ZONE_DATA = ({[\s\S]*?});/);

if (!zoneDataMatch) {
    console.error('❌ Could not find ZONE_DATA in migration script');
    process.exit(1);
}

// Parse the zone data (simplified parsing)
const dsccZones = [];
const zoneMatches = migrationScript.matchAll(/zoneNumber: (\d+),[\s\S]*?name: '([^']+)',[\s\S]*?officerName: '([^']+)',[\s\S]*?wards: \[([\s\S]*?)\]/g);

for (const match of zoneMatches) {
    const zoneNumber = parseInt(match[1]);
    const name = match[2];
    const officerName = match[3];
    const wardsSection = match[4];

    // Count wards
    const wardMatches = wardsSection.match(/wardNumber:/g);
    const wardCount = wardMatches ? wardMatches.length : 0;

    dsccZones.push({
        zoneNumber,
        name,
        officerName,
        wardCount
    });
}

console.log('📊 DSCC Zone Summary:\n');
console.log('═'.repeat(80));

let totalWards = 0;
dsccZones.forEach(zone => {
    console.log(`Zone ${zone.zoneNumber}: ${zone.name}`);
    console.log(`  Officer: ${zone.officerName}`);
    console.log(`  Wards: ${zone.wardCount}`);
    console.log('─'.repeat(80));
    totalWards += zone.wardCount;
});

console.log('═'.repeat(80));
console.log(`\n✅ Total Zones: ${dsccZones.length}`);
console.log(`✅ Total Wards: ${totalWards}`);

// Verify expected structure
const expectedZones = 10;
const expectedMinWards = 60; // Approximate

if (dsccZones.length === expectedZones) {
    console.log(`\n✅ Zone count matches expected (${expectedZones})`);
} else {
    console.log(`\n⚠️  Zone count mismatch. Expected: ${expectedZones}, Found: ${dsccZones.length}`);
}

if (totalWards >= expectedMinWards) {
    console.log(`✅ Ward count looks good (${totalWards} wards)`);
} else {
    console.log(`⚠️  Ward count seems low. Expected at least ${expectedMinWards}, Found: ${totalWards}`);
}

console.log('\n🎉 Zone data structure verification complete!');
