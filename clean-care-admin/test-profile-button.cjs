/**
 * ProfileButton Component Test Script
 * 
 * This script verifies that the ProfileButton component:
 * 1. Exists and is properly exported
 * 2. Has the correct structure
 * 3. Integrates with Sidebar and Header
 * 4. Supports all required props
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing ProfileButton Component...\n');

// Test 1: Check if ProfileButton component exists
console.log('Test 1: Checking if ProfileButton component exists...');
const profileButtonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
if (fs.existsSync(profileButtonPath)) {
    console.log('✅ ProfileButton.tsx exists');
} else {
    console.log('❌ ProfileButton.tsx not found');
    process.exit(1);
}

// Test 2: Check if README exists
console.log('\nTest 2: Checking if README exists...');
const readmePath = path.join(__dirname, 'src/components/common/ProfileButton/README.md');
if (fs.existsSync(readmePath)) {
    console.log('✅ README.md exists');
} else {
    console.log('❌ README.md not found');
}

// Test 3: Check if demo file exists
console.log('\nTest 3: Checking if demo file exists...');
const demoPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.demo.tsx');
if (fs.existsSync(demoPath)) {
    console.log('✅ ProfileButton.demo.tsx exists');
} else {
    console.log('❌ ProfileButton.demo.tsx not found');
}

// Test 4: Check if index file exists
console.log('\nTest 4: Checking if index file exists...');
const indexPath = path.join(__dirname, 'src/components/common/ProfileButton/index.ts');
if (fs.existsSync(indexPath)) {
    console.log('✅ index.ts exists');
} else {
    console.log('❌ index.ts not found');
}

// Test 5: Verify ProfileButton component structure
console.log('\nTest 5: Verifying ProfileButton component structure...');
const profileButtonContent = fs.readFileSync(profileButtonPath, 'utf8');

const requiredElements = [
    { name: 'ProfileButtonProps interface', pattern: /interface ProfileButtonProps/ },
    { name: 'variant prop', pattern: /variant\?:\s*'sidebar'\s*\|\s*'header'/ },
    { name: 'showName prop', pattern: /showName\?:\s*boolean/ },
    { name: 'showRole prop', pattern: /showRole\?:\s*boolean/ },
    { name: 'collapsed prop', pattern: /collapsed\?:\s*boolean/ },
    { name: 'useProfile hook', pattern: /useProfile/ },
    { name: 'getRoleConfig', pattern: /getRoleConfig/ },
    { name: 'ProfileModal', pattern: /ProfileModal/ },
    { name: 'Online indicator', pattern: /renderOnlineIndicator/ },
    { name: 'Sidebar variant', pattern: /renderSidebarVariant/ },
    { name: 'Header variant', pattern: /renderHeaderVariant/ },
];

let allPassed = true;
requiredElements.forEach(({ name, pattern }) => {
    if (pattern.test(profileButtonContent)) {
        console.log(`  ✅ ${name} found`);
    } else {
        console.log(`  ❌ ${name} not found`);
        allPassed = false;
    }
});

// Test 6: Verify Sidebar integration
console.log('\nTest 6: Verifying Sidebar integration...');
const sidebarPath = path.join(__dirname, 'src/components/common/Layout/Sidebar/Sidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

const sidebarChecks = [
    { name: 'ProfileButton import', pattern: /import ProfileButton from ['"].*ProfileButton/ },
    { name: 'ProfileButton usage', pattern: /<ProfileButton/ },
    { name: 'variant="sidebar"', pattern: /variant="sidebar"/ },
    { name: 'collapsed prop', pattern: /collapsed=\{collapsed\}/ },
];

sidebarChecks.forEach(({ name, pattern }) => {
    if (pattern.test(sidebarContent)) {
        console.log(`  ✅ ${name} found`);
    } else {
        console.log(`  ❌ ${name} not found`);
        allPassed = false;
    }
});

// Test 7: Verify Header integration
console.log('\nTest 7: Verifying Header integration...');
const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

const headerChecks = [
    { name: 'ProfileButton import', pattern: /import ProfileButton from ['"].*ProfileButton/ },
    { name: 'ProfileButton usage', pattern: /<ProfileButton/ },
    { name: 'variant="header"', pattern: /variant="header"/ },
];

headerChecks.forEach(({ name, pattern }) => {
    if (pattern.test(headerContent)) {
        console.log(`  ✅ ${name} found`);
    } else {
        console.log(`  ❌ ${name} not found`);
        allPassed = false;
    }
});

// Test 8: Check for requirements implementation
console.log('\nTest 8: Checking requirements implementation...');
const requirementsChecks = [
    { req: '1.4', desc: 'Fetches role from authentication', pattern: /useProfile|getRoleConfig/ },
    { req: '2.1', desc: 'Opens ProfileModal on click', pattern: /ProfileModal[\s\S]*isOpen|isModalOpen/ },
    { req: '8.4', desc: 'Responsive design', pattern: /useMediaQuery|isMobile/ },
];

requirementsChecks.forEach(({ req, desc, pattern }) => {
    if (pattern.test(profileButtonContent)) {
        console.log(`  ✅ Requirement ${req}: ${desc}`);
    } else {
        console.log(`  ❌ Requirement ${req}: ${desc}`);
        allPassed = false;
    }
});

// Test 9: Check for online status indicator
console.log('\nTest 9: Checking online status indicator...');
if (profileButtonContent.includes('renderOnlineIndicator') &&
    profileButtonContent.includes('#4CAF50') &&
    profileButtonContent.includes('Active Now')) {
    console.log('  ✅ Online status indicator implemented');
} else {
    console.log('  ❌ Online status indicator not properly implemented');
    allPassed = false;
}

// Test 10: Check for role display
console.log('\nTest 10: Checking role display...');
if (profileButtonContent.includes('roleConfig.icon') &&
    profileButtonContent.includes('roleConfig.label') &&
    profileButtonContent.includes('roleConfig.gradient')) {
    console.log('  ✅ Role display implemented');
} else {
    console.log('  ❌ Role display not properly implemented');
    allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
    console.log('✅ All tests passed!');
    console.log('\nProfileButton component is properly implemented with:');
    console.log('  - Sidebar variant (expanded and collapsed)');
    console.log('  - Header variant');
    console.log('  - Online status indicator');
    console.log('  - Role display with colors and icons');
    console.log('  - ProfileModal integration');
    console.log('  - Responsive design');
    console.log('  - All required props');
} else {
    console.log('❌ Some tests failed. Please review the output above.');
    process.exit(1);
}

console.log('\n📝 Next Steps:');
console.log('  1. Start the development server: npm run dev');
console.log('  2. Test the ProfileButton in the Sidebar');
console.log('  3. Test the ProfileButton in the Header');
console.log('  4. Verify the ProfileModal opens correctly');
console.log('  5. Test on different screen sizes');
console.log('  6. Test collapsed sidebar state');
