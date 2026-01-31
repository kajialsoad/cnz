const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to normalize date - convert from UTC to local date, then back to UTC
// This ensures the DATE stays the same regardless of timezone
function normalizeEventDate(date) {
    const d = new Date(date);
    // Get the UTC date components
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    // Create a new date in local timezone with these components
    const localDate = new Date(year, month, day);

    // Convert back to UTC with the local date components
    return new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0));
}

async function fixCalendarEventDates() {
    try {
        console.log('🔧 Fixing Calendar Event Dates...\n');

        // Get all events
        const events = await prisma.calendarEvent.findMany({
            orderBy: { eventDate: 'asc' },
        });

        console.log(`📌 Found ${events.length} events to fix\n`);

        if (events.length === 0) {
            console.log('✅ No events to fix!');
            return;
        }

        let fixed = 0;
        let skipped = 0;

        for (const event of events) {
            const originalDate = new Date(event.eventDate);
            const normalizedDate = normalizeEventDate(event.eventDate);

            console.log(`\nEvent: ${event.title}`);
            console.log(`  Original: ${originalDate.toISOString()}`);
            console.log(`  Normalized: ${normalizedDate.toISOString()}`);

            // Check if dates are different
            if (originalDate.getTime() !== normalizedDate.getTime()) {
                await prisma.calendarEvent.update({
                    where: { id: event.id },
                    data: { eventDate: normalizedDate },
                });
                console.log(`  ✅ Fixed!`);
                fixed++;
            } else {
                console.log(`  ⏭️  Already correct`);
                skipped++;
            }
        }

        console.log(`\n\n📊 Summary:`);
        console.log(`   Fixed: ${fixed}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${events.length}`);
        console.log(`\n✅ Calendar event dates fixed successfully!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCalendarEventDates();
