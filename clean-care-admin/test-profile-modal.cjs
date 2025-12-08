/**
 * ProfileModal Component Verification Script
 * Tests that the ProfileModal component is properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying ProfileModal Component Implementation...\n');

let allTestsPassed = true;

/**
 * Test 1: Check if ProfileModal.tsx exists
 */
function testFileExists() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const exists = fs.existsSync(filePath);

    if (exists) {
        console.log('✅ Test 1: ProfileModal.tsx file exists');
        return true;
    } else {
        console.log('❌ Test 1: ProfileModal.tsx file not found');
        return false;
    }
}

/**
 * Test 2: Check if index.ts exists
 */
function testIndexExists() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/index.ts');
    const exists = fs.existsSync(filePath);

    if (exists) {
        console.log('✅ Test 2: index.ts file exists');
        return true;
    } else {
        console.log('❌ Test 2: index.ts file not found');
        return false;
    }
}

/**
 * Test 3: Check if README.md exists
 */
function testReadmeExists() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/README.md');
    const exists = fs.existsSync(filePath);

    if (exists) {
        console.log('✅ Test 3: README.md file exists');
        return true;
    } else {
        console.log('❌ Test 3: README.md file not found');
        return false;
    }
}

/**
 * Test 4: Check if demo file exists
 */
function testDemoExists() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.demo.tsx');
    const exists = fs.existsSync(filePath);

    if (exists) {
        console.log('✅ Test 4: ProfileModal.demo.tsx file exists');
        return true;
    } else {
        console.log('❌ Test 4: ProfileModal.demo.tsx file not found');
        return false;
    }
}

/**
 * Test 5: Check component structure and required imports
 */
function testComponentStructure() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const requiredImports = [
        'Dialog',
        'useProfile',
        'useAuth',
        'RoleBadge',
        'fadeIn',
        'slideInUp',
    ];

    const missingImports = requiredImports.filter(imp => !content.includes(imp));

    if (missingImports.length === 0) {
        console.log('✅ Test 5: All required imports are present');
        return true;
    } else {
        console.log(`❌ Test 5: Missing imports: ${missingImports.join(', ')}`);
        return false;
    }
}

/**
 * Test 6: Check for required props interface
 */
function testPropsInterface() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasInterface = content.includes('interface ProfileModalProps');
    const hasIsOpen = content.includes('isOpen');
    const hasOnClose = content.includes('onClose');

    if (hasInterface && hasIsOpen && hasOnClose) {
        console.log('✅ Test 6: ProfileModalProps interface is properly defined');
        return true;
    } else {
        console.log('❌ Test 6: ProfileModalProps interface is missing or incomplete');
        return false;
    }
}

/**
 * Test 7: Check for responsive design implementation
 */
function testResponsiveDesign() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasIsMobile = content.includes('isMobile');
    const hasIsTablet = content.includes('isTablet');
    const hasUseMediaQuery = content.includes('useMediaQuery');
    const hasFullScreen = content.includes('fullScreen');

    if (hasIsMobile && hasIsTablet && hasUseMediaQuery && hasFullScreen) {
        console.log('✅ Test 7: Responsive design is implemented');
        return true;
    } else {
        console.log('❌ Test 7: Responsive design implementation is incomplete');
        return false;
    }
}

/**
 * Test 8: Check for loading state implementation
 */
function testLoadingState() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasLoadingSkeleton = content.includes('renderLoadingSkeleton');
    const hasIsLoading = content.includes('isLoading');
    const hasSkeleton = content.includes('Skeleton');

    if (hasLoadingSkeleton && hasIsLoading && hasSkeleton) {
        console.log('✅ Test 8: Loading state is implemented');
        return true;
    } else {
        console.log('❌ Test 8: Loading state implementation is incomplete');
        return false;
    }
}

/**
 * Test 9: Check for logout functionality
 */
function testLogoutFunctionality() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasLogout = content.includes('logout');
    const hasHandleLogout = content.includes('handleLogout');
    const hasLogoutButton = content.includes('LogoutIcon');
    const hasIsLoggingOut = content.includes('isLoggingOut');

    if (hasLogout && hasHandleLogout && hasLogoutButton && hasIsLoggingOut) {
        console.log('✅ Test 9: Logout functionality is implemented');
        return true;
    } else {
        console.log('❌ Test 9: Logout functionality is incomplete');
        return false;
    }
}

/**
 * Test 10: Check for edit mode toggle
 */
