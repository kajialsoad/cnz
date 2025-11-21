const { spawn } = require('child_process');
const path = require('path');

/**
 * Master Test Runner for Task 14: Testing and Validation
 * Runs all sub-tasks sequentially
 */

const tests = [
    {
        id: '14.1',
        name: 'City Corporation Management',
        file: 'test-city-corporation-management.js',
        requirements: '10.1, 10.2, 10.3, 10.4, 10.5, 10.8'
    },
    {
        id: '14.2',
        name: 'Thana Management',
        file: 'test-thana-management.js',
        requirements: '11.1, 11.2, 11.3, 11.4, 11.5, 11.8'
    },
    {
        id: '14.3',
        name: 'User Signup with City Corporation',
        file: 'test-signup-city-corporation-validation.js',
        requirements: '1.1, 1.2, 1.3, 1.4, 1.5, 12.4, 12.5'
    },
    {
        id: '14.4',
        name: 'User Management Filtering',
        file: 'test-user-management-filtering.js',
        requirements: '2.1, 2.2, 2.3, 2.4, 2.7, 13.1, 13.2, 13.3'
    },
    {
        id: '14.5',
        name: 'Complaint Filtering',
        file: 'test-complaint-filtering.js',
        requirements: '4.1, 4.2, 4.3, 4.4, 14.1, 14.2, 14.3'
    },
    {
        id: '14.6',
        name: 'Chat Filtering',
        file: 'test-chat-filtering.js',
        requirements: '5.1, 5.2, 5.3'
    }
];

function runTest(test) {
    return new Promise((resolve) => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🧪 Running Test ${test.id}: ${test.name}`);
        console.log(`   Requirements: ${test.requirements}`);
        console.log(`${'='.repeat(80)}\n`);

        const testPath = path.join(__dirname, test.file);
        const child = spawn('node', [testPath], {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            resolve({
                id: test.id,
                name: test.name,
                passed: code === 0
            });
        });

        child.on('error', (error) => {
            console.error(`❌ Error running test ${test.id}:`, error.message);
            resolve({
                id: test.id,
                name: test.name,
                passed: false
            });
        });
    });
}

async function runAllTests() {
    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('║' + '  🧪 TASK 14: TESTING AND VALIDATION - MASTER TEST RUNNER'.padEnd(78) + '║');
    console.log('║' + '  DSCC/DNCC Zone Management System'.padEnd(78) + '║');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\n');
    console.log('📋 Test Suite Overview:');
    tests.forEach(test => {
        console.log(`   ${test.id} - ${test.name}`);
    });
    console.log('\n');
    console.log('⚠️  Prerequisites:');
    console.log('   - Server must be running on http://localhost:4000');
    console.log('   - Database must be migrated and seeded');
    console.log('   - Super admin user must exist (phone: 01700000000, password: Admin@123)');
    console.log('\n');

    const results = [];

    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);

        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Print summary
    console.log('\n');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('║' + '  📊 FINAL TEST SUMMARY'.padEnd(78) + '║');
    console.log('║' + ' '.repeat(78) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => r.passed === false).length;

    console.log(`Total Test Suites: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('\n');

    console.log('Detailed Results:');
    results.forEach(result => {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${status} - Test ${result.id}: ${result.name}`);
    });

    console.log('\n');

    if (failed === 0) {
        console.log('🎉 All validation tests passed successfully!');
        console.log('✅ Task 14: Testing and Validation - COMPLETE');
    } else {
        console.log('⚠️  Some test suites failed. Please review the output above.');
        console.log('❌ Task 14: Testing and Validation - INCOMPLETE');
    }

    console.log('\n');
    process.exit(failed === 0 ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
