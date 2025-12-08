/**
 * Test Runner - Dynamic Admin Profile System
 * Runs all unit and integration tests
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Running All Tests for Dynamic Admin Profile System\n');
console.log('='.repeat(70));

const testResults = {
    passed: [],
    failed: [],
    skipped: []
};

/**
 * Run a test file and capture results
 */
function runTest(testPath, testName) {
    console.log(`\n📝 Running: ${testName}`);
    console.log('-'.repeat(70));

    try {
        execSync(`node "${testPath}"`, {
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        testResults.passed.push(testName);
        return true;
    } catch (error) {
        testResults.failed.push(testName);
        return false;
    }
}

/**
 * Check if test file exists
 */
function testExists(testPath) {
    return fs.existsSync(testPath);
}

// Unit Tests
console.log('\n\n🔬 UNIT TESTS');
console.log('='.repeat(70));

const unitTests = [
    {
        name: 'Role Configuration',
        path: path.join(__dirname, '../test-role-config.js')
    },
    {
        name: 'RoleBadge Component',
        path: path.join(__dirname, 'unit/test-role-badge.cjs')
    },
    {
        name: 'ProfileContext and Hooks',
        path: path.join(__dirname, 'unit/test-profile-context.cjs')
    },
    {
        name: 'AvatarUpload Component',
        path: path.join(__dirname, 'unit/test-avatar-upload.cjs')
    },
    {
        name: 'ProfileModal Component',
        path: path.join(__dirname, '../test-profile-modal.cjs')
    },
    {
        name: 'ProfileEditForm Component',
        path: path.join(__dirname, '../test-profile-edit-form.cjs')
    },
    {
        name: 'ProfileButton Component',
        path: path.join(__dirname, '../test-profile-button.cjs')
    }
];

unitTests.forEach(test => {
    if (testExists(test.path)) {
        runTest(test.path, test.name);
    } else {
        console.log(`⚠️  Skipping: ${test.name} (file not found)`);
        testResults.skipped.push(test.name);
    }
});

// Integration Tests
console.log('\n\n🔗 INTEGRATION TESTS');
console.log('='.repeat(70));

const integrationTests = [
    {
        name: 'Sidebar Integration',
        path: path.join(__dirname, '../test-sidebar-profile-integration.cjs')
    },
    {
        name: 'Header Integration',
        path: path.join(__dirname, '../test-header-profile-integration.cjs')
    },
    {
        name: 'Profile Synchronization',
        path: path.join(__dirname, '../test-profile-synchronization.cjs')
    },
    {
        name: 'Profile Workflows',
        path: path.join(__dirname, 'integration/test-profile-workflow.cjs')
    },
    {
        name: 'Error Handling',
        path: path.join(__dirname, '../test-profile-error-handling.cjs')
    },
    {
        name: 'Avatar Upload Integration',
        path: path.join(__dirname, '../test-avatar-upload.cjs')
    }
];

integrationTests.forEach(test => {
    if (testExists(test.path)) {
        runTest(test.path, test.name);
    } else {
        console.log(`⚠️  Skipping: ${test.name} (file not found)`);
        testResults.skipped.push(test.name);
    }
});

// Summary
console.log('\n\n📊 TEST SUMMARY');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testResults.passed.length}`);
console.log(`❌ Failed: ${testResults.failed.length}`);
console.log(`⚠️  Skipped: ${testResults.skipped.length}`);
console.log(`📝 Total: ${testResults.passed.length + testResults.failed.length + testResults.skipped.length}`);

if (testResults.passed.length > 0) {
    console.log('\n✅ Passed Tests:');
    testResults.passed.forEach(test => console.log(`  - ${test}`));
}

if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(test => console.log(`  - ${test}`));
}

if (testResults.skipped.length > 0) {
    console.log('\n⚠️  Skipped Tests:');
    testResults.skipped.forEach(test => console.log(`  - ${test}`));
}

// Manual Testing Reminder
console.log('\n\n📋 MANUAL TESTING');
console.log('='.repeat(70));
console.log('Automated tests complete. Please proceed with manual testing:');
console.log('');
console.log('1. Review: tests/manual/MANUAL_TESTING_GUIDE.md');
console.log('2. Test on multiple browsers (Chrome, Firefox, Safari)');
console.log('3. Test on multiple devices (Desktop, Tablet, Mobile)');
console.log('4. Test with all user roles (ADMIN, SUPER_ADMIN, MASTER_ADMIN)');
console.log('5. Complete the test completion checklist');
console.log('');
console.log('Manual testing guide: clean-care-admin/tests/manual/MANUAL_TESTING_GUIDE.md');

// Exit code
console.log('\n' + '='.repeat(70));
if (testResults.failed.length === 0) {
    console.log('✅ All automated tests passed!');
    console.log('');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review and fix issues.');
    console.log('');
    process.exit(1);
}