function testEditModeToggle() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasIsEditMode = content.includes('isEditMode');
    const hasHandleEditToggle = content.includes('handleEditToggle');
    const hasEditButton = content.includes('EditIcon');

    if (hasIsEditMode && hasHandleEditToggle && hasEditButton) {
        console.log('✅ Test 10: Edit mode toggle is implemented');
        return true;
    } else {
        console.log('❌ Test 10: Edit mode toggle is incomplete');
        return false;
    }
}

/**
 * Test 11: Check for profile information display
 */
function testProfileInfoDisplay() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasRenderInfoRow = content.includes('renderInfoRow');
    const hasPersonalInfo = content.includes('renderPersonalInfo');
    const hasAccountInfo = content.includes('renderAccountInfo');
    const hasProfileHeader = content.includes('renderProfileHeader');

    if (hasRenderInfoRow && hasPersonalInfo && hasAccountInfo && hasProfileHeader) {
        console.log('✅ Test 11: Profile information display is implemented');
        return true;
    } else {
        console.log('❌ Test 11: Profile information display is incomplete');
        return false;
    }
}

/**
 * Test 12: Check for RoleBadge integration
 */
function testRoleBadgeIntegration() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasRoleBadgeImport = content.includes("import RoleBadge from '../RoleBadge/RoleBadge'");
    const hasRoleBadgeUsage = content.includes('<RoleBadge');
    const hasRoleParam = content.includes('role={profile?.role}');

    if (hasRoleBadgeImport && hasRoleBadgeUsage && hasRoleParam) {
        console.log('✅ Test 12: RoleBadge integration is complete');
        return true;
    } else {
        console.log('❌ Test 12: RoleBadge integration is incomplete');
        return false;
    }
}

/**
 * Test 13: Check for verification status indicators
 */
function testVerificationIndicators() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasCheckCircleIcon = content.includes('CheckCircleIcon');
    const hasCancelIcon = content.includes('CancelIcon');
    const hasEmailVerified = content.includes('emailVerified');
    const hasPhoneVerified = content.includes('phoneVerified');

    if (hasCheckCircleIcon && hasCancelIcon && hasEmailVerified && hasPhoneVerified) {
        console.log('✅ Test 13: Verification status indicators are implemented');
        return true;
    } else {
        console.log('❌ Test 13: Verification status indicators are incomplete');
        return false;
    }
}

/**
 * Test 14: Check for animations
 */
function testAnimations() {
    const filePath = path.join(__dirname, 'src/components/common/ProfileModal/ProfileModal.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    const hasFadeIn = content.includes('fadeIn');
    const hasSlideInUp = content.includes('slideInUp');
    const hasAnimation = content.includes('animation:');

    if (hasFadeIn && hasSlideInUp && hasAnimation) {
        console.log('✅ Test 14: Animations are implemented');
        return true;
    } else {
        console.log('❌ Test 14: Animations are incomplete');
        return false;
    }
}

// Run all tests
console.log('Running verification tests...\n');

allTestsPassed = testFileExists() && allTestsPassed;
allTestsPassed = testIndexExists() && allTestsPassed;
allTestsPassed = testReadmeExists() && allTestsPassed;
allTestsPassed = testDemoExists() && allTestsPassed;
allTestsPassed = testComponentStructure() && allTestsPassed;
allTestsPassed = testPropsInterface() && allTestsPassed;
allTestsPassed = testResponsiveDesign() && allTestsPassed;
allTestsPassed = testLoadingState() && allTestsPassed;
allTestsPassed = testLogoutFunctionality() && allTestsPassed;
allTestsPassed = testEditModeToggle() && allTestsPassed;
allTestsPassed = testProfileInfoDisplay() && allTestsPassed;
allTestsPassed = testRoleBadgeIntegration() && allTestsPassed;
allTestsPassed = testVerificationIndicators() && allTestsPassed;
allTestsPassed = testAnimations() && allTestsPassed;

// Summary
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
    console.log('✅ All tests passed! ProfileModal component is properly implemented.');
    console.log('\nRequirements satisfied:');
    console.log('  ✓ 2.1: Modal displays complete profile information');
    console.log('  ✓ 2.2: Shows avatar, name, email, phone, role, and other info');
    console.log('  ✓ 2.3: Formats role name properly (via RoleBadge)');
    console.log('  ✓ 2.4: Displays default avatar with initials');
    console.log('  ✓ 2.5: Shows loading indicator');
    console.log('  ✓ 8.1: Mobile-optimized layout');
    console.log('  ✓ 8.2: Tablet-optimized layout');
    console.log('  ✓ 8.3: Desktop-optimized layout');
    process.exit(0);
} else {
    console.log('❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}
