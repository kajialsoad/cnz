/**
 * Data Migration Script: Thana to Zone-Ward Structure
 * 
 * This script migrates existing Thana data to the new Zone-Ward hierarchy for DSCC.
 * It should be run AFTER the database schema migration.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Complete DSCC Zone data with all 10 zones
const ZONE_DATA = {
    'DSCC': [
        {
            zoneNumber: 1,
            name: 'অঞ্চল-১',
            officerName: 'মোঃ শফিকুল ইসলাম',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০১',
            wards: [
                { wardNumber: 15, inspectorName: 'মোহাম্মদ আরিফ আহমেদ', inspectorSerialNumber: '১' },
                { wardNumber: 16, inspectorName: 'রাজীব মিয়া', inspectorSerialNumber: '২' },
                { wardNumber: 17, inspectorName: 'মহিদুল ইসলাম', inspectorSerialNumber: '৩' },
                { wardNumber: 18, inspectorName: 'ফরহাদ ইবনে আলী', inspectorSerialNumber: '৪' },
                { wardNumber: 19, inspectorName: 'মোঃ হানিফ উদ্দিন', inspectorSerialNumber: '৫' },
                { wardNumber: 20, inspectorName: 'সুশান্ত কুমার রায়', inspectorSerialNumber: '৬' },
                { wardNumber: 21, inspectorName: 'মেহেদী হাসান শাওন', inspectorSerialNumber: '৭' }
            ]
        },
        {
            zoneNumber: 2,
            name: 'অঞ্চল-২',
            officerName: 'মোঃ আবু তাহের',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০২',
            wards: [
                { wardNumber: 1, inspectorName: 'সজিব চৌধুরী', inspectorSerialNumber: '১' },
                { wardNumber: 2, inspectorName: 'মোঃ মোয়াজ্জেম হোসেন', inspectorSerialNumber: '২' },
                { wardNumber: 3, inspectorName: 'মো: মুসা আলী সাদ', inspectorSerialNumber: '৩' },
                { wardNumber: 4, inspectorName: 'মোঃ শাখাওয়াৎ হোসেন মোল্লা', inspectorSerialNumber: '৪' },
                { wardNumber: 5, inspectorName: 'মোঃ সালমান মোল্লা', inspectorSerialNumber: '৫' },
                { wardNumber: 6, inspectorName: 'সাদমান সাকিব', inspectorSerialNumber: '৬' },
                { wardNumber: 7, inspectorName: 'আসিফ হোসেন (রানা)', inspectorSerialNumber: '৭' },
                { wardNumber: 8, inspectorName: 'মো: আতিকুল ইসলাম', inspectorSerialNumber: '৮' },
                { wardNumber: 9, inspectorName: 'মোঃ রেজাউল করিম', inspectorSerialNumber: '৯' },
                { wardNumber: 10, inspectorName: 'মুহাম্মাদ সাদ', inspectorSerialNumber: '১০' },
                { wardNumber: 11, inspectorName: 'মোঃ আতিকুল্লাহ', inspectorSerialNumber: '১১' },
                { wardNumber: 12, inspectorName: 'মোঃ আশাদুল মিয়া', inspectorSerialNumber: '১২' }
            ]
        },
        {
            zoneNumber: 3,
            name: 'অঞ্চল-৩',
            officerName: 'মু: সেলিম মিয়া',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০৩',
            wards: [
                { wardNumber: 22, inspectorName: 'মোঃ মজিবর খান', inspectorSerialNumber: '১' },
                { wardNumber: 23, inspectorName: 'মোঃ বাছা উদ্দিন', inspectorSerialNumber: '২' },
                { wardNumber: 24, inspectorName: 'মোঃ ওয়াহিদুজ্জামান চৌধুরী', inspectorSerialNumber: '৩' },
                { wardNumber: 25, inspectorName: 'রফিকুল ইসলাম চৌধুরী', inspectorSerialNumber: '৪' },
                { wardNumber: 26, inspectorName: 'মো: সিয়াম', inspectorSerialNumber: '৫' },
                { wardNumber: 27, inspectorName: 'মো: ফিরোজ আলম', inspectorSerialNumber: '৬' },
                { wardNumber: 28, inspectorName: 'মো: শাহাদাত হোসেন আল আমিন', inspectorSerialNumber: '৮' },
                { wardNumber: 29, inspectorName: 'মো: নুরুল আমিন', inspectorSerialNumber: '৭' },
                { wardNumber: 30, inspectorName: 'সাদ্দাম হোসেন', inspectorSerialNumber: '৯' },
                { wardNumber: 33, inspectorName: 'রফিকুল ইসলাম চৌধুরী', inspectorSerialNumber: '১০' },
                { wardNumber: 34, inspectorName: 'মোঃ মইনুদ্দীন আহমেদ', inspectorSerialNumber: '১১' },
                { wardNumber: 37, inspectorName: 'মোঃ মেজবাহ উদ্দিন', inspectorSerialNumber: '১২' }
            ]
        },
        {
            zoneNumber: 4,
            name: 'অঞ্চল-৪',
            officerName: 'মোঃ রাসেদুল রহমান রাসেল',
            officerDesignation: 'পরিচ্ছন্ন কর্মকর্তা (চঃ দাঃ)',
            officerSerialNumber: '০৪',
            wards: [
                { wardNumber: 31, inspectorName: 'মো: মহসিন হোসেন', inspectorSerialNumber: '১' },
                { wardNumber: 32, inspectorName: 'সাব্বির রশীদ খান', inspectorSerialNumber: '২' },
                { wardNumber: 33, inspectorName: 'সাব্বির হোসেন', inspectorSerialNumber: '৩' },
                { wardNumber: 34, inspectorName: 'সাব্বির রশীদ খান', inspectorSerialNumber: '৪' },
                { wardNumber: 35, inspectorName: 'মো: মুরাদ হোসেন', inspectorSerialNumber: '৫' },
                { wardNumber: 36, inspectorName: 'মো: রিয়াজাত হোসেন রিসাদ', inspectorSerialNumber: '৬' },
                { wardNumber: 37, inspectorName: 'আশরাফ উজ-জামান', inspectorSerialNumber: '৭' },
                { wardNumber: 38, inspectorName: 'মুনেম এহসান', inspectorSerialNumber: '৮' },
                { wardNumber: 39, inspectorName: 'মো: রাসেদুল রহমান রাসেল (চঃ দাঃ)', inspectorSerialNumber: '৯' },
                { wardNumber: 42, inspectorName: 'দীপরাজ মজুমদার', inspectorSerialNumber: '১০' },
                { wardNumber: 43, inspectorName: 'খন্দকার আব্দুল হান্নান', inspectorSerialNumber: '১১' }
            ]
        },
        {
            zoneNumber: 5,
            name: 'অঞ্চল-৫',
            officerName: 'মু: সেলিম মিয়া',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:) (মৌখিক)',
            officerSerialNumber: '০৫',
            wards: [
                { wardNumber: 37, inspectorName: 'মেহেদী হাসান', inspectorSerialNumber: '১' },
                { wardNumber: 38, inspectorName: 'মো: সুজন আহমেদ', inspectorSerialNumber: '২' },
                { wardNumber: 40, inspectorName: 'মো: রাকিবুল', inspectorSerialNumber: '৩' },
                { wardNumber: 41, inspectorName: 'মো: মাসুম ভূইয়া', inspectorSerialNumber: '৪' },
                { wardNumber: 44, inspectorName: 'হাফিজ আহমেদ', inspectorSerialNumber: '৫' },
                { wardNumber: 45, inspectorName: 'মোহাম্মদ শাহজাহান', inspectorSerialNumber: '৬' },
                { wardNumber: 46, inspectorName: 'মো: সাজ্জাদ হোসেন সিকদার', inspectorSerialNumber: '৭' },
                { wardNumber: 47, inspectorName: 'সাগর হোসেন', inspectorSerialNumber: '৮' },
                { wardNumber: 48, inspectorName: 'মো: আব্দুল্লাহ আল রাফিফ', inspectorSerialNumber: '৯' },
                { wardNumber: 49, inspectorName: 'শফিকুল ইসলাম', inspectorSerialNumber: '১০' },
                { wardNumber: 50, inspectorName: 'পঙ্কজ কুমার বর্মণ', inspectorSerialNumber: '১১' },
                { wardNumber: 51, inspectorName: 'মীর মো: এনামুল হাসান', inspectorSerialNumber: '১২' },
                { wardNumber: 52, inspectorName: 'মোঃ মাহমুদুল রহমান ভূইয়া', inspectorSerialNumber: '১৩' },
                { wardNumber: 53, inspectorName: 'মোঃ মাহমুদুল রহমান ভূইয়া', inspectorSerialNumber: '১৪' },
                { wardNumber: 54, inspectorName: 'মো: শাহ আলী', inspectorSerialNumber: '১৫' }
            ]
        },
        {
            zoneNumber: 6,
            name: 'অঞ্চল-৬',
            officerName: 'আব্দুল মোতালিব',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০৬',
            wards: [
                { wardNumber: 70, inspectorName: 'মো: রাহান চৌধুরী', inspectorSerialNumber: '১' },
                { wardNumber: 74, inspectorName: 'মো: রাসেল হাওলাদার', inspectorSerialNumber: '২' },
                { wardNumber: 78, inspectorName: 'মোঃ রেজিকুলজ্জামান', inspectorSerialNumber: '৩' }
            ]
        },
        {
            zoneNumber: 7,
            name: 'অঞ্চল-৭',
            officerName: 'বিকাশ চন্দ্র দাস',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০৭',
            wards: [
                { wardNumber: 76, inspectorName: 'মো: শাহীন কামাল', inspectorSerialNumber: '১' },
                { wardNumber: 77, inspectorName: 'রিয়াজউদ্দিন রেজা', inspectorSerialNumber: '২' },
                { wardNumber: 80, inspectorName: 'রিয়াজউদ্দিন রেজা', inspectorSerialNumber: '৩' }
            ]
        },
        {
            zoneNumber: 8,
            name: 'অঞ্চল-৮',
            officerName: 'বিকাশ চন্দ্র দাস',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০৮',
            wards: [
                { wardNumber: 66, inspectorName: 'মো: ওয়াজেদ ইসলাম', inspectorSerialNumber: '১' },
                { wardNumber: 67, inspectorName: 'রাশেদ খান মিঠুন', inspectorSerialNumber: '২' },
                { wardNumber: 68, inspectorName: 'মো: তানভীর হোসেন', inspectorSerialNumber: '৪' },
                { wardNumber: 69, inspectorName: 'মো: রেজাউল হাসান', inspectorSerialNumber: '৩' }
            ]
        },
        {
            zoneNumber: 9,
            name: 'অঞ্চল-৯',
            officerName: 'মো: সেলিম মিয়া',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '০৯',
            wards: [
                { wardNumber: 62, inspectorName: 'মো: মাহমুদুল হাসান খান', inspectorSerialNumber: '১' },
                { wardNumber: 63, inspectorName: 'মোহাম্মদ আকরাম হোসেন', inspectorSerialNumber: '২' },
                { wardNumber: 64, inspectorName: 'ইমাম হোসেন হিমেল', inspectorSerialNumber: '৩' },
                { wardNumber: 65, inspectorName: 'জহিরুল রহমান', inspectorSerialNumber: '৪' }
            ]
        },
        {
            zoneNumber: 10,
            name: 'অঞ্চল-১০',
            officerName: 'মো: সেলিম মিয়া',
            officerDesignation: 'সহকারী প্রধান বর্জ্য ব্যবস্থাপনা কর্মকর্তা (অ: দা:)',
            officerSerialNumber: '১০',
            wards: [
                { wardNumber: 55, inspectorName: 'মো: আল আলাফি', inspectorSerialNumber: '১' },
                { wardNumber: 56, inspectorName: 'মোঃ আরিফুল ইসলাম খন্দকার', inspectorSerialNumber: '২' },
                { wardNumber: 60, inspectorName: 'মো: হুমায়ুন কবীর', inspectorSerialNumber: '৩' },
                { wardNumber: 61, inspectorName: 'মুবাঃ সাইফুল ইসলাম', inspectorSerialNumber: '৪' }
            ]
        }
    ],
    // DNCC data can be added later
    'DNCC': []
};

async function migrateThanaToZoneWard() {
    console.log('🚀 Starting Thana to Zone-Ward migration for DSCC...\n');

    try {
        // Process each city corporation
        for (const [cityCorpCode, zones] of Object.entries(ZONE_DATA)) {
            if (zones.length === 0) {
                console.log(`⏭️  Skipping ${cityCorpCode} (no data)\n`);
                continue;
            }

            console.log(`📍 Processing ${cityCorpCode}...`);

            // Get city corporation
            const cityCorp = await prisma.cityCorporation.findUnique({
                where: { code: cityCorpCode }
            });

            if (!cityCorp) {
                console.log(`❌ City Corporation ${cityCorpCode} not found, skipping...\n`);
                continue;
            }

            console.log(`✅ Found ${cityCorpCode}: ${cityCorp.name}\n`);

            let totalZonesCreated = 0;
            let totalWardsCreated = 0;

            // Create zones
            for (const zoneData of zones) {
                console.log(`🏢 Creating Zone ${zoneData.zoneNumber}: ${zoneData.name}`);
                console.log(`   Officer: ${zoneData.officerName}`);

                // Check if zone already exists
                const existingZone = await prisma.zone.findUnique({
                    where: {
                        zoneNumber_cityCorporationId: {
                            zoneNumber: zoneData.zoneNumber,
                            cityCorporationId: cityCorp.id
                        }
                    }
                });

                let zone;
                if (existingZone) {
                    console.log(`   ⚠️  Zone ${zoneData.zoneNumber} already exists, updating...`);
                    zone = await prisma.zone.update({
                        where: { id: existingZone.id },
                        data: {
                            name: zoneData.name,
                            officerName: zoneData.officerName,
                            officerDesignation: zoneData.officerDesignation,
                            officerSerialNumber: zoneData.officerSerialNumber
                        }
                    });
                } else {
                    zone = await prisma.zone.create({
                        data: {
                            zoneNumber: zoneData.zoneNumber,
                            name: zoneData.name,
                            cityCorporationId: cityCorp.id,
                            officerName: zoneData.officerName,
                            officerDesignation: zoneData.officerDesignation,
                            officerSerialNumber: zoneData.officerSerialNumber,
                            status: 'ACTIVE'
                        }
                    });
                    totalZonesCreated++;
                }

                console.log(`   ✅ Zone ${existingZone ? 'updated' : 'created'}: ID ${zone.id}`);
                console.log(`   📋 Creating ${zoneData.wards.length} wards...\n`);

                // Create wards for this zone
                for (const wardData of zoneData.wards) {
                    // Check if ward already exists
                    const existingWard = await prisma.ward.findUnique({
                        where: {
                            wardNumber_zoneId: {
                                wardNumber: wardData.wardNumber,
                                zoneId: zone.id
                            }
                        }
                    });

                    if (existingWard) {
                        await prisma.ward.update({
                            where: { id: existingWard.id },
                            data: {
                                inspectorName: wardData.inspectorName,
                                inspectorSerialNumber: wardData.inspectorSerialNumber
                            }
                        });
                    } else {
                        await prisma.ward.create({
                            data: {
                                wardNumber: wardData.wardNumber,
                                zoneId: zone.id,
                                inspectorName: wardData.inspectorName,
                                inspectorSerialNumber: wardData.inspectorSerialNumber,
                                status: 'ACTIVE'
                            }
                        });
                        totalWardsCreated++;
                    }

                    console.log(`      ✅ Ward ${wardData.wardNumber}: ${wardData.inspectorName}`);
                }

                console.log(''); // Empty line for readability
            }

            console.log(`\n🎉 ${cityCorpCode} Migration Summary:`);
            console.log(`   Zones created: ${totalZonesCreated}`);
            console.log(`   Wards created: ${totalWardsCreated}\n`);
        }

        console.log('✨ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('1. Run verification: node verify-zone-ward-migration.js');
        console.log('2. Add performance indexes: node add-zone-ward-indexes.js');
        console.log('3. Migrate existing users if needed');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    migrateThanaToZoneWard()
        .then(() => {
            console.log('\n✅ Migration script completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed:', error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = {
    migrateThanaToZoneWard,
    ZONE_DATA
};
