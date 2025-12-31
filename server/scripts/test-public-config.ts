import { systemConfigService } from '../src/services/system-config.service';

async function main() {
    console.log('Testing SystemConfigService...');

    // Set values
    await systemConfigService.set('daily_complaint_limit', '25', 'Updated daily limit');
    await systemConfigService.set('ward_image_limit', '5', 'Updated ward image limit');

    // Verify
    const dailyLimit = await systemConfigService.get('daily_complaint_limit');
    console.log('Daily Limit:', dailyLimit); // Should be 25

    const wardLimit = await systemConfigService.get('ward_image_limit');
    console.log('Ward Image Limit:', wardLimit); // Should be 5

    console.log('✅ SystemConfigService tests passed');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // Clean up or just exit
        process.exit(0);
    });
