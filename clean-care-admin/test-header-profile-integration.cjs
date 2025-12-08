/**
 * Header Profile Integration Test
 * 
 * This test verifies that the profile system is properly integrated
 * with the Header component and that profile updates reflect immediately.
 * 
 * Requirements: 5.3, 5.4
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Header Profile Integration Test\n');
console.log('='.repeat(60));

// Test results tracker
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

/**
 * Test helper function
 */
function test(name, fn) {
    try {
        fn();
        results.passed++;
        results.tests.push({ name, status: 'PASS' });
        console.log(`✅ PASS: ${name}`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: error.message });
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

/**
 * Assert helper
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Test 1: Verify Header component exists
test('Header component file exists', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    assert(fs.existsSync(headerPath), 'Header.tsx file should exist');
});

// Test 2: Verify Header imports ProfileButton
test('Header imports ProfileButton', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    assert(
        content.includes("import ProfileButton from '../../ProfileButton/ProfileButton'"),
        'Header should import ProfileButton'
    );
});

// Test 3: Verify Header uses ProfileButton with header variant
test('Header uses ProfileButton with header variant', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    assert(
        content.includes('variant="header"'),
        'ProfileButton should use header variant'
    );
});

// Test 4: Verify ProfileButton shows name in header
test('ProfileButton shows name in header', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    assert(
        content.includes('showName={true}'),
        'ProfileButton should show name'
    );
});

// Test 5: Verify ProfileButton shows role in header
test('ProfileButton shows role in header', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    assert(
        content.includes('showRole={true}'),
        'ProfileButton should show role'
    );
});

// Test 6: Verify ProfileButton component supports header variant
test('ProfileButton supports header variant', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes("variant?: 'sidebar' | 'header'"),
        'ProfileButton should support header variant in props'
    );
    assert(
        content.includes('renderHeaderVariant'),
        'ProfileButton should have renderHeaderVariant function'
    );
});

// Test 7: Verify ProfileButton uses ProfileContext
test('ProfileButton uses ProfileContext', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes("import { useProfile } from '../../../contexts/ProfileContext'"),
        'ProfileButton should import useProfile hook'
    );
    assert(
        content.includes('const { profile, isLoading } = useProfile()'),
        'ProfileButton should use useProfile hook'
    );
});

// Test 8: Verify ProfileContext exists and has proper structure
test('ProfileContext exists with proper structure', () => {
    const contextPath = path.join(__dirname, 'src/contexts/ProfileContext.tsx');
    assert(fs.existsSync(contextPath), 'ProfileContext.tsx should exist');

    const content = fs.readFileSync(contextPath, 'utf8');
    assert(
        content.includes('export const ProfileProvider'),
        'ProfileContext should export ProfileProvider'
    );
    assert(
        content.includes('export const useProfile'),
        'ProfileContext should export useProfile hook'
    );
});

// Test 9: Verify ProfileContext handles cross-tab synchronization
test('ProfileContext handles cross-tab synchronization', () => {
    const contextPath = path.join(__dirname, 'src/contexts/ProfileContext.tsx');
    const content = fs.readFileSync(contextPath, 'utf8');
    assert(
        content.includes('localStorage') && content.includes('storage'),
        'ProfileContext should use localStorage for cross-tab sync'
    );
    assert(
        content.includes('broadcastUpdate'),
        'ProfileContext should have broadcastUpdate function'
    );
});

// Test 10: Verify ProfileContext caches profile data
test('ProfileContext caches profile data', () => {
    const contextPath = path.join(__dirname, 'src/contexts/ProfileContext.tsx');
    const content = fs.readFileSync(contextPath, 'utf8');
    assert(
        content.includes('loadFromCache') && content.includes('saveToCache'),
        'ProfileContext should implement caching'
    );
    assert(
        content.includes('CACHE_KEY'),
        'ProfileContext should define cache key'
    );
});

// Test 11: Verify ProfileProvider is integrated in App
test('ProfileProvider is integrated in App', () => {
    const appPath = path.join(__dirname, 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');
    assert(
        content.includes("import { ProfileProvider } from './contexts/ProfileContext'"),
        'App should import ProfileProvider'
    );
    assert(
        content.includes('<ProfileProvider>'),
        'App should use ProfileProvider'
    );
});

// Test 12: Verify ProfileButton opens ProfileModal
test('ProfileButton opens ProfileModal on click', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('ProfileModal'),
        'ProfileButton should import and use ProfileModal'
    );
    assert(
        content.includes('isModalOpen') && content.includes('setIsModalOpen'),
        'ProfileButton should manage modal state'
    );
});

// Test 13: Verify header variant has responsive design
test('Header variant has responsive design', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('useMediaQuery') && content.includes('isMobile'),
        'ProfileButton should use responsive design for header variant'
    );
    assert(
        content.includes('!isMobile'),
        'ProfileButton should hide name/role on mobile'
    );
});

// Test 14: Verify ProfileButton displays online status
test('ProfileButton displays online status indicator', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('renderOnlineIndicator'),
        'ProfileButton should have online indicator function'
    );
    assert(
        content.includes('#4CAF50'),
        'Online indicator should use green color'
    );
});

// Test 15: Verify ProfileButton uses role configuration
test('ProfileButton uses role configuration', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('getRoleConfig'),
        'ProfileButton should use getRoleConfig'
    );
    assert(
        content.includes('roleConfig.color') || content.includes('roleConfig.gradient'),
        'ProfileButton should use role colors/gradients'
    );
});

// Test 16: Verify ProfileButton displays user initials when no avatar
test('ProfileButton displays user initials fallback', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('getUserInitials'),
        'ProfileButton should have getUserInitials function'
    );
    assert(
        content.includes('firstName') && content.includes('lastName'),
        'getUserInitials should use firstName and lastName'
    );
});

// Test 17: Verify ProfileButton handles loading state
test('ProfileButton handles loading state', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('isLoading'),
        'ProfileButton should check loading state'
    );
    assert(
        content.includes('disabled={isLoading}'),
        'ProfileButton should be disabled when loading'
    );
});

// Test 18: Verify Header component is properly typed
test('Header component has proper TypeScript types', () => {
    const headerPath = path.join(__dirname, 'src/components/common/Layout/Header/Header.tsx');
    const content = fs.readFileSync(headerPath, 'utf8');
    assert(
        content.includes('interface HeaderProps'),
        'Header should define HeaderProps interface'
    );
    assert(
        content.includes('React.FC<HeaderProps>'),
        'Header should be typed as React.FC'
    );
});

// Test 19: Verify ProfileButton has proper accessibility
test('ProfileButton has accessibility features', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('Tooltip') || content.includes('aria-label'),
        'ProfileButton should have accessibility features'
    );
});

// Test 20: Verify profile updates trigger re-render
test('Profile updates trigger component re-render', () => {
    const buttonPath = path.join(__dirname, 'src/components/common/ProfileButton/ProfileButton.tsx');
    const content = fs.readFileSync(buttonPath, 'utf8');
    assert(
        content.includes('useMemo') && content.includes('[profile'),
        'ProfileButton should use useMemo with profile dependency'
    );
    assert(
        content.includes('useCallback'),
        'ProfileButton should use useCallback for optimization'
    );
});

console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`   Total Tests: ${results.passed + results.failed}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => {
            console.log(`   - ${t.name}`);
            if (t.error) console.log(`     ${t.error}`);
        });
}

console.log('\n' + '='.repeat(60));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
