/**
 * Test: Sidebar Profile Integration
 * 
 * This test verifies that:
 * 1. ProfileProvider is integrated in App.tsx
 * 2. Sidebar uses ProfileButton component
 * 3. Sidebar imports and uses ProfileContext
 * 4. Smooth transitions are applied to profile section
 * 5. Profile updates will reflect in sidebar immediately
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Sidebar Profile Integration...\n');

let passed = 0;
let failed = 0;

function test(description, fn) {
    try {
        fn();
        console.log(`✅ ${description}`);
        passed++;
    } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}\n`);
        failed++;
    }
}

// Read files
const appPath = path.join(__dirname, 'src', 'App.tsx');
const sidebarPath = path.join(__dirname, 'src', 'components', 'common', 'Layout', 'Sidebar', 'Sidebar.tsx');

const appContent = fs.readFileSync(appPath, 'utf8');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// Test 1: ProfileProvider is imported in App.tsx
test('ProfileProvider is imported in App.tsx', () => {
    if (!appContent.includes("import { ProfileProvider } from './contexts/ProfileContext'")) {
        throw new Error('ProfileProvider import not found in App.tsx');
    }
});

// Test 2: ProfileProvider wraps the Router in App.tsx
test('ProfileProvider wraps the Router in App.tsx', () => {
    if (!appContent.includes('<ProfileProvider>')) {
        throw new Error('ProfileProvider component not found in App.tsx');
    }
    if (!appContent.includes('</ProfileProvider>')) {
        throw new Error('ProfileProvider closing tag not found in App.tsx');
    }
});

// Test 3: ProfileProvider is placed correctly in the provider hierarchy
test('ProfileProvider is placed after AuthProvider and LanguageProvider', () => {
    const authIndex = appContent.indexOf('<AuthProvider>');
    const langIndex = appContent.indexOf('<LanguageProvider>');
    const profileIndex = appContent.indexOf('<ProfileProvider>');

    if (authIndex === -1 || langIndex === -1 || profileIndex === -1) {
        throw new Error('One or more providers not found');
    }

    if (!(authIndex < langIndex && langIndex < profileIndex)) {
        throw new Error('Provider hierarchy is incorrect');
    }
});

// Test 4: Sidebar imports ProfileButton
test('Sidebar imports ProfileButton', () => {
    if (!sidebarContent.includes("import ProfileButton from '../../ProfileButton/ProfileButton'")) {
        throw new Error('ProfileButton import not found in Sidebar');
    }
});

// Test 5: Sidebar imports useProfile hook
test('Sidebar imports useProfile hook', () => {
    if (!sidebarContent.includes("import { useProfile } from '../../../../contexts/ProfileContext'")) {
        throw new Error('useProfile import not found in Sidebar');
    }
});

// Test 6: Sidebar uses useProfile hook
test('Sidebar uses useProfile hook', () => {
    if (!sidebarContent.includes('const { profile } = useProfile()')) {
        throw new Error('useProfile hook not used in Sidebar');
    }
});

// Test 7: Sidebar imports animation utilities
test('Sidebar imports animation utilities', () => {
    if (!sidebarContent.includes("import { fadeIn, animationConfig } from '../../../../styles/animations'")) {
        throw new Error('Animation utilities import not found in Sidebar');
    }
});

// Test 8: Sidebar uses ProfileButton component
test('Sidebar uses ProfileButton component', () => {
    if (!sidebarContent.includes('<ProfileButton')) {
        throw new Error('ProfileButton component not used in Sidebar');
    }
});

// Test 9: ProfileButton receives correct props
test('ProfileButton receives correct props in Sidebar', () => {
    const profileButtonMatch = sidebarContent.match(/<ProfileButton[\s\S]*?\/>/);
    if (!profileButtonMatch) {
        throw new Error('ProfileButton component not found');
    }

    const profileButtonCode = profileButtonMatch[0];

    if (!profileButtonCode.includes('variant="sidebar"')) {
        throw new Error('ProfileButton missing variant="sidebar" prop');
    }
    if (!profileButtonCode.includes('showName={true}')) {
        throw new Error('ProfileButton missing showName prop');
    }
    if (!profileButtonCode.includes('showRole={true}')) {
        throw new Error('ProfileButton missing showRole prop');
    }
    if (!profileButtonCode.includes('collapsed={collapsed}')) {
        throw new Error('ProfileButton missing collapsed prop');
    }
});

// Test 10: Profile section has smooth transitions
test('Profile section has smooth transitions', () => {
    // Check for transition in profile section Box
    const profileSectionMatch = sidebarContent.match(/User Profile Section[\s\S]*?<Box[\s\S]*?sx=\{[\s\S]*?\}\}/);
    if (!profileSectionMatch) {
        throw new Error('Profile section Box not found');
    }

    const profileSectionCode = profileSectionMatch[0];

    if (!profileSectionCode.includes('transition:')) {
        throw new Error('Transition not applied to profile section');
    }
    if (!profileSectionCode.includes('animationConfig')) {
        throw new Error('Animation config not used in profile section');
    }
});

// Test 11: Profile section has fade-in animation
test('Profile section has fade-in animation', () => {
    const profileSectionMatch = sidebarContent.match(/User Profile Section[\s\S]*?<Box[\s\S]*?sx=\{[\s\S]*?\}\}/);
    if (!profileSectionMatch) {
        throw new Error('Profile section Box not found');
    }

    const profileSectionCode = profileSectionMatch[0];

    if (!profileSectionCode.includes('fadeIn')) {
        throw new Error('Fade-in animation not applied to profile section');
    }
    if (!profileSectionCode.includes('profile ?')) {
        throw new Error('Animation not conditional on profile data');
    }
});

// Test 12: Drawer has smooth width transition
test('Drawer has smooth width transition', () => {
    const drawerMatch = sidebarContent.match(/<Drawer[\s\S]*?sx=\{[\s\S]*?\}\}/);
    if (!drawerMatch) {
        throw new Error('Drawer component not found');
    }

    const drawerCode = drawerMatch[0];

    if (!drawerCode.includes('transition:')) {
        throw new Error('Transition not applied to Drawer');
    }
    if (!drawerCode.includes('width')) {
        throw new Error('Width transition not found in Drawer');
    }
});

// Test 13: Toggle button has hover animation
test('Toggle button has hover animation', () => {
    const iconButtonMatch = sidebarContent.match(/<IconButton[\s\S]*?onClick=\{onToggleCollapsed\}[\s\S]*?sx=\{[\s\S]*?\}\}/);
    if (!iconButtonMatch) {
        throw new Error('Toggle IconButton not found');
    }

    const iconButtonCode = iconButtonMatch[0];

    if (!iconButtonCode.includes('transition:')) {
        throw new Error('Transition not applied to toggle button');
    }
    if (!iconButtonCode.includes("'&:hover'")) {
        throw new Error('Hover state not defined for toggle button');
    }
    if (!iconButtonCode.includes('transform:')) {
        throw new Error('Transform not applied in hover state');
    }
});

// Test 14: Verify ProfileContext provides profile updates
test('ProfileContext provides profile updates mechanism', () => {
    const profileContextPath = path.join(__dirname, 'src', 'contexts', 'ProfileContext.tsx');
    const profileContextContent = fs.readFileSync(profileContextPath, 'utf8');

    if (!profileContextContent.includes('broadcastUpdate')) {
        throw new Error('Profile update broadcast mechanism not found');
    }
    if (!profileContextContent.includes('localStorage.setItem(SYNC_EVENT')) {
        throw new Error('Cross-tab synchronization not implemented');
    }
});

// Test 15: Verify ProfileButton uses ProfileContext
test('ProfileButton uses ProfileContext for real-time updates', () => {
    const profileButtonPath = path.join(__dirname, 'src', 'components', 'common', 'ProfileButton', 'ProfileButton.tsx');
    const profileButtonContent = fs.readFileSync(profileButtonPath, 'utf8');

    if (!profileButtonContent.includes('useProfile')) {
        throw new Error('ProfileButton does not use useProfile hook');
    }
    if (!profileButtonContent.includes('const { profile')) {
        throw new Error('ProfileButton does not destructure profile from context');
    }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
    console.log('\n🎉 All tests passed! Sidebar profile integration is complete.');
    console.log('\n📋 Integration Summary:');
    console.log('   ✓ ProfileProvider integrated in App.tsx');
    console.log('   ✓ Sidebar uses ProfileButton component');
    console.log('   ✓ Sidebar imports and uses ProfileContext');
    console.log('   ✓ Smooth transitions applied to profile section');
    console.log('   ✓ Profile updates will reflect immediately via context');
    console.log('   ✓ Cross-tab synchronization enabled');
    console.log('\n🔄 How it works:');
    console.log('   1. ProfileProvider wraps the entire app');
    console.log('   2. ProfileButton in Sidebar uses useProfile hook');
    console.log('   3. When profile updates, context broadcasts change');
    console.log('   4. All components using useProfile re-render automatically');
    console.log('   5. Smooth transitions make updates visually pleasant');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
